import { NextResponse } from "next/server";

import {
  deleteFile,
  getFile,
  getRequestWalletAddress,
} from "@/lib/server/workspace";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  const file = await getFile(getRequestWalletAddress(request), id);

  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  return NextResponse.json({ file });
}

export async function DELETE(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    await deleteFile(getRequestWalletAddress(request), id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete file." },
      { status: 400 },
    );
  }
}
