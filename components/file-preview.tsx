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

function buildSrc(fileId: string, token?: string, password?: string) {
  const query = new URLSearchParams({
    inline: "1",
    ...(token ? { token } : {}),
    ...(password ? { password } : {}),
  });
  return `/api/files/${fileId}/download?${query.toString()}`;
}

function AuthenticatedImage({
  src,
  walletAddress,
  alt,
}: {
  src: string;
  walletAddress: string;
  alt: string;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let revoked = false;
    let nextObjectUrl: string | null = null;

    fetch(src, { headers: { "x-wallet-address": walletAddress } })
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.blob();
      })
      .then((blob) => {
        if (revoked) return;
        nextObjectUrl = URL.createObjectURL(blob);
        setObjectUrl((currentObjectUrl) => {
          if (currentObjectUrl) {
            URL.revokeObjectURL(currentObjectUrl);
          }

          return nextObjectUrl;
        });
        setError(false);
      })
      .catch(() => {
        if (!revoked) setError(true);
      });

    return () => {
      revoked = true;
      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [src, walletAddress]);

  // cleanup object URL on unmount or change
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  if (error) {
    return (
      <div
        style={{
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          color: "var(--text-muted)",
          borderRadius: 12,
          border: "1px solid var(--border)",
        }}
      >
        Preview unavailable
      </div>
    );
  }

  if (!objectUrl) {
    return (
      <div
        style={{
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          color: "var(--text-muted)",
          borderRadius: 12,
          border: "1px solid var(--border)",
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={objectUrl}
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
  );
}

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
    src ??
    (() => {
      if (!fileId) return "";
      return buildSrc(fileId, token, password);
    })();

  if (previewType === PREVIEW_TYPES.IMAGE) {
    // Use authenticated fetch when walletAddress provided (dashboard context)
    if (walletAddress && fileId && !token) {
      return (
        <>
          <MediaViewer
            isOpen={isFullscreen}
            onClose={() => setIsFullscreen(false)}
            src={previewSrc}
            type="image"
            title={originalName}
          />
          <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
            <AuthenticatedImage
              src={previewSrc}
              walletAddress={walletAddress}
              alt={originalName}
            />
            <button
              className="absolute bottom-3 right-3 rounded-lg bg-black/50 p-2 hover:bg-black/70 transition"
              onClick={() => setIsFullscreen(true)}
              type="button"
            >
              <Maximize2 className="h-4 w-4 text-white" />
            </button>
          </div>
        </>
      );
    }
    return (
      <>
        <MediaViewer
          isOpen={isFullscreen}
          onClose={() => setIsFullscreen(false)}
          src={previewSrc}
          type="image"
          title={originalName}
        />
        <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt={originalName}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: 288,
              borderRadius: 12,
              objectFit: "cover",
              display: "block",
            }}
          />
          <button
            className="absolute bottom-3 right-3 rounded-lg bg-black/50 p-2 hover:bg-black/70 transition"
            onClick={() => setIsFullscreen(true)}
            type="button"
          >
            <Maximize2 className="h-4 w-4 text-white" />
          </button>
        </div>
      </>
    );
  }

  if (previewType === PREVIEW_TYPES.VIDEO) {
    return (
      <>
        <MediaViewer
          isOpen={isFullscreen}
          onClose={() => setIsFullscreen(false)}
          src={previewSrc}
          type="video"
          title={originalName}
        />
        <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
          <video
            style={{ height: 288, width: "100%", borderRadius: 12, background: "#0a0a0a", objectFit: "cover" }}
            controls
          >
            <source src={previewSrc} />
          </video>
          <button
            className="absolute bottom-3 right-3 rounded-lg bg-black/50 p-2 hover:bg-black/70 transition"
            onClick={() => setIsFullscreen(true)}
            type="button"
          >
            <Maximize2 className="h-4 w-4 text-white" />
          </button>
        </div>
      </>
    );
  }

  if (previewType === PREVIEW_TYPES.AUDIO) {
    return (
      <div
        style={{
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.07)",
          background: "#111",
          padding: 24,
        }}
      >
        <audio style={{ width: "100%" }} controls>
          <source src={previewSrc} />
        </audio>
      </div>
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
