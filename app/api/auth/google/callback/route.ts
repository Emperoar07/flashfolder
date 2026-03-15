import { NextResponse } from "next/server";

import { ensureUser } from "@/lib/server/workspace";
import { createSessionForWallet } from "@/lib/server/aptos";

export const runtime = "nodejs";

/**
 * Google OAuth callback endpoint.
 *
 * Exchanges the authorization code for tokens, fetches user info,
 * and creates a session. The user's Google email is used as a
 * pseudo-wallet address for workspace association.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?auth=error`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/?auth=google-not-configured`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${baseUrl}/?auth=error`);
    }

    const tokens = (await tokenRes.json()) as { access_token: string };

    // Fetch user info
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(`${baseUrl}/?auth=error`);
    }

    const userInfo = (await userInfoRes.json()) as {
      id: string;
      email: string;
      name?: string;
    };

    // Create user with Google email as wallet address identifier
    const googleWalletId = `google:${userInfo.email}`;
    await ensureUser(googleWalletId, userInfo.name ?? userInfo.email);
    const session = await createSessionForWallet(googleWalletId);

    // Redirect to dashboard with session info stored in cookie-like query
    const response = NextResponse.redirect(`${baseUrl}/dashboard`);
    response.cookies.set("ff_session", session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400, // 24 hours
      path: "/",
    });
    response.cookies.set("ff_wallet", googleWalletId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.redirect(`${baseUrl}/?auth=error`);
  }
}
