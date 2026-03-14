import {
  PrismaClient,
  PreviewType,
  ShareType,
  VaultAccessType,
  VaultFileRole,
} from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { appConfig, demoWalletAddress } from "../lib/config";

const prisma = new PrismaClient();

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

  const existing = await prisma.file.findFirst({
    where: { filename: "welcome-note.md", userId: user.id },
  });

  if (!existing) {
    const content = Buffer.from(
      [
        "# FlashFolder",
        "",
        "This sample note lives in local mock storage.",
        "",
        `Storage mode: ${appConfig.storageMode}`,
        "Next step: connect Shelby credentials in Settings when access is approved.",
      ].join("\n"),
      "utf8",
    );

    const blobKey = `${demoWalletAddress}/workspace/${mediaFolder.id}/seed-welcome-note.md`;
    const destination = path.join(process.cwd(), appConfig.storageRoot, blobKey);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content);

    const file = await prisma.file.create({
      data: {
        userId: user.id,
        folderId: mediaFolder.id,
        filename: "welcome-note.md",
        originalName: "welcome-note.md",
        blobKey,
        size: content.byteLength,
        mimeType: "text/markdown",
        previewType: PreviewType.TEXT,
        description: "A seeded sample file for local development.",
      },
    });

    await prisma.share.create({
      data: {
        fileId: file.id,
        token: "flash-demo-share",
        shareType: ShareType.PUBLIC,
      },
    });
  }

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

  const teaserFile = await prisma.file.findFirst({
    where: { filename: "vault-teaser.txt", userId: user.id },
  });

  if (!teaserFile) {
    const teaserContent = Buffer.from(
      [
        "FlashVault teaser",
        "",
        "This is the public preview for a collector vault.",
        "Vault the content, not the chain record.",
      ].join("\n"),
      "utf8",
    );
    const teaserBlobKey = `${demoWalletAddress}/vault/${vaultAsset.nftObjectId}/vault-teaser.txt`;
    const teaserDestination = path.join(
      process.cwd(),
      appConfig.storageRoot,
      teaserBlobKey,
    );
    await mkdir(path.dirname(teaserDestination), { recursive: true });
    await writeFile(teaserDestination, teaserContent);

    const createdTeaser = await prisma.file.create({
      data: {
        userId: user.id,
        filename: "vault-teaser.txt",
        originalName: "vault-teaser.txt",
        blobKey: teaserBlobKey,
        size: teaserContent.byteLength,
        mimeType: "text/plain",
        previewType: PreviewType.TEXT,
        description: "Public teaser for a FlashVault asset.",
      },
    });

    await prisma.vaultFile.create({
      data: {
        vaultAssetId: vaultAsset.id,
        fileId: createdTeaser.id,
        role: VaultFileRole.TEASER,
      },
    });

    await prisma.share.create({
      data: {
        vaultAssetId: vaultAsset.id,
        token: "flashvault-demo-share",
        shareType: ShareType.PASSWORD,
        passwordHash:
          "$2b$10$7o4zAFLVJ9rE8zJ1sL1YbO7T4vU0RAG6D8UC6V5s2slQxeqmoeNQy",
      },
    });

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
