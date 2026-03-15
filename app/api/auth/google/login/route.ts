import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { createSessionForWallet } from "@/lib/server/aptos";
import { rateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rl = rateLimit(request, { keyPrefix: "auth-login", maxRequests: 5, windowMs: 60_000 });
  if (rl) return rl;

  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
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

    const user = await prisma.user.findUnique({
      where: { walletAddress: walletId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email. Please sign up first." },
        { status: 401 },
      );
    }

    // Read from dedicated column, fall back to legacy username::hash format
    const storedHash = user.passwordHash ?? (user.username?.includes("::") ? user.username.split("::")[1] : null);
    if (!storedHash) {
      return NextResponse.json(
        { error: "No account found with this email. Please sign up first." },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, storedHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401 },
      );
    }

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
      { error: error instanceof Error ? error.message : "Login failed." },
      { status: 500 },
    );
  }
}
