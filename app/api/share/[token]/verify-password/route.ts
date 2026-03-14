import { NextResponse } from "next/server";

import { getVaultShare } from "@/lib/server/flashvault";
import { verifySharePassword } from "@/lib/server/workspace";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: Context) {
  const { token } = await context.params;
  const payload = (await request.json()) as { password?: string };

  if (!payload.password) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const fileValid = await verifySharePassword(token, payload.password);
  const vaultValid = await getVaultShare(token, payload.password);
  const valid =
    fileValid ||
    Boolean(vaultValid && !vaultValid.locked && !vaultValid.expired);
  return NextResponse.json({ valid });
}
