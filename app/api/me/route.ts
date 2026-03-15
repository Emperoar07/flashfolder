import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  ensureUser,
  getCurrentUserProfile,
  getRequestWalletAddress,
} from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const profile = await getCurrentUserProfile(getRequestWalletAddress(request));
  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  try {
    const walletAddress = getRequestWalletAddress(request);
    const user = await ensureUser(walletAddress);
    const body = (await request.json()) as { username?: string };

    if (body.username !== undefined) {
      if (typeof body.username !== "string" || body.username.length < 1 || body.username.length > 64) {
        return NextResponse.json(
          { error: "Username must be between 1 and 64 characters." },
          { status: 400 },
        );
      }

      // Preserve password hash if stored in username field (email::{hash} format)
      const existingUsername = user.username ?? "";
      const hasHash = existingUsername.includes("::");
      const newUsername = hasHash
        ? `${body.username}::${existingUsername.split("::")[1]}`
        : body.username;

      await prisma.user.update({
        where: { id: user.id },
        data: { username: newUsername },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed." },
      { status: 500 },
    );
  }
}
