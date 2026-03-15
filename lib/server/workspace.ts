import { Prisma, ShareType, ViewEventType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

import { appConfig, demoWalletAddress } from "@/lib/config";
import { getAptosRuntimeStatus, getWalletAuthStatus } from "@/lib/server/aptos";
import { prisma } from "@/lib/prisma";
import {
  getStorageAdapter,
  getStorageAdapterForProvider,
  getEffectiveStorageUploadLimitBytes,
  getStorageRuntime,
  toStorageProviderEnum,
} from "@/lib/storage";
import { inferPreviewType, slugifyFilename } from "@/lib/utils";

function normalizeWalletAddress(walletAddress?: string | null) {
  return walletAddress?.trim() || demoWalletAddress;
}

export async function ensureUser(
  walletAddress?: string | null,
  username?: string,
) {
  const normalizedWallet = normalizeWalletAddress(walletAddress);

  return prisma.user.upsert({
    where: { walletAddress: normalizedWallet },
    update: username ? { username } : {},
    create: {
      walletAddress: normalizedWallet,
      username: username ?? "FlashFolder User",
    },
  });
}

export async function getFolders(walletAddress?: string | null) {
  const user = await ensureUser(walletAddress);
  return prisma.folder.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: "asc" }],
  });
}

export async function getCurrentUserProfile(walletAddress?: string | null) {
  const user = await ensureUser(walletAddress);
  const [folderCount, fileCount, shareCount, vaultAssetCount, recentUploads, recentActivity] =
    await Promise.all([
      prisma.folder.count({ where: { userId: user.id } }),
      prisma.file.count({ where: { userId: user.id } }),
      prisma.share.count({
        where: {
          OR: [
            { file: { userId: user.id } },
            { vaultAsset: { userId: user.id } },
          ],
        },
      }),
      prisma.vaultAsset.count({ where: { userId: user.id } }),
      prisma.file.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.fileView.findMany({
        where: { file: { userId: user.id } },
        include: { file: true },
        orderBy: { viewedAt: "desc" },
        take: 8,
      }),
    ]);

  return {
    user,
    stats: {
      folderCount,
      fileCount,
      shareCount,
      vaultAssetCount,
    },
    recentUploads,
    recentActivity,
  };
}

export async function createFolder(
  walletAddress: string | null | undefined,
  name: string,
  parentFolderId?: string | null,
  transactionHash?: string,
) {
  const user = await ensureUser(walletAddress);

  return prisma.folder.create({
    data: {
      userId: user.id,
      name,
      parentFolderId: parentFolderId ?? null,
      transactionHash: transactionHash ?? null,
    },
  });
}

export async function updateFolder(
  walletAddress: string | null | undefined,
  id: string,
  data: { name?: string; parentFolderId?: string | null },
) {
  const user = await ensureUser(walletAddress);
  const folder = await prisma.folder.findFirst({
    where: { id, userId: user.id },
  });

  if (!folder) {
    throw new Error("Folder not found.");
  }

  return prisma.folder.update({
    where: { id },
    data,
  });
}

export async function deleteFolder(
  walletAddress: string | null | undefined,
  id: string,
) {
  const user = await ensureUser(walletAddress);
  const folder = await prisma.folder.findFirst({
    where: { id, userId: user.id },
  });

  if (!folder) {
    throw new Error("Folder not found.");
  }

  const [childrenCount, filesCount] = await Promise.all([
    prisma.folder.count({ where: { parentFolderId: id, userId: user.id } }),
    prisma.file.count({ where: { folderId: id, userId: user.id } }),
  ]);

  if (childrenCount > 0 || filesCount > 0) {
    throw new Error("Only empty folders can be deleted in the MVP.");
  }

  await prisma.folder.delete({
    where: { id },
  });
}

function buildBlobKey(
  walletAddress: string,
  folderId: string | null | undefined,
  fileId: string,
  filename: string,
) {
  return `${walletAddress}/workspace/${folderId ?? "root"}/${fileId}-${slugifyFilename(filename)}`;
}

export async function uploadFile(
  walletAddress: string | null | undefined,
  input: {
    file: File;
    folderId?: string | null;
    description?: string | null;
  },
) {
  const user = await ensureUser(walletAddress);
  const buffer = Buffer.from(await input.file.arrayBuffer());

  if (!buffer.byteLength) {
    throw new Error("Upload is empty.");
  }

  if (buffer.byteLength > getEffectiveStorageUploadLimitBytes()) {
    throw new Error("Upload exceeds the configured size limit.");
  }

  const fileId = nanoid(16);
  const blobKey = buildBlobKey(
    user.walletAddress,
    input.folderId,
    fileId,
    input.file.name,
  );
  const uploadResult = await getStorageAdapter().uploadFile({
    blobKey,
    buffer,
    mimeType: input.file.type || "application/octet-stream",
  });

  return prisma.file.create({
    data: {
      id: fileId,
      userId: user.id,
      folderId: input.folderId ?? null,
      filename: input.file.name,
      originalName: input.file.name,
      blobKey: uploadResult.blobKey,
      storageProvider: toStorageProviderEnum(uploadResult.provider),
      storageMetadata: uploadResult.metadata
        ? (uploadResult.metadata as Prisma.InputJsonValue)
        : undefined,
      size: buffer.byteLength,
      mimeType: input.file.type || "application/octet-stream",
      previewType: inferPreviewType(
        input.file.type || "application/octet-stream",
        input.file.name,
      ),
      description: input.description ?? null,
    },
  });
}

export async function updateFile(
  walletAddress: string | null | undefined,
  id: string,
  data: {
    folderId?: string | null;
    description?: string | null;
  },
) {
  const user = await ensureUser(walletAddress);
  const file = await prisma.file.findFirst({
    where: { id, userId: user.id },
  });

  if (!file) {
    throw new Error("File not found.");
  }

  return prisma.file.update({
    where: { id },
    data,
  });
}

export async function getFiles(
  walletAddress?: string | null,
  folderId?: string | null,
) {
  const user = await ensureUser(walletAddress);

  return prisma.file.findMany({
    where: {
      userId: user.id,
      folderId: folderId ?? undefined,
    },
    include: {
      folder: true,
      shares: true,
      views: {
        orderBy: { viewedAt: "desc" },
        take: 5,
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function getFile(
  walletAddress: string | null | undefined,
  id: string,
) {
  const user = await ensureUser(walletAddress);

  return prisma.file.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      folder: true,
      shares: true,
      views: {
        orderBy: { viewedAt: "desc" },
        take: 25,
      },
    },
  });
}

export async function deleteFile(
  walletAddress: string | null | undefined,
  id: string,
) {
  const user = await ensureUser(walletAddress);
  const file = await prisma.file.findFirst({
    where: { id, userId: user.id },
  });

  if (!file) {
    throw new Error("File not found.");
  }

  await Promise.all([
    prisma.file.delete({ where: { id: file.id } }),
    getStorageAdapterForProvider(file.storageProvider).deleteFile(file.blobKey),
  ]);
}

export async function createShare(
  walletAddress: string | null | undefined,
  id: string,
  input: {
    shareType: ShareType;
    password?: string;
    expiresAt?: string;
  },
) {
  const user = await ensureUser(walletAddress);
  const file = await prisma.file.findFirst({
    where: { id, userId: user.id },
  });

  if (!file) {
    throw new Error("File not found.");
  }

  const passwordHash =
    input.shareType === ShareType.PASSWORD && input.password
      ? await bcrypt.hash(input.password, 10)
      : null;

  return prisma.share.create({
    data: {
      fileId: file.id,
      token: nanoid(18),
      shareType: input.shareType,
      passwordHash,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  });
}

export async function getFileShare(token: string, password?: string) {
  const share = await prisma.share.findUnique({
    where: { token },
    include: {
      file: {
        include: {
          folder: true,
          user: true,
        },
      },
    },
  });

  if (!share?.file) {
    return null;
  }

  if (share.expiresAt && share.expiresAt < new Date()) {
    return {
      resourceType: "file" as const,
      share,
      file: share.file,
      locked: false,
      expired: true,
    };
  }

  if (share.shareType === ShareType.PASSWORD) {
    const isValid =
      password && share.passwordHash
        ? await bcrypt.compare(password, share.passwordHash)
        : false;

    if (!isValid) {
      return {
        resourceType: "file" as const,
        share,
        file: share.file,
        locked: true,
        expired: false,
      };
    }
  }

  return {
    resourceType: "file" as const,
    share,
    file: share.file,
    locked: false,
    expired: false,
  };
}

export async function verifySharePassword(token: string, password: string) {
  const result = await getFileShare(token, password);
  return Boolean(result && !result.locked && !result.expired);
}

export async function recordFileEvent(
  fileId: string,
  request: Request,
  eventType: ViewEventType,
) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const viewerIp = forwardedFor?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent");

  return prisma.fileView.create({
    data: {
      fileId,
      viewerIp,
      userAgent,
      eventType,
    },
  });
}

export function getRequestWalletAddress(request: Request) {
  return request.headers.get("x-wallet-address") ?? demoWalletAddress;
}

export function getOptionalRequestWalletAddress(request: Request) {
  return request.headers.get("x-wallet-address");
}

export function getSettingsSnapshot() {
  const runtime = getStorageRuntime();
  const effectiveUploadLimitMb = Number(
    (getEffectiveStorageUploadLimitBytes() / (1024 * 1024)).toFixed(1),
  );
  const configuredUploadLimitMb = Number(
    (appConfig.maxUploadBytes / (1024 * 1024)).toFixed(1),
  );

  return {
    requestedStorageMode: runtime.requestedMode,
    activeStorageMode: runtime.activeMode,
    storageState: runtime.integrationState,
    storageFallbackReason: runtime.fallbackReason,
    shelbyConfigured: Boolean(appConfig.shelby.apiKey && appConfig.shelby.rpcUrl),
    blobConfigured: Boolean(appConfig.blob.readWriteToken),
    shelbyNamespace: appConfig.shelby.namespace,
    shelbyNetwork: appConfig.shelby.network,
    maxUploadMb: effectiveUploadLimitMb,
    configuredMaxUploadMb: configuredUploadLimitMb,
    aptosNetwork: appConfig.aptosNetwork,
    useMockNfts: appConfig.useMockNfts,
    aptos: getAptosRuntimeStatus(),
    walletAuth: getWalletAuthStatus(),
  };
}
