import { del, head, list, put } from "@vercel/blob";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

import { appConfig } from "@/lib/config";
import { StorageError } from "@/lib/storage/errors";
import type {
  FileRangeResult,
  StoredObjectMetadata,
  StorageAdapter,
} from "@/lib/storage/types";

const VERCEL_BLOB_SERVER_UPLOAD_LIMIT_BYTES = 4.5 * 1024 * 1024;

function getBlobToken() {
  return appConfig.blob.readWriteToken;
}

function ensureBlobConfigured() {
  const token = getBlobToken();
  if (!token) {
    throw new StorageError(
      "NOT_CONFIGURED",
      "Vercel Blob mode requires BLOB_READ_WRITE_TOKEN.",
      { status: 503 },
    );
  }

  return token;
}

function buildMetadata(
  blobKey: string,
  metadata?: {
    url?: string;
    contentType?: string | null;
    contentDisposition?: string | null;
    size?: number;
    uploadedAt?: Date;
    pathname?: string;
  },
  etag?: string | null,
): StoredObjectMetadata {
  return {
    provider: "blob",
    blobKey,
    mimeType: metadata?.contentType ?? undefined,
    byteLength: metadata?.size ?? undefined,
    etag: etag ?? null,
    version: metadata?.uploadedAt?.toISOString() ?? null,
    checksum: null,
  };
}

function mapBlobError(
  error: unknown,
  fallback: string,
  code: "UPLOAD_FAILED" | "DOWNLOAD_FAILED" | "DELETE_FAILED",
): never {
  if (error instanceof StorageError) {
    throw error;
  }

  if (error instanceof Error && /404|not found/i.test(error.message)) {
    throw new StorageError("NOT_FOUND", "Stored blob was not found.", {
      cause: error,
      status: 404,
    });
  }

  throw new StorageError(code, fallback, {
    cause: error,
    status: code === "DELETE_FAILED" ? 500 : 503,
  });
}

async function fetchBlob(args: {
  blobKey: string;
  rangeHeader?: string;
}) {
  const token = ensureBlobConfigured();
  const blob = await head(args.blobKey, { token });
  const response = await fetch(blob.url, {
    headers: {
      ...(args.rangeHeader ? { Range: args.rangeHeader } : {}),
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    throw new StorageError("NOT_FOUND", "Stored blob was not found.", {
      status: 404,
    });
  }

  if (response.status === 416) {
    throw new StorageError("INVALID_RANGE", "Requested byte range is invalid.", {
      status: 416,
    });
  }

  if (!response.ok || !response.body) {
    throw new StorageError("DOWNLOAD_FAILED", "Unable to read blob content.", {
      status: 503,
    });
  }

  return { blob, response };
}

function parseContentRange(contentRangeHeader: string | null, totalFallback: number): FileRangeResult | null {
  if (!contentRangeHeader) {
    return null;
  }

  const match = /bytes (\d+)-(\d+)\/(\d+|\*)/.exec(contentRangeHeader);
  if (!match) {
    return null;
  }

  const start = Number.parseInt(match[1]!, 10);
  const end = Number.parseInt(match[2]!, 10);
  const totalSize =
    match[3] === "*" ? totalFallback : Number.parseInt(match[3]!, 10);

  return {
    stream: Readable.from([]),
    totalSize,
    contentLength: end - start + 1,
    start,
    end,
    metadata: {
      provider: "blob",
      blobKey: "",
      byteLength: totalSize,
    },
  };
}

export const blobStorageAdapter: StorageAdapter = {
  descriptor: {
    name: "Vercel Blob",
    mode: "blob",
    provider: "blob",
    implemented: true,
    configured: Boolean(appConfig.blob.readWriteToken),
    integrationState: appConfig.blob.readWriteToken ? "active" : "not_configured",
    supportsByteRanges: true,
    supportsListing: true,
    supportsMetadata: true,
    maxUploadBytes: VERCEL_BLOB_SERVER_UPLOAD_LIMIT_BYTES,
    notes:
      "Temporary production-safe blob storage on Vercel. Use private blobs and backend-gated reads.",
    reason: appConfig.blob.readWriteToken
      ? undefined
      : "Connect a Vercel Blob store to provision BLOB_READ_WRITE_TOKEN.",
  },
  async uploadFile({ blobKey, buffer, mimeType }) {
    try {
      const token = ensureBlobConfigured();
      const uploaded = await put(blobKey, buffer, {
        access: "public",
        addRandomSuffix: false,
        contentType: mimeType,
        allowOverwrite: true,
        token,
      });

      return {
        provider: "blob",
        blobKey: uploaded.pathname,
        metadata: {
          blobKey: uploaded.pathname,
          provider: "blob",
          url: uploaded.url,
          downloadUrl: uploaded.downloadUrl,
          pathname: uploaded.pathname,
          mimeType,
          byteLength: buffer.byteLength,
        },
      };
    } catch (error) {
      mapBlobError(error, "Blob upload failed.", "UPLOAD_FAILED");
    }
  },
  async downloadFile(blobKey) {
    try {
      const { blob, response } = await fetchBlob({ blobKey });
      const arrayBuffer = await response.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        metadata: buildMetadata(blobKey, blob, response.headers.get("etag")),
      };
    } catch (error) {
      mapBlobError(error, "Blob download failed.", "DOWNLOAD_FAILED");
    }
  },
  async getFileStream(blobKey) {
    try {
      const { blob, response } = await fetchBlob({ blobKey });
      return {
        stream: Readable.fromWeb(response.body as unknown as NodeReadableStream),
        metadata: buildMetadata(blobKey, blob, response.headers.get("etag")),
      };
    } catch (error) {
      mapBlobError(error, "Blob stream failed.", "DOWNLOAD_FAILED");
    }
  },
  async getFileRange(blobKey, start, end) {
    try {
      const { blob, response } = await fetchBlob({
        blobKey,
        rangeHeader: `bytes=${start}-${end}`,
      });
      const parsed = parseContentRange(
        response.headers.get("content-range"),
        blob.size,
      );

      if (!parsed) {
        throw new StorageError("INVALID_RANGE", "Blob provider did not return a valid content range.", {
          status: 416,
        });
      }

      return {
        stream: Readable.fromWeb(response.body as unknown as NodeReadableStream),
        totalSize: parsed.totalSize,
        contentLength: parsed.contentLength,
        start: parsed.start,
        end: parsed.end,
        metadata: buildMetadata(blobKey, blob, response.headers.get("etag")),
      };
    } catch (error) {
      mapBlobError(error, "Blob range request failed.", "DOWNLOAD_FAILED");
    }
  },
  async deleteFile(blobKey) {
    try {
      const token = ensureBlobConfigured();
      await del(blobKey, { token });
    } catch (error) {
      mapBlobError(error, "Unable to delete stored blob.", "DELETE_FAILED");
    }
  },
  async listFiles(prefix = "") {
    try {
      const token = ensureBlobConfigured();
      const pathnames: string[] = [];
      let cursor: string | undefined;

      do {
        const page = await list({
          prefix,
          cursor,
          token,
        });
        pathnames.push(...page.blobs.map((blob) => blob.pathname));
        cursor = page.cursor;
      } while (cursor);

      return pathnames;
    } catch (error) {
      mapBlobError(error, "Unable to list stored blobs.", "DOWNLOAD_FAILED");
    }
  },
  async getMetadata(blobKey) {
    try {
      const token = ensureBlobConfigured();
      const blob = await head(blobKey, { token });
      return buildMetadata(blobKey, blob, null);
    } catch (error) {
      mapBlobError(error, "Unable to read blob metadata.", "DOWNLOAD_FAILED");
    }
  },
};
