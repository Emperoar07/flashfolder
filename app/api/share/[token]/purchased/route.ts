import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: Context) {
  try {
    const { token } = await context.params;
    const body = await request.json() as {
      walletAddress: string;
    };

    if (!body.walletAddress) {
      return NextResponse.json(
        { error: "Missing walletAddress" },
        { status: 400 },
      );
    }

    const walletAddress = String(body.walletAddress).trim();
    if (!walletAddress || walletAddress.length === 0) {
      return NextResponse.json(
        { error: "Invalid walletAddress format" },
        { status: 400 },
      );
    }

    // Get the share
    const share = await prisma.share.findUnique({
      where: { token },
      select: { id: true },
    });

    if (!share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    // Check if this wallet has already purchased from this share
    const existingPurchase = await prisma.shareDownload.findFirst({
      where: {
        shareId: share.id,
        buyerWallet: walletAddress,
      },
    });

    return NextResponse.json({
      hasAlreadyPaid: !!existingPurchase,
      downloadId: existingPurchase?.txHash ?? null,
    });
  } catch (error) {
    console.error("[purchased]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check purchase status" },
      { status: 500 },
    );
  }
}
