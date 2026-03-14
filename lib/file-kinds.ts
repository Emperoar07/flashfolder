export const PREVIEW_TYPES = {
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  AUDIO: "AUDIO",
  PDF: "PDF",
  TEXT: "TEXT",
  OTHER: "OTHER",
} as const;

export const SHARE_TYPES = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
  PASSWORD: "PASSWORD",
} as const;

export type PreviewTypeValue =
  (typeof PREVIEW_TYPES)[keyof typeof PREVIEW_TYPES];

export type ShareTypeValue = (typeof SHARE_TYPES)[keyof typeof SHARE_TYPES];
