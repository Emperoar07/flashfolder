import { NextResponse } from "next/server";

import {
  createLoginChallenge,
  getWalletAuthStatus,
} from "@/lib/server/aptos";
import { toAptosResponse } from "@/lib/server/aptos/errors";
import { walletChallengeSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = walletChallengeSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const challenge = await createLoginChallenge(parsed.data.walletAddress);
    return NextResponse.json({ challenge, auth: getWalletAuthStatus() });
  } catch (error) {
    const mapped = toAptosResponse(error, "Unable to create login challenge.");
    return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
  }
}
