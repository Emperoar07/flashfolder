import { NextResponse } from "next/server";

import { getFiles, getRequestWalletAddress } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get("folderId");
  const files = await getFiles(getRequestWalletAddress(request), folderId);
  return NextResponse.json({ files });
}
