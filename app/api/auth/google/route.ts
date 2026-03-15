import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Google OAuth initiation endpoint.
 *
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars.
 * When configured, this redirects to Google's OAuth consent screen.
 * For now it returns a scaffolded response until credentials are set.
 */
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/google/callback`;

  if (!clientId) {
    // Not configured yet — redirect back with a notice
    return NextResponse.redirect(
      new URL("/?auth=google-not-configured", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
}
