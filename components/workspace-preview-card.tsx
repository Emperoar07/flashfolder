"use client";

import { useWorkspaceWallet } from "@/components/wallet-status";
import { useFiles } from "@/lib/client/hooks";
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

const DEMO_FILES = [
  { name: "cover-art-final.png", meta: "PNG Image", size: "4.2 MB", icon: "img", emoji: "\u{1F5BC}" },
  { name: "teaser-clip.mp4", meta: "MP4 Video", size: "28 MB", icon: "vid", emoji: "\u25B6" },
  { name: "whitepaper-v3.pdf", meta: "PDF Document", size: "1.8 MB", icon: "doc", emoji: "\u{1F4C4}" },
  { name: "source-assets.zip", meta: "ZIP Archive", size: "156 MB", icon: "zip", emoji: "\u{1F4E6}" },
];

export function WorkspacePreviewCard() {
  const { walletAddress } = useWorkspaceWallet();
  const filesQuery = useFiles(walletAddress);
  const files = filesQuery.data?.files ?? [];
  const hasRealFiles = files.length > 0;

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
        {hasRealFiles
          ? files.slice(0, 4).map((file) => (
              <div key={file.id} className="file-row">
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
          : DEMO_FILES.map((file) => (
              <div key={file.name} className="file-row">
                <div className={`file-icon ${file.icon}`}>{file.emoji}</div>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">{file.meta}</div>
                </div>
                <div className="file-size">{file.size}</div>
              </div>
            ))}
      </div>
    </div>
  );
}
