import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { createSessionForWallet } from "@/lib/server/aptos";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
    const walletId = `email:${normalizedEmail}`;

    const user = await prisma.user.findUnique({
      where: { walletAddress: walletId },
    });

    if (!user || !user.username?.includes("::")) {
      return NextResponse.json(
        { error: "No account found with this email. Please sign up first." },
        { status: 401 },
      );
    }

    // Extract stored password hash
    const storedHash = user.username.split("::")[1];
    if (!storedHash) {
      return NextResponse.json(
        { error: "Account configuration error. Please contact support." },
        { status: 500 },
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
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });
    response.cookies.set("ff_wallet", walletId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
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
