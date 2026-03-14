import { NextResponse } from "next/server";

import {
  getWalletAuthStatus,
  verifySignedChallenge,
} from "@/lib/server/aptos";
import { ensureUser } from "@/lib/server/workspace";
import { toAptosResponse } from "@/lib/server/aptos/errors";
import { walletChallengeVerifySchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = walletChallengeVerifySchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const verification = await verifySignedChallenge(parsed.data);
    const user = await ensureUser(parsed.data.walletAddress);

    return NextResponse.json({
      user,
      session: verification.session,
      verified: verification.verified,
      reason: verification.reason,
      auth: getWalletAuthStatus(),
    });
  } catch (error) {
    const mapped = toAptosResponse(error, "Wallet verification failed.");
    return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
  }
}
