import { ViewEventType } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  getFile,
  getFileShare,
  getRequestWalletAddress,
  recordFileEvent,
  getShareDownload,
  markShareDownloadAsUsed,
} from "@/lib/server/workspace";
import { getStorageAdapterForProvider } from "@/lib/storage";
import { toStorageResponse } from "@/lib/storage/errors";
import { respondWithStoredFile } from "@/lib/storage/http";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const password = searchParams.get("password") ?? undefined;
    const inline = searchParams.get("inline") === "1";
    const downloadId = searchParams.get("downloadId"); // For paid downloads
    // wallet query param for browser-native media players that can't send headers
    const walletParam = searchParams.get("wallet");

    const walletAddress = walletParam ?? getRequestWalletAddress(request);
    const fileShare = token
      ? (await getFileShare(token, password))
      : null;
    const file = fileShare?.file ?? await getFile(walletAddress, id);

    if (!file || file.id !== id) {
      return NextResponse.json(
        { error: "File not found or unavailable." },
        { status: 404 },
      );
    }

    // If share has a download price and this is a download attempt (not inline preview)
    if (token && fileShare && !inline && fileShare.share.downloadPriceApt && fileShare.share.downloadPriceApt > 0) {
      // Require downloadId from a paid purchase
      if (!downloadId) {
        return NextResponse.json(
          { error: "Payment required for download" },
          { status: 402 },
        );
      }

      // Note: downloadId is the txHash from the purchase endpoint
      // Verify the download was purchased
      try {
        const download = await getShareDownload(downloadId);
        if (!download || download.shareId !== fileShare.share.id) {
          return NextResponse.json(
            { error: "Invalid download purchase" },
            { status: 403 },
          );
        }

        if (download.downloaded) {
          return NextResponse.json(
            { error: "Download already used" },
            { status: 410 },
          );
        }

        // Mark as used
        await markShareDownloadAsUsed(downloadId);
      } catch (err) {
        return NextResponse.json(
          { error: "Invalid purchase verification" },
          { status: 403 },
        );
      }
    }

    const response = await respondWithStoredFile({
      adapter: getStorageAdapterForProvider(file.storageProvider),
      blobKey: file.blobKey,
      mimeType: file.mimeType,
      originalName: file.originalName,
      size: file.size,
      inline,
      request,
    });

    await recordFileEvent(file.id, request, ViewEventType.DOWNLOAD);
    return response;
  } catch (error) {
    const mapped = toStorageResponse(error, "File download failed.");
    return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
  }
}
