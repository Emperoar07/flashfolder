import { ViewEventType } from "@prisma/client";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

import {
  getFile,
  getRequestWalletAddress,
  getShare,
  recordFileEvent,
} from "@/lib/server/workspace";
import { getStorageAdapter } from "@/lib/storage";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const password = searchParams.get("password") ?? undefined;
  const inline = searchParams.get("inline") === "1";

  const file = token
    ? (await getShare(token, password))?.file
    : await getFile(getRequestWalletAddress(request), id);

  if (!file || file.id !== id) {
    return NextResponse.json(
      { error: "File not found or unavailable." },
      { status: 404 },
    );
  }

  const storage = getStorageAdapter();
  const rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    const totalSize = file.size;
    const [rawStart, rawEnd] = rangeHeader.replace("bytes=", "").split("-");
    const start = Number.parseInt(rawStart, 10);
    const end = rawEnd ? Number.parseInt(rawEnd, 10) : totalSize - 1;

    const ranged = await storage.getFileRange(file.blobKey, start, end);
    await recordFileEvent(file.id, request, ViewEventType.DOWNLOAD);

    return new NextResponse(Readable.toWeb(ranged.stream) as ReadableStream, {
      status: 206,
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Length": String(ranged.contentLength),
        "Content-Range": `bytes ${start}-${end}/${ranged.totalSize}`,
        "Content-Type": file.mimeType,
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${file.originalName}"`,
      },
    });
  }

  const stream = await storage.getFileStream(file.blobKey);
  await recordFileEvent(file.id, request, ViewEventType.DOWNLOAD);

  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Length": String(file.size),
      "Content-Type": file.mimeType,
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${file.originalName}"`,
    },
  });
}
