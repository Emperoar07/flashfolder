import { PreviewType } from "@prisma/client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(size: number) {
  if (size === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  );
  const value = size / 1024 ** index;
  return `${value.toFixed(value >= 100 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function shortenWallet(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function slugifyFilename(filename: string) {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function inferPreviewType(
  mimeType: string,
  filename: string,
): PreviewType {
  const lowerMime = mimeType.toLowerCase();
  const lowerName = filename.toLowerCase();

  if (lowerMime.startsWith("image/")) return PreviewType.IMAGE;
  if (lowerMime.startsWith("video/")) return PreviewType.VIDEO;
  if (lowerMime.startsWith("audio/")) return PreviewType.AUDIO;
  if (lowerMime === "application/pdf" || lowerName.endsWith(".pdf")) {
    return PreviewType.PDF;
  }
  if (
    lowerMime.startsWith("text/") ||
    /\.(md|txt|json|ts|tsx|js|jsx|html|css|csv|xml|yaml|yml)$/i.test(lowerName)
  ) {
    return PreviewType.TEXT;
  }

  return PreviewType.OTHER;
}
