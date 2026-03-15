"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

type MediaViewerProps = {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  type: "image" | "video";
  title: string;
  videoResolutions?: { label: string; url: string }[];
};

export function MediaViewer({
  isOpen,
  onClose,
  src,
  type,
  title,
  videoResolutions,
}: MediaViewerProps) {
  const [selectedResolution, setSelectedResolution] = useState(src);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <button
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 hover:bg-white/20"
        onClick={onClose}
        type="button"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      {type === "image" && (
        <div className="flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedResolution}
            alt={title}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-sm text-white/60">{title}</p>
        </div>
      )}

      {type === "video" && (
        <div className="flex flex-col items-center gap-4">
          <video
            src={selectedResolution}
            controls
            autoPlay
            className="max-h-[90vh] max-w-[90vw] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {videoResolutions && videoResolutions.length > 1 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {videoResolutions.map((res) => (
                <button
                  key={res.label}
                  className={`rounded px-3 py-1 text-sm font-medium transition ${
                    selectedResolution === res.url
                      ? "bg-[#e8aa30] text-black"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedResolution(res.url);
                  }}
                  type="button"
                >
                  {res.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
