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

    if (!src) {
      setError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    const headers: Record<string, string> = {};
    if (walletAddress) headers["x-wallet-address"] = walletAddress;

    fetch(src, { headers })
      .then((res) => {
        if (!res.ok) {
          console.warn(`[FilePreview] Fetch failed with status ${res.status} for ${src}`);
          throw new Error(`HTTP ${res.status}`);
        }
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
      .catch((err) => {
        if (!cancelled) {
          console.warn(`[FilePreview] Fetch error for ${src}:`, err);
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

  if (previewType === PREVIEW_TYPES.PDF || previewType === PREVIEW_TYPES.TEXT) {
    return (
      <DocumentPreview
        src={previewSrc}
        title={originalName}
        isFullscreen={isFullscreen}
        onFullscreen={() => setIsFullscreen(true)}
        onCloseFullscreen={() => setIsFullscreen(false)}
      />
    );
  }

  // Fallback for unknown types
  return (
    <DocumentPreview
      src={previewSrc}
      title={originalName}
      isFullscreen={isFullscreen}
      onFullscreen={() => setIsFullscreen(true)}
      onCloseFullscreen={() => setIsFullscreen(false)}
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
  // src already has wallet in query param (from buildSrc), don't pass walletAddress again
  const { objectUrl, loading, error } = useObjectUrl(src);
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
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "#111",
        padding: 24,
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        src={src}
        style={{ width: "100%" }}
        controls
        controlsList="nodownload"
        onError={(e) => {
          const audio = e.currentTarget;
          console.error(
            "[AudioPreview] Error loading audio:",
            audio.error?.code,
            audio.error?.message,
            "URL:",
            src,
          );
        }}
        onCanPlay={() => {
          console.log("[AudioPreview] Audio can play from:", src);
        }}
      />
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 8, textAlign: "center" }}>
        Playing from: {src.split("?")[0].split("/").pop()}
      </div>
    </div>
  );
}

/* ── Document / PDF ── */
function DocumentPreview({
  src,
  title,
  isFullscreen,
  onFullscreen,
  onCloseFullscreen,
}: {
  src: string;
  title: string;
  isFullscreen: boolean;
  onFullscreen: () => void;
  onCloseFullscreen: () => void;
}) {
  return (
    <>
      <DocumentViewer
        isOpen={isFullscreen}
        onClose={onCloseFullscreen}
        src={src}
        title={title}
      />
      <div style={{ position: "relative" }}>
        <iframe
          style={{
            height: 384,
            width: "100%",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "#111",
          }}
          src={src}
          title={title}
        />
        {MAXIMIZE_BTN(onFullscreen)}
      </div>
    </>
  );
}

/* ── Document Viewer Modal ── */
function DocumentViewer({
  isOpen,
  onClose,
  src,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  title: string;
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.95)",
        backdropFilter: "blur(4px)",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <button
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          background: "rgba(255,255,255,0.1)",
          border: "none",
          borderRadius: 8,
          padding: 8,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={onClose}
        type="button"
      >
        <span style={{ color: "#fff", fontSize: 24 }}>×</span>
      </button>

      <iframe
        style={{
          flex: 1,
          width: "100%",
          height: "100%",
          border: "none",
          borderRadius: 0,
        }}
        src={src}
        title={title}
        onClick={(e) => e.stopPropagation()}
      />

      <div style={{ padding: 16, textAlign: "center", color: "#fff", fontSize: 12 }}>
        {title}
      </div>
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
