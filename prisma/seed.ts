import {
  Prisma,
  PrismaClient,
  PreviewType,
  ShareType,
  VaultAccessType,
  VaultFileRole,
} from "@prisma/client";

import { appConfig, demoWalletAddress } from "../lib/config";
import { getStorageAdapter, toStorageProviderEnum } from "../lib/storage";

const prisma = new PrismaClient();
const storageAdapter = getStorageAdapter();

async function upsertSeededFile(args: {
  userId: string;
  folderId?: string | null;
  filename: string;
  mimeType: string;
  previewType: PreviewType;
  description: string;
  content: Buffer;
  blobKey: string;
  isEncrypted?: boolean;
}) {
  const uploaded = await storageAdapter.uploadFile({
    blobKey: args.blobKey,
    buffer: args.content,
    mimeType: args.mimeType,
  });

  const existing = await prisma.file.findFirst({
    where: { filename: args.filename, userId: args.userId },
  });

  if (existing) {
    return prisma.file.update({
      where: { id: existing.id },
      data: {
        folderId: args.folderId ?? null,
        originalName: args.filename,
        blobKey: uploaded.blobKey,
        storageProvider: toStorageProviderEnum(uploaded.provider),
        storageMetadata: uploaded.metadata
          ? (uploaded.metadata as Prisma.InputJsonValue)
          : undefined,
        size: args.content.byteLength,
        mimeType: args.mimeType,
        isEncrypted: args.isEncrypted ?? false,
        previewType: args.previewType,
        description: args.description,
      },
    });
  }

  return prisma.file.create({
    data: {
      userId: args.userId,
      folderId: args.folderId ?? null,
      filename: args.filename,
      originalName: args.filename,
      blobKey: uploaded.blobKey,
      storageProvider: toStorageProviderEnum(uploaded.provider),
      storageMetadata: uploaded.metadata
        ? (uploaded.metadata as Prisma.InputJsonValue)
        : undefined,
      size: args.content.byteLength,
      mimeType: args.mimeType,
      isEncrypted: args.isEncrypted ?? false,
      previewType: args.previewType,
      description: args.description,
    },
  });
}

async function main() {
  const user = await prisma.user.upsert({
    where: { walletAddress: demoWalletAddress },
    update: { username: "FlashFolder Demo" },
    create: {
      walletAddress: demoWalletAddress,
      username: "FlashFolder Demo",
    },
  });

  const mediaFolder = await prisma.folder.upsert({
    where: { id: "seed-media-folder" },
    update: {},
    create: {
      id: "seed-media-folder",
      name: "Creator Drops",
      userId: user.id,
    },
  });

  await prisma.folder.upsert({
    where: { id: "seed-docs-folder" },
    update: {},
    create: {
      id: "seed-docs-folder",
      name: "Docs",
      userId: user.id,
    },
  });

  const content = Buffer.from(
    [
      "# FlashFolder",
      "",
      `This sample note lives in ${storageAdapter.descriptor.name.toLowerCase()}.`,
      "",
      `Storage mode: ${appConfig.storageMode}`,
      "Next step: connect Shelby credentials in Settings when access is approved.",
    ].join("\n"),
    "utf8",
  );

  const file = await upsertSeededFile({
    userId: user.id,
    folderId: mediaFolder.id,
    filename: "welcome-note.md",
    mimeType: "text/markdown",
    previewType: PreviewType.TEXT,
    description: `A seeded sample file for ${storageAdapter.descriptor.name.toLowerCase()}.`,
    content,
    blobKey: `${demoWalletAddress}/workspace/${mediaFolder.id}/seed-welcome-note.md`,
  });

  await prisma.share.upsert({
    where: { token: "flash-demo-share" },
    update: {
      fileId: file.id,
      shareType: ShareType.PUBLIC,
      expiresAt: null,
      passwordHash: null,
    },
    create: {
      fileId: file.id,
      token: "flash-demo-share",
      shareType: ShareType.PUBLIC,
    },
  });

  const vaultAsset = await prisma.vaultAsset.upsert({
    where: {
      userId_nftObjectId: {
        userId: user.id,
        nftObjectId: "0xflashvault-object-001",
      },
    },
    update: {},
    create: {
      userId: user.id,
      nftObjectId: "0xflashvault-object-001",
      collectionName: "Afterglow Collectors Club",
      nftName: "Collector Pass 001",
      nftOwnerAddress: user.walletAddress,
      nftMetadataSnapshot: {
        imageUrl:
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
        metadataUrl: null,
        description: "Owner-gated media and unlockables for the Afterglow collector circle.",
      },
      publicPreviewMode: "TEASER",
      ownerOnly: true,
    },
  });

  const teaserContent = Buffer.from(
    [
      "FlashVault teaser",
      "",
      "This is the public preview for a collector vault.",
      "Vault the content, not the chain record.",
    ].join("\n"),
    "utf8",
  );
  const createdTeaser = await upsertSeededFile({
    userId: user.id,
    filename: "vault-teaser.txt",
    mimeType: "text/plain",
    previewType: PreviewType.TEXT,
    description: "Public teaser for a FlashVault asset.",
    content: teaserContent,
    blobKey: `${demoWalletAddress}/vault/${vaultAsset.nftObjectId}/vault-teaser.txt`,
  });

  const existingVaultTeaser = await prisma.vaultFile.findFirst({
    where: {
      vaultAssetId: vaultAsset.id,
      role: VaultFileRole.TEASER,
    },
  });

  if (existingVaultTeaser) {
    await prisma.vaultFile.update({
      where: { id: existingVaultTeaser.id },
      data: {
        fileId: createdTeaser.id,
        encryptedKeyRef: null,
      },
    });
  } else {
    await prisma.vaultFile.create({
      data: {
        vaultAssetId: vaultAsset.id,
        fileId: createdTeaser.id,
        role: VaultFileRole.TEASER,
      },
    });
  }

  await prisma.share.upsert({
    where: { token: "flashvault-demo-share" },
    update: {
      vaultAssetId: vaultAsset.id,
      shareType: ShareType.PASSWORD,
      passwordHash:
        "$2b$10$7o4zAFLVJ9rE8zJ1sL1YbO7T4vU0RAG6D8UC6V5s2slQxeqmoeNQy",
    },
    create: {
      vaultAssetId: vaultAsset.id,
      token: "flashvault-demo-share",
      shareType: ShareType.PASSWORD,
      passwordHash:
        "$2b$10$7o4zAFLVJ9rE8zJ1sL1YbO7T4vU0RAG6D8UC6V5s2slQxeqmoeNQy",
    },
  });

  const existingAccessLog = await prisma.vaultAccessLog.findFirst({
    where: {
      vaultAssetId: vaultAsset.id,
      accessorWallet: demoWalletAddress,
      accessType: VaultAccessType.OWNER_VIEW,
    },
  });

  if (!existingAccessLog) {
    await prisma.vaultAccessLog.create({
      data: {
        vaultAssetId: vaultAsset.id,
        accessorWallet: demoWalletAddress,
        accessType: VaultAccessType.OWNER_VIEW,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
