import {
  Prisma,
  PublicPreviewMode,
  ShareType,
  VaultAccessType,
  VaultFileRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

import {
  getOwnedDigitalAsset,
  listOwnedDigitalAssets,
  verifyDigitalAssetOwnership,
  verifyDigitalAssetOwnershipDetailed,
} from "@/lib/server/aptos-digital-assets";
import { decryptVaultBuffer, encryptVaultBuffer } from "@/lib/server/crypto";
import { prisma } from "@/lib/prisma";
import {
  getEffectiveStorageUploadLimitBytes,
  getStorageAdapter,
  getStorageAdapterForProvider,
  toStorageProviderEnum,
} from "@/lib/storage";
import { StorageError } from "@/lib/storage/errors";
import { inferPreviewType, slugifyFilename } from "@/lib/utils";
import { ensureUser } from "@/lib/server/workspace";

function buildVaultBlobKey(
  walletAddress: string,
  nftObjectId: string,
  fileId: string,
  filename: string,
  encrypted: boolean,
) {
  const suffix = encrypted ? ".enc" : "";
  return `${walletAddress}/vault/${nftObjectId}/${fileId}-${slugifyFilename(filename)}${suffix}`;
}

async function logVaultAccess(
  vaultAssetId: string,
  accessorWallet: string | null,
  accessType: VaultAccessType,
) {
  await prisma.vaultAccessLog.create({
    data: {
      vaultAssetId,
      accessorWallet,
      accessType,
    },
  });
}

export async function listWalletNfts(walletAddress: string) {
  return listOwnedDigitalAssets(walletAddress);
}

export async function listVaultAssets(walletAddress: string) {
  const user = await ensureUser(walletAddress);

  return prisma.vaultAsset.findMany({
    where: { userId: user.id },
    include: {
      shares: true,
      vaultFiles: {
        include: {
          file: true,
        },
        orderBy: { createdAt: "asc" },
      },
      accessLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createVaultAsset(
  walletAddress: string,
  input: {
    nftObjectId: string;
    collectionName?: string | null;
    nftName?: string | null;
    publicPreviewMode?: PublicPreviewMode;
    ownerOnly?: boolean;
  },
) {
  const user = await ensureUser(walletAddress);
  const ownedAsset = await getOwnedDigitalAsset(walletAddress, input.nftObjectId);

  if (!ownedAsset) {
    throw new Error("You do not currently own this Aptos collectible.");
  }

  return prisma.vaultAsset.upsert({
    where: {
      userId_nftObjectId: {
        userId: user.id,
        nftObjectId: input.nftObjectId,
      },
    },
    update: {
      collectionName: input.collectionName ?? ownedAsset.collectionName,
      nftName: input.nftName ?? ownedAsset.tokenName,
      nftOwnerAddress: ownedAsset.ownerAddress,
      nftMetadataSnapshot: {
        imageUrl: ownedAsset.imageUrl,
        metadataUrl: ownedAsset.metadataUrl,
        description: ownedAsset.description,
        attributes: ownedAsset.attributes ?? [],
      },
      publicPreviewMode:
        input.publicPreviewMode ?? PublicPreviewMode.TEASER,
      ownerOnly: input.ownerOnly ?? true,
    },
    create: {
      userId: user.id,
      nftObjectId: input.nftObjectId,
      collectionName: input.collectionName ?? ownedAsset.collectionName,
      nftName: input.nftName ?? ownedAsset.tokenName,
      nftOwnerAddress: ownedAsset.ownerAddress,
      nftMetadataSnapshot: {
        imageUrl: ownedAsset.imageUrl,
        metadataUrl: ownedAsset.metadataUrl,
        description: ownedAsset.description,
        attributes: ownedAsset.attributes ?? [],
      },
      publicPreviewMode:
        input.publicPreviewMode ?? PublicPreviewMode.TEASER,
      ownerOnly: input.ownerOnly ?? true,
    },
  });
}

export async function getVaultAsset(
  walletAddress: string,
  vaultAssetId: string,
) {
  const user = await ensureUser(walletAddress);

  return prisma.vaultAsset.findFirst({
    where: {
      id: vaultAssetId,
      userId: user.id,
    },
    include: {
      shares: true,
      vaultFiles: {
        include: {
          file: true,
        },
        orderBy: { createdAt: "asc" },
      },
      accessLogs: {
        orderBy: { createdAt: "desc" },
        take: 25,
      },
    },
  });
}

export async function verifyVaultOwnership(
  walletAddress: string,
  vaultAssetId: string,
) {
  const vaultAsset = await prisma.vaultAsset.findUnique({
    where: { id: vaultAssetId },
  });

  if (!vaultAsset) {
    throw new StorageError("NOT_FOUND", "Vault asset not found.", { status: 404 });
  }

  const verification = await verifyDigitalAssetOwnershipDetailed(
    walletAddress,
    vaultAsset.nftObjectId,
  );
  const isOwner = verification.verified;

  await logVaultAccess(
    vaultAsset.id,
    walletAddress,
    isOwner ? VaultAccessType.OWNER_VIEW : VaultAccessType.FAILED_CHECK,
  );

  return {
    isOwner,
    verified: verification.verified,
    nftObjectId: vaultAsset.nftObjectId,
    source: verification.source,
    checkedAt: verification.checkedAt,
    reason: verification.reason,
  };
}

export async function uploadVaultFile(
  walletAddress: string,
  vaultAssetId: string,
  input: {
    role: VaultFileRole;
    description?: string | null;
    encrypt?: boolean;
    file: File;
  },
) {
  const ownership = await verifyVaultOwnership(walletAddress, vaultAssetId);
  if (!ownership.isOwner) {
    throw new Error("Only the current NFT owner can add protected content.");
  }

  const user = await ensureUser(walletAddress);
  const vaultAsset = await prisma.vaultAsset.findUnique({
    where: { id: vaultAssetId },
  });

  if (!vaultAsset) {
    throw new StorageError("NOT_FOUND", "Vault asset not found.", { status: 404 });
  }

  const originalBuffer = Buffer.from(await input.file.arrayBuffer());
  if (originalBuffer.byteLength > getEffectiveStorageUploadLimitBytes()) {
    throw new Error("Upload exceeds the configured size limit.");
  }

  const fileId = nanoid(16);
  const prepared = input.encrypt
    ? encryptVaultBuffer(originalBuffer)
    : { buffer: originalBuffer, encryptedKeyRef: null };

  const blobKey = buildVaultBlobKey(
    walletAddress,
    vaultAsset.nftObjectId,
    fileId,
    input.file.name,
    Boolean(input.encrypt),
  );
  const uploadResult = await getStorageAdapter().uploadFile({
    blobKey,
    buffer: prepared.buffer,
    mimeType: input.file.type || "application/octet-stream",
  });

  return prisma.$transaction(async (tx) => {
    const file = await tx.file.create({
      data: {
        id: fileId,
        userId: user.id,
        filename: input.file.name,
        originalName: input.file.name,
        blobKey: uploadResult.blobKey,
        storageProvider: toStorageProviderEnum(uploadResult.provider),
        storageMetadata: uploadResult.metadata
          ? (uploadResult.metadata as Prisma.InputJsonValue)
          : undefined,
        size: originalBuffer.byteLength,
        mimeType: input.file.type || "application/octet-stream",
        isEncrypted: Boolean(input.encrypt),
        previewType: inferPreviewType(
          input.file.type || "application/octet-stream",
          input.file.name,
        ),
        description: input.description ?? null,
      },
    });

    await tx.vaultFile.create({
      data: {
        vaultAssetId: vaultAsset.id,
        fileId: file.id,
        role: input.role,
        encryptedKeyRef: prepared.encryptedKeyRef,
      },
    });

    return file;
  });
}

export async function createVaultShare(
  walletAddress: string,
  vaultAssetId: string,
  input: {
    shareType: ShareType;
    password?: string;
    expiresAt?: string;
  },
) {
  const ownership = await verifyVaultOwnership(walletAddress, vaultAssetId);
  if (!ownership.isOwner) {
    throw new Error("Only the current NFT owner can create a vault share.");
  }

  const passwordHash =
    input.shareType === ShareType.PASSWORD && input.password
      ? await bcrypt.hash(input.password, 10)
      : null;

  return prisma.share.create({
    data: {
      vaultAssetId,
      token: nanoid(18),
      shareType: input.shareType,
      passwordHash,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  });
}

export async function getVaultShare(token: string, password?: string) {
  const share = await prisma.share.findUnique({
    where: { token },
    include: {
      vaultAsset: {
        include: {
          user: true,
          vaultFiles: {
            include: {
              file: true,
            },
          },
        },
      },
    },
  });

  if (!share?.vaultAsset) {
    return null;
  }

  if (share.expiresAt && share.expiresAt < new Date()) {
    return {
      resourceType: "vault" as const,
      share,
      vaultAsset: share.vaultAsset,
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
      await logVaultAccess(
        share.vaultAsset.id,
        null,
        VaultAccessType.FAILED_CHECK,
      );
      return {
        resourceType: "vault" as const,
        share,
        vaultAsset: share.vaultAsset,
        locked: true,
        expired: false,
      };
    }
  }

  return {
    resourceType: "vault" as const,
    share,
    vaultAsset: share.vaultAsset,
    locked: false,
    expired: false,
  };
}

async function canAccessVaultContent(args: {
  vaultAssetId: string;
  walletAddress?: string | null;
  shareToken?: string | null;
  password?: string;
}) {
  const vaultAsset = await prisma.vaultAsset.findUnique({
    where: { id: args.vaultAssetId },
  });

  if (!vaultAsset) {
    throw new Error("Vault asset not found.");
  }

  if (args.walletAddress) {
    const isOwner = await verifyDigitalAssetOwnership(
      args.walletAddress,
      vaultAsset.nftObjectId,
    );
    if (isOwner) {
      return { mode: "owner" as const, vaultAsset };
    }
  }

  if (args.shareToken) {
    const shareResult = await getVaultShare(args.shareToken, args.password);
    if (
      shareResult &&
      !shareResult.locked &&
      !shareResult.expired &&
      shareResult.vaultAsset.id === args.vaultAssetId
    ) {
      return { mode: "share" as const, vaultAsset };
    }
  }

  return { mode: "denied" as const, vaultAsset };
}

export async function resolveVaultContent(args: {
  vaultAssetId: string;
  role?: VaultFileRole;
  walletAddress?: string | null;
  shareToken?: string | null;
  password?: string;
  action?: "view" | "download";
}) {
  const vaultAsset = await prisma.vaultAsset.findUnique({
    where: { id: args.vaultAssetId },
    include: {
      vaultFiles: {
        include: {
          file: true,
        },
      },
    },
  });

  if (!vaultAsset) {
    throw new Error("Vault asset not found.");
  }

  const role = args.role ?? VaultFileRole.PRIMARY_MEDIA;
  const vaultFile =
    vaultAsset.vaultFiles.find((entry) => entry.role === role) ??
    vaultAsset.vaultFiles.find((entry) => entry.role === VaultFileRole.TEASER) ??
    null;

  if (!vaultFile) {
    throw new StorageError("NOT_FOUND", "Requested vault content is not available.", {
      status: 404,
    });
  }

  const isPublicTeaser =
    vaultFile.role === VaultFileRole.TEASER &&
    vaultAsset.publicPreviewMode !== PublicPreviewMode.HIDDEN;

  if (!isPublicTeaser) {
    const access = await canAccessVaultContent({
      vaultAssetId: vaultAsset.id,
      walletAddress: args.walletAddress,
      shareToken: args.shareToken,
      password: args.password,
    });

    if (access.mode === "denied") {
      await logVaultAccess(
        vaultAsset.id,
        args.walletAddress ?? null,
        VaultAccessType.FAILED_CHECK,
      );
      throw new StorageError("UNAUTHORIZED", "Vault access denied.", {
        status: 403,
      });
    }

    await logVaultAccess(
      vaultAsset.id,
      args.walletAddress ?? null,
      args.action === "download"
        ? VaultAccessType.DOWNLOAD
        : access.mode === "owner"
          ? VaultAccessType.OWNER_VIEW
          : VaultAccessType.SHARED_VIEW,
    );
  }

  return {
    vaultAsset,
    vaultFile,
  };
}

export async function getVaultContent(args: {
  vaultAssetId: string;
  role?: VaultFileRole;
  walletAddress?: string | null;
  shareToken?: string | null;
  password?: string;
  action?: "view" | "download";
}) {
  const resolved = await resolveVaultContent(args);
  const storedBuffer = await getStorageAdapterForProvider(
    resolved.vaultFile.file.storageProvider,
  ).downloadFile(resolved.vaultFile.file.blobKey);
  const contentBuffer =
    resolved.vaultFile.file.isEncrypted && resolved.vaultFile.encryptedKeyRef
      ? decryptVaultBuffer(storedBuffer.buffer, resolved.vaultFile.encryptedKeyRef)
      : storedBuffer.buffer;

  return {
    ...resolved,
    contentBuffer,
  };
}

export async function readVaultContentBuffer(args: {
  blobKey: string;
  storageProvider: "LOCAL" | "BLOB" | "SHELBY";
  isEncrypted: boolean;
  encryptedKeyRef?: string | null;
}) {
  const storedBuffer = await getStorageAdapterForProvider(
    args.storageProvider,
  ).downloadFile(args.blobKey);

  if (args.isEncrypted && args.encryptedKeyRef) {
    return decryptVaultBuffer(storedBuffer.buffer, args.encryptedKeyRef);
  }

  return storedBuffer.buffer;
}

export async function getVaultAccessLogs(
  walletAddress: string,
  vaultAssetId: string,
) {
  const ownership = await verifyVaultOwnership(walletAddress, vaultAssetId);
  if (!ownership.isOwner) {
    throw new Error("Only the NFT owner can view vault access logs.");
  }

  return prisma.vaultAccessLog.findMany({
    where: { vaultAssetId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
