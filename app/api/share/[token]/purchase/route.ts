import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

import {
  getFileShare,
  recordShareDownloadPayment,
  getShareDownload,
} from "@/lib/server/workspace";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: Context) {
  const { token } = await context.params;

  try {
    const body = await request.json() as {
      txHash: string;
      buyerWallet: string;
      password?: string;
    };

    if (!body.txHash || !body.buyerWallet) {
      return NextResponse.json(
        { error: "Missing txHash or buyerWallet" },
        { status: 400 },
      );
    }

    // Verify the share exists and get details
    const shareData = await getFileShare(token, body.password);

    if (!shareData) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    if (shareData.expired) {
      return NextResponse.json(
        { error: "This share has expired" },
        { status: 410 },
      );
    }

    if (shareData.locked) {
      return NextResponse.json(
        { error: "Share is password protected - invalid password" },
        { status: 403 },
      );
    }

    const { share } = shareData;

    // Check if download price is set
    if (!share.downloadPriceApt || share.downloadPriceApt <= 0) {
      return NextResponse.json(
        { error: "This share does not require payment" },
        { status: 400 },
      );
    }

    // Check if this txHash was already used
    const existingDownload = await getShareDownload(body.txHash);
    if (existingDownload) {
      return NextResponse.json(
        { error: "Transaction already used for a purchase" },
        { status: 400 },
      );
    }

    // Record the payment (in production, you'd verify the txHash on-chain)
    // For now, we trust that the wallet signed a valid transaction
    const download = await recordShareDownloadPayment(
      token,
      body.txHash,
      body.buyerWallet,
    );

    // Return the txHash which will be used as downloadId in the download endpoint
    return NextResponse.json(
      {
        success: true,
        downloadId: body.txHash,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[purchase]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment processing failed" },
      { status: 500 },
    );
  }
}
