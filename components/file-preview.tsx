"use client";

import { Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";

import { MediaViewer } from "@/components/media-viewer";
import { PREVIEW_TYPES, type PreviewTypeValue } from "@/lib/file-kinds";

type FilePreviewProps = {
  fileId?: string;
  originalName: string;
  previewType: PreviewTypeValue;
  token?: string;
  password?: string;
  src?: string;
  walletAddress?: string;
};

function buildSrc(fileId: string, token?: string, password?: string, walletAddress?: string) {
  const query = new URLSearchParams({ inline: "1" });
  if (token) query.set("token", token);
  if (password) query.set("password", password);
  if (walletAddress) query.set("wallet", walletAddress);
  return `/api/files/${fileId}/download?${query.toString()}`;
}

function useObjectUrl(src: string, walletAddress?: string) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;

    setLoading(true);
    setError(false);

    const headers: Record<string, string> = {};
    if (walletAddress) headers["x-wallet-address"] = walletAddress;

    fetch(src, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setObjectUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [src, walletAddress]);

  return { objectUrl, loading, error };
}

const MAXIMIZE_BTN = (onClick: () => void) => (
  <button
    style={{
      position: "absolute",
      bottom: 10,
      right: 10,
      background: "rgba(0,0,0,0.6)",
      border: "none",
      borderRadius: 8,
      padding: "6px 8px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
    onClick={onClick}
    type="button"
    aria-label="Full screen"
  >
    <Maximize2 style={{ width: 16, height: 16, color: "#fff" }} />
  </button>
);

export function FilePreview({
  fileId,
  originalName,
  previewType,
  token,
  password,
  src,
  walletAddress,
}: FilePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const previewSrc =
    src ?? (fileId ? buildSrc(fileId, token, password, walletAddress) : "");

  if (previewType === PREVIEW_TYPES.IMAGE) {
    return (
      <ImagePreview
        src={previewSrc}
        alt={originalName}
        walletAddress={walletAddress}
        isFullscreen={isFullscreen}
        onFullscreen={() => setIsFullscreen(true)}
        onCloseFullscreen={() => setIsFullscreen(false)}
      />
    );
  }

  if (previewType === PREVIEW_TYPES.VIDEO) {
    return (
      <VideoPreview
        src={previewSrc}
        title={originalName}
        walletAddress={walletAddress}
        isFullscreen={isFullscreen}
        onFullscreen={() => setIsFullscreen(true)}
        onCloseFullscreen={() => setIsFullscreen(false)}
      />
    );
  }

  if (previewType === PREVIEW_TYPES.AUDIO) {
    return (
      <AudioPreview
        src={previewSrc}
        walletAddress={walletAddress}
      />
    );
  }

  if (previewType === PREVIEW_TYPES.PDF) {
    return (
      <iframe
        style={{
          height: 384,
          width: "100%",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.07)",
          background: "#111",
        }}
        src={previewSrc}
        title={originalName}
      />
    );
  }

  return (
    <iframe
      style={{
        height: 384,
        width: "100%",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "#111",
      }}
      src={previewSrc}
      title={originalName}
    />
  );
}

/* ── Image ── */
function ImagePreview({
  src,
  alt,
  walletAddress,
  isFullscreen,
  onFullscreen,
  onCloseFullscreen,
}: {
  src: string;
  alt: string;
  walletAddress?: string;
  isFullscreen: boolean;
  onFullscreen: () => void;
  onCloseFullscreen: () => void;
}) {
  const { objectUrl, loading, error } = useObjectUrl(src, walletAddress);
  const displaySrc = objectUrl ?? src;

  return (
    <>
      <MediaViewer
        isOpen={isFullscreen}
        onClose={onCloseFullscreen}
        src={displaySrc}
        type="image"
        title={alt}
      />
      <div style={{ position: "relative", width: "100%" }}>
        {loading && !objectUrl ? (
          <div style={placeholderStyle}>Loading…</div>
        ) : error ? (
          <div style={placeholderStyle}>Preview unavailable</div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displaySrc}
            alt={alt}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: 288,
              borderRadius: 12,
              objectFit: "cover",
              display: "block",
            }}
          />
        )}
        {!loading && !error && MAXIMIZE_BTN(onFullscreen)}
      </div>
    </>
  );
}

/* ── Video ── */
function VideoPreview({
  src,
  title,
  walletAddress,
  isFullscreen,
  onFullscreen,
  onCloseFullscreen,
}: {
  src: string;
  title: string;
  walletAddress?: string;
  isFullscreen: boolean;
  onFullscreen: () => void;
  onCloseFullscreen: () => void;
}) {
  // For video we need an object URL because the browser can't send custom headers
  const { objectUrl, loading, error } = useObjectUrl(src, walletAddress);
  const videoSrc = objectUrl ?? src;

  return (
    <>
      <MediaViewer
        isOpen={isFullscreen}
        onClose={onCloseFullscreen}
        src={videoSrc}
        type="video"
        title={title}
      />
      <div style={{ position: "relative", width: "100%" }}>
        {loading && !objectUrl ? (
          <div style={{ ...placeholderStyle, height: 288 }}>Loading…</div>
        ) : error ? (
          <div style={{ ...placeholderStyle, height: 288 }}>Preview unavailable</div>
        ) : (
          <video
            src={videoSrc}
            style={{
              height: 288,
              width: "100%",
              borderRadius: 12,
              background: "#0a0a0a",
              display: "block",
            }}
            controls
            playsInline
          />
        )}
        {!loading && !error && MAXIMIZE_BTN(onFullscreen)}
      </div>
    </>
  );
}

/* ── Audio ── */
function AudioPreview({
  src,
  walletAddress,
}: {
  src: string;
  walletAddress?: string;
}) {
  const { objectUrl, loading, error } = useObjectUrl(src, walletAddress);
  const audioSrc = objectUrl ?? src;

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "#111",
        padding: 24,
      }}
    >
      {loading && !objectUrl ? (
        <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          Loading…
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
          Audio unavailable
        </div>
      ) : (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio src={audioSrc} style={{ width: "100%" }} controls />
      )}
    </div>
  );
}

const placeholderStyle: React.CSSProperties = {
  height: 180,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 11,
  color: "rgba(255,255,255,0.3)",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.07)",
};
