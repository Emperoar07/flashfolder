import { NextResponse } from "next/server";

import { verifyVaultOwnership } from "@/lib/server/flashvault";
import { getRequestWalletAddress } from "@/lib/server/workspace";
import { toAptosResponse } from "@/lib/server/aptos/errors";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const result = await verifyVaultOwnership(getRequestWalletAddress(request), id);
    return NextResponse.json(result);
  } catch (error) {
    const mapped = toAptosResponse(error, "Ownership verification failed.");
    return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
  }
}
