import { Prisma, ShareType, ViewEventType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

import { appConfig, demoWalletAddress } from "@/lib/config";
import {
  getAptosRuntimeStatus,
  getSessionForToken,
  getWalletAuthStatus,
} from "@/lib/server/aptos";
import { prisma } from "@/lib/prisma";
import {
  getStorageAdapter,
  getStorageAdapterForProvider,
  getEffectiveStorageUploadLimitBytes,
  getStorageRuntime,
  toStorageProviderEnum,
} from "@/lib/storage";
import { inferPreviewType, slugifyFilename } from "@/lib/utils";

type FileSortField = "name" | "size" | "date" | "type";
type FileSortDir = "asc" | "desc";
type FileListScope = "folder" | "workspace";

type FileListOptions = {
  folderId?: string | null;
  scope?: FileListScope;
  search?: string | null;
  sortField?: FileSortField;
  sortDir?: FileSortDir;
};

function normalizeWalletAddress(walletAddress?: string | null) {
  const normalized = walletAddress?.trim() ?? demoWalletAddress;
  
  // Ensure address is not too short (basic validation)
  if (normalized.startsWith("0x") && normalized.length < 10) {
    return demoWalletAddress;
  }
  
  return normalized;
}

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
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

function buildFileOrderBy(
  sortField: FileSortField = "date",
  sortDir: FileSortDir = "desc",
): Prisma.FileOrderByWithRelationInput[] {
  switch (sortField) {
    case "name":
      return [{ filename: sortDir }];
    case "size":
      return [{ size: sortDir }];
    case "type":
      return [{ previewType: sortDir }, { filename: "asc" }];
    case "date":
    default:
      return [{ updatedAt: sortDir }];
  }
}

export async function getFiles(
  walletAddress?: string | null,
  options: FileListOptions = {},
) {
  const user = await ensureUser(walletAddress);
  const trimmedSearch = options.search?.trim();
  const shouldLimitToFolder =
    options.scope === "folder" && !trimmedSearch && options.folderId;
  const orderBy = buildFileOrderBy(options.sortField, options.sortDir);

  return prisma.file.findMany({
    where: {
      userId: user.id,
      folderId: shouldLimitToFolder ? options.folderId ?? undefined : undefined,
      ...(trimmedSearch
        ? {
            OR: [
              { filename: { contains: trimmedSearch, mode: "insensitive" } },
              { originalName: { contains: trimmedSearch, mode: "insensitive" } },
              { description: { contains: trimmedSearch, mode: "insensitive" } },
              { mimeType: { contains: trimmedSearch, mode: "insensitive" } },
              {
                folder: {
                  is: { name: { contains: trimmedSearch, mode: "insensitive" } },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      folder: true,
      shares: true,
      views: {
        orderBy: { viewedAt: "desc" },
        take: 5,
      },
    },
    orderBy,
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
    downloadPriceApt?: number | null;
    sharerWallet?: string | null;
    maxDownloadsPerPayment?: number | null;
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
      downloadPriceApt: input.downloadPriceApt ?? null,
      sharerWallet: input.sharerWallet ?? null,
      maxDownloadsPerPayment: input.maxDownloadsPerPayment ?? 1,
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

export async function getUserShares(walletAddress?: string | null) {
  const user = await ensureUser(walletAddress);

  return prisma.share.findMany({
    where: {
      file: { userId: user.id },
    },
    include: {
      file: {
        include: {
          folder: true,
        },
      },
      downloads: {
        orderBy: { paidAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteShare(walletAddress: string | null | undefined, shareId: string) {
  const user = await ensureUser(walletAddress);

  // Verify the share belongs to this user's file
  const share = await prisma.share.findFirst({
    where: {
      id: shareId,
      file: { userId: user.id },
    },
  });

  if (!share) {
    throw new Error("Share not found or you don't have permission to delete it.");
  }

  // Delete associated download records first
  await prisma.shareDownload.deleteMany({
    where: { shareId },
  });

  // Delete the share
  return prisma.share.delete({
    where: { id: shareId },
  });
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
  const requestWallet = request.headers.get("x-wallet-address");
  const cookieWallet = getCookieValue(request, "ff_wallet");
  const sessionToken = getCookieValue(request, "ff_session");
  const session = getSessionForToken(sessionToken);

  if (session?.walletAddress) {
    return session.walletAddress;
  }

  if (requestWallet) {
    return requestWallet;
  }

  if (cookieWallet) {
    return cookieWallet;
  }

  return demoWalletAddress;
}

export function getOptionalRequestWalletAddress(request: Request) {
  const requestWallet = request.headers.get("x-wallet-address");
  const sessionToken = getCookieValue(request, "ff_session");
  const session = getSessionForToken(sessionToken);

  return session?.walletAddress ?? requestWallet ?? getCookieValue(request, "ff_wallet");
}

export async function recordShareDownloadPayment(
  shareToken: string,
  txHash: string,
  buyerWallet: string,
) {
  const share = await prisma.share.findUnique({
    where: { token: shareToken },
  });

  if (!share) {
    throw new Error("Share not found.");
  }

  // Create download record
  const download = await prisma.shareDownload.create({
    data: {
      shareId: share.id,
      txHash,
      buyerWallet,
    },
  });

  return download;
}

export async function getShareDownload(txHash: string) {
  return prisma.shareDownload.findUnique({
    where: { txHash },
    include: { share: true },
  });
}

export async function markShareDownloadAsUsed(txHash: string) {
  return prisma.shareDownload.update({
    where: { txHash },
    data: { 
      downloadCount: { increment: 1 },
      lastDownloadAt: new Date(),
    },
  });
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
