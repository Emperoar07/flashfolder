"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspaceWallet } from "@/components/wallet-status";
import { useFiles } from "@/lib/client/hooks";
import { uploadFileChunked } from "@/lib/client/upload-chunked";
import { PREVIEW_TYPES, type PreviewTypeValue } from "@/lib/file-kinds";
import { formatBytes } from "@/lib/utils";

function iconClass(type: PreviewTypeValue) {
  switch (type) {
    case PREVIEW_TYPES.IMAGE:
      return "img";
    case PREVIEW_TYPES.VIDEO:
      return "vid";
    case PREVIEW_TYPES.PDF:
    case PREVIEW_TYPES.TEXT:
      return "doc";
    default:
      return "zip";
  }
}

function iconEmoji(type: PreviewTypeValue) {
  switch (type) {
    case PREVIEW_TYPES.IMAGE:
      return "\u{1F5BC}";
    case PREVIEW_TYPES.VIDEO:
      return "\u25B6";
    case PREVIEW_TYPES.PDF:
    case PREVIEW_TYPES.TEXT:
      return "\u{1F4C4}";
    case PREVIEW_TYPES.AUDIO:
      return "\u{1F3B5}";
    default:
      return "\u{1F4E6}";
  }
}

function mimeLabel(mime: string) {
  if (mime.startsWith("image/")) return `${mime.split("/")[1]?.toUpperCase()} Image`;
  if (mime.startsWith("video/")) return `${mime.split("/")[1]?.toUpperCase()} Video`;
  if (mime.startsWith("audio/")) return `${mime.split("/")[1]?.toUpperCase()} Audio`;
  if (mime.includes("pdf")) return "PDF Document";
  if (mime.includes("zip") || mime.includes("archive")) return "ZIP Archive";
  return mime.split("/")[1]?.toUpperCase() ?? "File";
}

const PREVIEW_FILES = [
  { name: "cover-art-final.png", meta: "PNG Image", size: "4.2 MB", icon: "img", emoji: "\u{1F5BC}" },
  { name: "teaser-clip.mp4", meta: "MP4 Video", size: "28 MB", icon: "vid", emoji: "\u25B6" },
  { name: "whitepaper-v3.pdf", meta: "PDF Document", size: "1.8 MB", icon: "doc", emoji: "\u{1F4C4}" },
  { name: "source-assets.zip", meta: "ZIP Archive", size: "156 MB", icon: "zip", emoji: "\u{1F4E6}" },
];

function QuickUploadModal({ walletAddress, onClose }: { walletAddress: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    setFile(accepted[0] ?? null);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ multiple: false, onDrop });

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleUpload() {
    if (!file) return;
    setPhase("uploading");
    setProgress(0);
    setError(null);
    try {
      await uploadFileChunked({
        file,
        folderId: null,
        description: null,
        walletAddress,
        onProgress: ({ percent }) => setProgress(percent),
      });
      setPhase("done");
      setProgress(100);
      void queryClient.invalidateQueries({ queryKey: ["files", walletAddress] });
      setTimeout(onClose, 1200);
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  return (
    <div className="quick-upload-overlay" onClick={onClose}>
      <div className="quick-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="quick-upload-header">
          <span>Quick Upload</span>
          <button className="quick-upload-close" onClick={onClose}>✕</button>
        </div>

        {phase === "done" ? (
          <div className="quick-upload-body" style={{ textAlign: "center", padding: "32px 20px" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
            <p style={{ fontSize: 13, color: "var(--foreground)" }}>Upload complete!</p>
          </div>
        ) : (
          <div className="quick-upload-body">
            <div
              {...getRootProps()}
              className={`quick-upload-dropzone${isDragActive ? " active" : ""}`}
            >
              <input {...getInputProps()} />
              <div style={{ fontSize: 22, marginBottom: 6 }}>☁</div>
              <p>{file ? file.name : "Drop a file or click to browse"}</p>
              {file && <p className="quick-upload-file-size">{formatBytes(file.size)}</p>}
            </div>

            {phase === "uploading" && (
              <div className="quick-upload-progress">
                <div className="quick-upload-progress-bar" style={{ width: `${progress}%` }} />
              </div>
            )}

            {error && <p className="quick-upload-error">{error}</p>}

            <button
              className="quick-upload-submit"
              disabled={!file || phase === "uploading"}
              onClick={handleUpload}
            >
              {phase === "uploading" ? `Uploading ${progress}%` : "Upload"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function WorkspacePreviewCard() {
  const { walletAddress, connected } = useWorkspaceWallet();
  const filesQuery = useFiles(walletAddress);
  const files = filesQuery.data?.files ?? [];
  const isLoading = filesQuery.isLoading;
  const realFiles = files.slice(0, 4);
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="preview-card">
      <div className="preview-card-header">
        <span>My Workspace</span>
        <div className="preview-card-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="preview-card-body">
        {!connected
          ? PREVIEW_FILES.map((file) => (
              <div key={file.name} className="file-row">
                <div className={`file-icon ${file.icon}`}>{file.emoji}</div>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">{file.meta}</div>
                </div>
                <div className="file-size">{file.size}</div>
              </div>
            ))
          : isLoading
            ? (
              <div style={{ padding: "24px 0", textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>
                Loading files...
              </div>
            )
            : realFiles.length > 0
              ? realFiles.map((file) => (
                  <div
                    key={file.id}
                    className="file-row"
                    onClick={() => router.push(`/files/${file.id}`)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") router.push(`/files/${file.id}`); }}
                  >
                    <div className={`file-icon ${iconClass(file.previewType)}`}>
                      {iconEmoji(file.previewType)}
                    </div>
                    <div className="file-info">
                      <div className="file-name">{file.filename}</div>
                      <div className="file-meta">{mimeLabel(file.mimeType)}</div>
                    </div>
                    <div className="file-size">{formatBytes(file.size)}</div>
                  </div>
                ))
              : (
                <div style={{ padding: "24px 0", textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>
                  No files yet. Upload from your dashboard.
                </div>
              )}
      </div>
      {connected && (
        <div className="preview-card-footer">
          <Link href="/dashboard" className="preview-card-link">
            View All →
          </Link>
          <button className="preview-card-upload-btn" onClick={() => setShowUpload(true)}>
            ↑ Quick Upload
          </button>
        </div>
      )}
      {showUpload && (
        <QuickUploadModal walletAddress={walletAddress} onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
}
