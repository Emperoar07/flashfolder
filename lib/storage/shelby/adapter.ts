import { createShelbyClient, getShelbyClientConfig, isShelbyConfigured } from "@/lib/storage/shelby/client";
import { StorageError } from "@/lib/storage/errors";
import type { StorageAdapter } from "@/lib/storage/types";

function unsupported(message: string): never {
  throw new StorageError("NOT_IMPLEMENTED", message, {
    status: 503,
  });
}

export function createShelbyStorageAdapter(): StorageAdapter {
  const config = getShelbyClientConfig();
  const configured = isShelbyConfigured(config);
  const reason = configured
    ? "Shelby credentials are present, but the SDK calls are still scaffolded."
    : "Shelby mode needs API key, RPC URL, and namespace before it can be activated.";

  return {
    descriptor: {
      name: "Shelby Protocol",
      mode: "shelby",
      provider: "shelby",
      implemented: false,
      configured,
      integrationState: configured ? "scaffolded" : "ready_for_credentials",
      supportsByteRanges: true,
      supportsListing: true,
      supportsMetadata: true,
      notes:
        "Use this adapter once early access, credentials, and exact SDK flows are available.",
      reason,
    },
    async uploadFile({ blobKey, buffer, mimeType }): Promise<import("@/lib/storage/types").UploadFileResult> {
      const client = createShelbyClient();

      if (!configured) {
        throw new StorageError("NOT_CONFIGURED", reason, { status: 503 });
      }

      void client;
      void blobKey;
      void buffer;
      void mimeType;

      // TODO: Initialize the real Shelby SDK client with the config above.
      // TODO: Perform multipart upload or chunked blob upload here.
      // TODO: Return provider metadata like blob ID, namespace, etag, or checksum.
      return unsupported("Shelby uploads are scaffolded but not implemented yet.");
    },
    async downloadFile(blobKey): Promise<import("@/lib/storage/types").DownloadFileResult> {
      void blobKey;

      if (!configured) {
        throw new StorageError("NOT_CONFIGURED", reason, { status: 503 });
      }

      // TODO: Fetch the full blob from Shelby and map provider metadata.
      return unsupported("Shelby downloads are scaffolded but not implemented yet.");
    },
    async getFileStream(blobKey): Promise<import("@/lib/storage/types").FileStreamResult> {
      void blobKey;

      if (!configured) {
        throw new StorageError("NOT_CONFIGURED", reason, { status: 503 });
      }

      // TODO: Return a Node readable stream for the stored blob.
      return unsupported("Shelby streaming reads are scaffolded but not implemented yet.");
    },
    async getFileRange(blobKey, start, end): Promise<import("@/lib/storage/types").FileRangeResult> {
      void blobKey;
      void start;
      void end;

      if (!configured) {
        throw new StorageError("NOT_CONFIGURED", reason, { status: 503 });
      }

      // TODO: Map HTTP byte ranges to Shelby range or partial-read capabilities.
      return unsupported("Shelby range reads are scaffolded but not implemented yet.");
    },
    async deleteFile(blobKey): Promise<void> {
      void blobKey;

      if (!configured) {
        throw new StorageError("NOT_CONFIGURED", reason, { status: 503 });
      }

      // TODO: Call Shelby delete or provider-specific tombstone behavior if exposed.
      return unsupported("Shelby delete handling is scaffolded but not implemented yet.");
    },
    async listFiles(prefix = ""): Promise<string[]> {
      void prefix;

      if (!configured) {
        throw new StorageError("NOT_CONFIGURED", reason, { status: 503 });
      }

      // TODO: Enumerate blobs within the configured namespace/prefix.
      return unsupported("Shelby listing is scaffolded but not implemented yet.");
    },
    async getMetadata(blobKey): Promise<import("@/lib/storage/types").StoredObjectMetadata> {
      void blobKey;

      if (!configured) {
        throw new StorageError("NOT_CONFIGURED", reason, { status: 503 });
      }

      // TODO: Fetch metadata/head information for the Shelby object.
      return unsupported("Shelby metadata reads are scaffolded but not implemented yet.");
    },
  };
}
