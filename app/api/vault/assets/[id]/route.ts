import { NextResponse } from "next/server";

import { getVaultAsset } from "@/lib/server/flashvault";
import { getRequestWalletAddress } from "@/lib/server/workspace";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  const vaultAsset = await getVaultAsset(getRequestWalletAddress(request), id);

  if (!vaultAsset) {
    return NextResponse.json({ error: "Vault asset not found." }, { status: 404 });
  }

  return NextResponse.json({ vaultAsset });
}
