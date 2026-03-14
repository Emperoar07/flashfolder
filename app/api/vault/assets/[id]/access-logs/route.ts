import { NextResponse } from "next/server";

import { getVaultAccessLogs } from "@/lib/server/flashvault";
import { getRequestWalletAddress } from "@/lib/server/workspace";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const accessLogs = await getVaultAccessLogs(getRequestWalletAddress(request), id);
    return NextResponse.json({ accessLogs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load vault access logs." },
      { status: 403 },
    );
  }
}
