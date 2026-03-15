import { NextResponse } from "next/server";

import { getUserShares, getRequestWalletAddress } from "@/lib/server/workspace";

export async function GET(request: Request) {
  try {
    const walletAddress = getRequestWalletAddress(request);
    const shares = await getUserShares(walletAddress);
    return NextResponse.json({ shares });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load shares." },
      { status: 500 },
    );
  }
}
