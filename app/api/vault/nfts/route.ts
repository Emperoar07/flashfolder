import { NextResponse } from "next/server";

import { getAptosRuntimeStatus } from "@/lib/server/aptos";
import { toAptosResponse } from "@/lib/server/aptos/errors";
import { listWalletNfts } from "@/lib/server/flashvault";
import { getRequestWalletAddress } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const walletAddress = getRequestWalletAddress(request);
    const nfts = await listWalletNfts(walletAddress);
    return NextResponse.json({ nfts, aptos: getAptosRuntimeStatus() });
  } catch (error) {
    const mapped = toAptosResponse(error, "Unable to load owned NFTs.");
    return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
  }
}
