import { ViewEventType } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  getFile,
  getFileShare,
  getRequestWalletAddress,
  recordFileEvent,
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

    const file = token
      ? (await getFileShare(token, password))?.file
      : await getFile(getRequestWalletAddress(request), id);

    if (!file || file.id !== id) {
      return NextResponse.json(
        { error: "File not found or unavailable." },
        { status: 404 },
      );
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
