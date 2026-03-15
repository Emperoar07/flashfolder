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

    // Get the share with download info
    const share = await prisma.share.findUnique({
      where: { token },
      select: { id: true, maxDownloadsPerPayment: true },
    });

    if (!share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    const maxDownloads = share.maxDownloadsPerPayment ?? 1;

    // Check purchases for this wallet on this share and pick one that still has remaining downloads.
    const existingPurchases = await prisma.shareDownload.findMany({
      where: {
        shareId: share.id,
        buyerWallet: walletAddress,
      },
      orderBy: { paidAt: "desc" },
    });

    const existingPurchase = existingPurchases.find((purchase) => purchase.downloadCount < maxDownloads) ?? null;
    const downloadCount = existingPurchase?.downloadCount ?? 0;
    const remainingDownloads = existingPurchase
      ? Math.max(0, maxDownloads - downloadCount)
      : 0;

    return NextResponse.json({
      hasAlreadyPaid: !!existingPurchase,
      downloadId: existingPurchase?.txHash ?? null,
      downloadCount,
      remainingDownloads,
      maxDownloads,
    });
  } catch (error) {
    console.error("[purchased]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check purchase status" },
      { status: 500 },
    );
  }
}
