"use client";

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunks (under Vercel Blob's 4.5MB limit)

export type UploadProgressCallback = (progress: {
  phase: "signing" | "uploading";
  loaded: number;
  total: number;
  percent: number;
}) => void;

export async function uploadFileChunked({
  file,
  folderId,
  description,
  walletAddress,
  onProgress,
}: {
  file: File;
  folderId: string | null;
  description: string | null;
  walletAddress: string;
  onProgress: UploadProgressCallback;
}): Promise<{ file: any }> {
  const fileSize = file.size;
  const chunkCount = Math.ceil(fileSize / CHUNK_SIZE);
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // For single-chunk files, upload directly
  if (chunkCount === 1) {
    const formData = new FormData();
    formData.set("file", file);
    if (description) formData.set("description", description);
    if (folderId) formData.set("folderId", folderId);

    const xhr = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress({
            phase: "uploading",
            loaded: e.loaded,
            total: e.total,
            percent: Math.round((e.loaded / e.total) * 100),
          });
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error("Invalid server response"));
          }
        } else {
          try {
            const body = JSON.parse(xhr.responseText);
            reject(new Error(body.error ?? "Upload failed"));
          } catch {
            reject(new Error("Upload failed"));
          }
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Network error")));
      xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

      xhr.open("POST", "/api/files/upload");
      xhr.setRequestHeader("x-wallet-address", walletAddress);
      xhr.send(formData);
    });
  }

  // For multi-chunk files, upload sequentially
  let totalLoaded = 0;

  for (let i = 0; i < chunkCount; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, fileSize);
    const chunk = file.slice(start, end);

    await new Promise<void>((resolve, reject) => {
      const formData = new FormData();
      formData.set("file", chunk);
      formData.set("uploadId", uploadId);
      formData.set("chunkIndex", i.toString());
      formData.set("chunkCount", chunkCount.toString());
      if (description && i === 0) formData.set("description", description);
      if (folderId && i === 0) formData.set("folderId", folderId);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const chunkLoaded = e.loaded;
          const allPrevLoaded = i * CHUNK_SIZE;
          totalLoaded = allPrevLoaded + chunkLoaded;

          onProgress({
            phase: "uploading",
            loaded: totalLoaded,
            total: fileSize,
            percent: Math.round((totalLoaded / fileSize) * 100),
          });
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          totalLoaded = end;
          onProgress({
            phase: "uploading",
            loaded: totalLoaded,
            total: fileSize,
            percent: Math.round((totalLoaded / fileSize) * 100),
          });
          resolve();
        } else {
          try {
            const body = JSON.parse(xhr.responseText);
            reject(new Error(body.error ?? `Chunk ${i} upload failed`));
          } catch {
            reject(new Error(`Chunk ${i} upload failed`));
          }
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Network error during chunk upload")));
      xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

      xhr.open("POST", "/api/files/upload");
      xhr.setRequestHeader("x-wallet-address", walletAddress);
      xhr.send(formData);
    });
  }

  // All chunks uploaded, finalize
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Invalid server response"));
        }
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          reject(new Error(body.error ?? "Finalization failed"));
        } catch {
          reject(new Error("Finalization failed"));
        }
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during finalization")));
    xhr.addEventListener("abort", () => reject(new Error("Finalization cancelled")));

    xhr.open("POST", "/api/files/upload/finalize");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("x-wallet-address", walletAddress);
    xhr.send(JSON.stringify({ uploadId, fileSize }));
  });
}
