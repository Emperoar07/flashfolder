import type { StorageAdapter } from "@/lib/storage/types";

const unsupported = () => {
  throw new Error(
    "Shelby adapter is scaffolded but not wired yet. Add real Shelby credentials and SDK calls when early access is approved.",
  );
};

export const shelbyStorageAdapter: StorageAdapter = {
  name: "Shelby Protocol",
  mode: "shelby",
  async uploadFile() {
    // TODO: Replace this with Shelby SDK multipart upload logic.
    return unsupported();
  },
  async downloadFile(): Promise<Buffer> {
    // TODO: Replace this with Shelby download logic.
    return unsupported() as never;
  },
  async getFileStream() {
    // TODO: Replace this with Shelby streaming reads.
    return unsupported();
  },
  async getFileRange() {
    // TODO: Replace this with Shelby range requests for media previews.
    return unsupported();
  },
  async deleteFile() {
    // TODO: Replace this with Shelby delete or tombstone behavior if supported.
    return unsupported();
  },
  async listFiles(): Promise<string[]> {
    // TODO: Replace this with Shelby blob listing for a namespace.
    return unsupported() as never;
  },
};
