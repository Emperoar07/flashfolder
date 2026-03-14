import { NextResponse } from "next/server";

import {
  deleteFolder,
  getRequestWalletAddress,
  updateFolder,
} from "@/lib/server/workspace";
import { updateFolderSchema } from "@/lib/validation";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  const payload = await request.json();
  const parsed = updateFolderSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { id } = await context.params;
    const folder = await updateFolder(
      getRequestWalletAddress(request),
      id,
      parsed.data,
    );
    return NextResponse.json({ folder });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update folder." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    await deleteFolder(getRequestWalletAddress(request), id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete folder." },
      { status: 400 },
    );
  }
}
