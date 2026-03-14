import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().min(1).max(60),
  parentFolderId: z.string().min(1).nullable().optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  parentFolderId: z.string().min(1).nullable().optional(),
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
