import { NextResponse } from "next/server";

import {
  getFileShare,
  recordShareDownloadPayment,
  getShareDownload,
} from "@/lib/server/workspace";
import { rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: Context) {
  const rl = rateLimit(request, { keyPrefix: "purchase", maxRequests: 10, windowMs: 60_000 });
  if (rl) return rl;

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

    // Validate txHash looks like a real Aptos transaction hash (0x-prefixed hex, 64 chars)
    const txHash = String(body.txHash).trim();
    if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
      return NextResponse.json(
        { error: "Invalid transaction hash format" },
        { status: 400 },
      );
    }

    // Ensure buyerWallet is a string (fix for object serialization issues)
    const buyerWallet = String(body.buyerWallet).trim();
    if (!buyerWallet || buyerWallet.length === 0) {
      return NextResponse.json(
        { error: "Invalid buyerWallet format" },
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

    // Record the payment
    // TODO: verify txHash on-chain via Aptos SDK before recording
    // (check that the transaction exists, succeeded, transferred the correct amount
    //  to the sharer wallet, and references the correct share)
    const download = await recordShareDownloadPayment(
      token,
      txHash,
      buyerWallet,
    );

    return NextResponse.json(
      {
        success: true,
        downloadId: txHash,
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
