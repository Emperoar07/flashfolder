"use client";

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
  const MAX_SIZE = 4.5 * 1024 * 1024; // 4.5MB Vercel Blob limit

  // For now, only support uploads under 4.5MB
  if (fileSize > MAX_SIZE) {
    throw new Error(`File size (${Math.round(fileSize / 1024 / 1024)}MB) exceeds 4.5MB limit. Please upload a smaller file.`);
  }

  // Upload file directly
  const formData = new FormData();
  formData.set("file", file);
  if (description) formData.set("description", description);
  if (folderId) formData.set("folderId", folderId);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
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
          resolve(JSON.parse(xhr.responseText) as { file: any });
        } catch {
          reject(new Error("Invalid server response"));
        }
      } else {
        try {
          const body = JSON.parse(xhr.responseText) as { error?: string };
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
