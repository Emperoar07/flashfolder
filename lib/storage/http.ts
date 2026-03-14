import { Readable } from "node:stream";
import { NextResponse } from "next/server";

import { StorageError } from "@/lib/storage/errors";
import type { StorageAdapter } from "@/lib/storage/types";

export function parseByteRange(rangeHeader: string, totalSize: number) {
  const [rawStart, rawEnd] = rangeHeader.replace("bytes=", "").split("-");
  const start = Number.parseInt(rawStart, 10);
  const end = rawEnd ? Number.parseInt(rawEnd, 10) : totalSize - 1;

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    start < 0 ||
    end < start ||
    end >= totalSize
  ) {
    throw new StorageError("INVALID_RANGE", "Requested byte range is invalid.", {
      status: 416,
    });
  }

  return { start, end };
}

export async function respondWithStoredFile(args: {
  adapter: StorageAdapter;
  blobKey: string;
  mimeType: string;
  originalName: string;
  size: number;
  inline: boolean;
  request: Request;
}) {
  const rangeHeader = args.request.headers.get("range");

  if (rangeHeader) {
    const { start, end } = parseByteRange(rangeHeader, args.size);
    const ranged = await args.adapter.getFileRange(args.blobKey, start, end);

    return new NextResponse(Readable.toWeb(ranged.stream) as ReadableStream, {
      status: 206,
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Length": String(ranged.contentLength),
        "Content-Range": `bytes ${ranged.start}-${ranged.end}/${ranged.totalSize}`,
        "Content-Type": args.mimeType,
        "Content-Disposition": `${args.inline ? "inline" : "attachment"}; filename="${args.originalName}"`,
      },
    });
  }

  const streamed = await args.adapter.getFileStream(args.blobKey);

  return new NextResponse(Readable.toWeb(streamed.stream) as ReadableStream, {
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": String(streamed.metadata.byteLength ?? args.size),
      "Content-Type": args.mimeType,
      "Content-Disposition": `${args.inline ? "inline" : "attachment"}; filename="${args.originalName}"`,
    },
  });
}
