import { createReadStream } from "node:fs";
import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { appConfig } from "@/lib/config";
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
  name: "Local Mock Storage",
  mode: "local",
  async uploadFile({ blobKey, buffer }) {
    const destination = resolveBlobPath(blobKey);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, buffer);
  },
  async downloadFile(blobKey) {
    return readFile(resolveBlobPath(blobKey));
  },
  async getFileStream(blobKey) {
    return createReadStream(resolveBlobPath(blobKey));
  },
  async getFileRange(blobKey, start, end) {
    const fullPath = resolveBlobPath(blobKey);
    const fileStats = await stat(fullPath);

    return {
      stream: createReadStream(fullPath, { start, end }),
      totalSize: fileStats.size,
      contentLength: end - start + 1,
    };
  },
  async deleteFile(blobKey) {
    try {
      await unlink(resolveBlobPath(blobKey));
    } catch {
      // Ignore cleanup failures for already-removed files.
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
};
