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
    const response = NextResponse.json({
      user,
      session: verification.session,
      verified: verification.verified,
      reason: verification.reason,
      auth: getWalletAuthStatus(),
    });

    response.cookies.set("ff_session", verification.session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });
    response.cookies.set("ff_wallet", parsed.data.walletAddress, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    const mapped = toAptosResponse(error, "Wallet verification failed.");
    return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
  }
}
