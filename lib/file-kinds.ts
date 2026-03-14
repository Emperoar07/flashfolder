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

export const VAULT_PREVIEW_MODES = {
  HIDDEN: "HIDDEN",
  BLURRED: "BLURRED",
  TEASER: "TEASER",
  PLACEHOLDER: "PLACEHOLDER",
} as const;

export const VAULT_FILE_ROLES = {
  PRIMARY_MEDIA: "PRIMARY_MEDIA",
  UNLOCKABLE: "UNLOCKABLE",
  ATTACHMENT: "ATTACHMENT",
  TEASER: "TEASER",
} as const;

export const VAULT_ACCESS_TYPES = {
  OWNER_VIEW: "OWNER_VIEW",
  SHARED_VIEW: "SHARED_VIEW",
  DOWNLOAD: "DOWNLOAD",
  FAILED_CHECK: "FAILED_CHECK",
} as const;

export type PreviewTypeValue =
  (typeof PREVIEW_TYPES)[keyof typeof PREVIEW_TYPES];

export type ShareTypeValue = (typeof SHARE_TYPES)[keyof typeof SHARE_TYPES];

export type VaultPreviewModeValue =
  (typeof VAULT_PREVIEW_MODES)[keyof typeof VAULT_PREVIEW_MODES];

export type VaultFileRoleValue =
  (typeof VAULT_FILE_ROLES)[keyof typeof VAULT_FILE_ROLES];

export type VaultAccessTypeValue =
  (typeof VAULT_ACCESS_TYPES)[keyof typeof VAULT_ACCESS_TYPES];
