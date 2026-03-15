import { NextResponse } from "next/server";

import {
  createSessionForWallet,
  getWalletAuthStatus,
} from "@/lib/server/aptos";
import { toAptosResponse } from "@/lib/server/aptos/errors";
import { ensureUser, sanitizeUserForClient } from "@/lib/server/workspace";
import { rateLimit } from "@/lib/server/rate-limit";
import { walletAuthSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rl = rateLimit(request, { keyPrefix: "auth-wallet", maxRequests: 10, windowMs: 60_000 });
  if (rl) return rl;

  try {
    const payload = await request.json();
    const parsed = walletAuthSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const user = await ensureUser(parsed.data.walletAddress, parsed.data.username);
    const session = await createSessionForWallet(parsed.data.walletAddress);
    const response = NextResponse.json({
      user: sanitizeUserForClient(user),
      session,
      auth: getWalletAuthStatus(),
    });

    response.cookies.set("ff_session", session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    });
    response.cookies.set("ff_wallet", parsed.data.walletAddress, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    const mapped = toAptosResponse(error, "Wallet login failed.");
    return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
  }
}
