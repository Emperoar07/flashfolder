import { NextResponse } from "next/server";

import {
  createFolder,
  getFolders,
  getRequestWalletAddress,
} from "@/lib/server/workspace";
import { createFolderSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const folders = await getFolders(getRequestWalletAddress(request));
  return NextResponse.json({ folders });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createFolderSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const folder = await createFolder(
    getRequestWalletAddress(request),
    parsed.data.name,
    parsed.data.parentFolderId,
    parsed.data.transactionHash,
  );

  return NextResponse.json({ folder }, { status: 201 });
}
