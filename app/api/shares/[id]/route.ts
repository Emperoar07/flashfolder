import { NextResponse } from "next/server";

import { deleteShare, getRequestWalletAddress } from "@/lib/server/workspace";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const walletAddress = getRequestWalletAddress(request);

    // Delete the share - this will verify ownership
    await deleteShare(walletAddress, id);

    return NextResponse.json({ success: true, message: "Share revoked successfully." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to revoke share." },
      { status: 400 },
    );
  }
}
