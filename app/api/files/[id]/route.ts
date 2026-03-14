import { NextResponse } from "next/server";

import {
  deleteFile,
  getFile,
  getRequestWalletAddress,
  updateFile,
} from "@/lib/server/workspace";
import { updateFileSchema } from "@/lib/validation";

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

export async function PATCH(request: Request, context: Context) {
  const payload = await request.json();
  const parsed = updateFileSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { id } = await context.params;
    const file = await updateFile(getRequestWalletAddress(request), id, parsed.data);
    return NextResponse.json({ file });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update file." },
      { status: 400 },
    );
  }
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
