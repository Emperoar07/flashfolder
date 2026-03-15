import { NextResponse } from "next/server";

import {
  getWalletAuthStatus,
  verifySignedChallenge,
} from "@/lib/server/aptos";
import { getSessionForToken } from "@/lib/server/aptos/auth";
import { ensureUser, getRequestWalletAddress } from "@/lib/server/workspace";
import { toAptosResponse } from "@/lib/server/aptos/errors";
import { walletChallengeVerifySchema } from "@/lib/validation";

export const runtime = "nodejs";

// Session restore: validates the existing ff_session cookie and returns the
// session payload so the client can skip re-signing on page refresh.
export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const sessionToken = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("ff_session="))
      ?.slice("ff_session=".length);

    const session = getSessionForToken(sessionToken ? decodeURIComponent(sessionToken) : null);

    if (!session) {
      return NextResponse.json({ error: "No active session." }, { status: 401 });
    }

    const walletAddress = getRequestWalletAddress(request);
    const user = await ensureUser(walletAddress);

    return NextResponse.json({
      user,
      session: {
        walletAddress: session.walletAddress,
        sessionToken: sessionToken!,
        authMode: session.authMode,
        network: session.network,
        expiresAt: session.expiresAt,
        isMock: false,
      },
      auth: getWalletAuthStatus(),
    } satisfies import("@/lib/types").AuthSessionPayload);
  } catch {
    return NextResponse.json({ error: "Session restore failed." }, { status: 401 });
  }
}

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
