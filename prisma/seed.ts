import { PrismaClient, PreviewType, ShareType } from "@prisma/client";
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
