import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().min(1).max(60),
  parentFolderId: z.string().min(1).nullable().optional(),
  transactionHash: z.string().min(10).optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  parentFolderId: z.string().min(1).nullable().optional(),
  transactionHash: z.string().min(10).optional(),
});

export const deleteFolderSchema = z.object({
  transactionHash: z.string().min(10).optional(),
});

export const shareSchema = z.object({
  shareType: z.enum(["PUBLIC", "PRIVATE", "PASSWORD"]),
  password: z.string().min(4).max(32).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const walletAuthSchema = z.object({
  walletAddress: z.string().min(10),
  username: z.string().min(2).max(32).optional(),
});

export const walletChallengeSchema = z.object({
  walletAddress: z.string().min(10),
});

export const walletChallengeVerifySchema = z.object({
  walletAddress: z.string().min(10),
  challengeId: z.string().min(6),
  signature: z.string().min(2).optional(),
  publicKey: z.string().min(2).optional(),
  fullMessage: z.string().min(10).optional(),
  signedAddress: z.string().min(10).optional(),
});

export const updateFileSchema = z.object({
  folderId: z.string().min(1).nullable().optional(),
  description: z.string().max(280).nullable().optional(),
});

export const createVaultAssetSchema = z.object({
  nftObjectId: z.string().min(1),
  collectionName: z.string().max(120).nullable().optional(),
  nftName: z.string().max(120).nullable().optional(),
  publicPreviewMode: z
    .enum(["HIDDEN", "BLURRED", "TEASER", "PLACEHOLDER"])
    .optional(),
  ownerOnly: z.boolean().optional(),
});

export const verifyVaultOwnershipSchema = z.object({
  nftObjectId: z.string().min(1).optional(),
});

export const vaultUploadSchema = z.object({
  role: z.enum(["PRIMARY_MEDIA", "UNLOCKABLE", "ATTACHMENT", "TEASER"]),
  description: z.string().max(280).nullable().optional(),
  encrypt: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional(),
});
