import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { createSessionForWallet } from "@/lib/server/aptos";
import { ensureUser } from "@/lib/server/workspace";
import { rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rl = rateLimit(request, { keyPrefix: "auth-register", maxRequests: 5, windowMs: 60_000 });
  if (rl) return rl;

  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Email and password (min 6 chars) are required." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // RFC 5322 email format validation
    if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    const walletId = `email:${normalizedEmail}`;

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { walletAddress: walletId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 },
      );
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await ensureUser(walletId, normalizedEmail);

    // Store password hash in dedicated column
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    const session = await createSessionForWallet(walletId);

    const response = NextResponse.json({
      wallet: walletId,
      session: session.sessionToken,
    });

    response.cookies.set("ff_session", session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    });
    response.cookies.set("ff_wallet", walletId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed." },
      { status: 500 },
    );
  }
}
