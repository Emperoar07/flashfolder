import { createReadStream } from "node:fs";
import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { appConfig } from "@/lib/config";
import { StorageError } from "@/lib/storage/errors";
import type { StorageAdapter } from "@/lib/storage/types";

function resolveBlobPath(blobKey: string) {
  return path.join(process.cwd(), appConfig.storageRoot, blobKey);
}

async function walk(currentPath: string): Promise<string[]> {
  const entries = await readdir(currentPath, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) return walk(fullPath);
      return [fullPath];
    }),
  );

  return nested.flat();
}

export const localStorageAdapter: StorageAdapter = {
  descriptor: {
    name: appConfig.storageMode === "mock" ? "Mock Storage" : "Local Storage",
    mode: appConfig.storageMode === "mock" ? "mock" : "local",
    provider: "local",
    implemented: true,
    configured: true,
    integrationState: "active",
    supportsByteRanges: true,
    supportsListing: true,
    supportsMetadata: true,
    notes: "Filesystem-backed adapter for local development and fallback mode.",
  },
  async uploadFile({ blobKey, buffer, mimeType }) {
    const destination = resolveBlobPath(blobKey);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, buffer);
    return {
      provider: "local",
      blobKey,
      metadata: {
        blobKey,
        provider: "local",
        byteLength: buffer.byteLength,
        mimeType,
      },
    };
  },
  async downloadFile(blobKey) {
    try {
      const fullPath = resolveBlobPath(blobKey);
      const [buffer, fileStats] = await Promise.all([readFile(fullPath), stat(fullPath)]);
      return {
        buffer,
        metadata: {
          provider: "local",
          blobKey,
          byteLength: fileStats.size,
        },
      };
    } catch (error) {
      throw new StorageError("NOT_FOUND", "Stored file was not found.", {
        cause: error,
        status: 404,
      });
    }
  },
  async getFileStream(blobKey) {
    try {
      const fullPath = resolveBlobPath(blobKey);
      const fileStats = await stat(fullPath);
      return {
        stream: createReadStream(fullPath),
        metadata: {
          provider: "local",
          blobKey,
          byteLength: fileStats.size,
        },
      };
    } catch (error) {
      throw new StorageError("NOT_FOUND", "Stored file was not found.", {
        cause: error,
        status: 404,
      });
    }
  },
  async getFileRange(blobKey, start, end) {
    try {
      const fullPath = resolveBlobPath(blobKey);
      const fileStats = await stat(fullPath);

      if (start < 0 || end < start || end >= fileStats.size) {
        throw new StorageError("INVALID_RANGE", "Requested byte range is invalid.", {
          status: 416,
        });
      }

      return {
        stream: createReadStream(fullPath, { start, end }),
        totalSize: fileStats.size,
        contentLength: end - start + 1,
        start,
        end,
        metadata: {
          provider: "local",
          blobKey,
          byteLength: fileStats.size,
        },
      };
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }

      throw new StorageError("NOT_FOUND", "Stored file was not found.", {
        cause: error,
        status: 404,
      });
    }
  },
  async deleteFile(blobKey) {
    try {
      await unlink(resolveBlobPath(blobKey));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return;
      }
      throw new StorageError("DELETE_FAILED", "Unable to delete stored file.", {
        cause: error,
      });
    }
  },
  async listFiles(prefix = "") {
    const root = path.join(process.cwd(), appConfig.storageRoot, prefix);
    await mkdir(root, { recursive: true });
    const files = await walk(root);
    return files.map((filePath) =>
      path.relative(path.join(process.cwd(), appConfig.storageRoot), filePath),
    );
  },
  async getMetadata(blobKey) {
    try {
      const fileStats = await stat(resolveBlobPath(blobKey));
      return {
        provider: "local",
        blobKey,
        byteLength: fileStats.size,
      };
    } catch (error) {
      throw new StorageError("NOT_FOUND", "Stored file was not found.", {
        cause: error,
        status: 404,
      });
    }
  },
};
