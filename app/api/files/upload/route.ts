import { NextResponse } from "next/server";

import { getRequestWalletAddress, uploadFile } from "@/lib/server/workspace";
import { isStorageError, toStorageResponse } from "@/lib/storage/errors";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds for large file uploads
export const bodyParser = { sizeLimit: "4.5mb" }; // Match Vercel Blob practical limit

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folderId = formData.get("folderId");
    const description = formData.get("description");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "A file upload is required." },
        { status: 400 },
      );
    }

    const created = await uploadFile(getRequestWalletAddress(request), {
      file,
      folderId: typeof folderId === "string" && folderId.length ? folderId : null,
      description:
        typeof description === "string" && description.length ? description : null,
    });

    return NextResponse.json({ file: created }, { status: 201 });
  } catch (error) {
    if (isStorageError(error)) {
      const mapped = toStorageResponse(error, "Upload failed.");
      return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed." },
      { status: 400 },
    );
  }
}
