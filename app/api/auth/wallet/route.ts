import { NextResponse } from "next/server";

import { ensureUser } from "@/lib/server/workspace";
import { walletAuthSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = walletAuthSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const user = await ensureUser(parsed.data.walletAddress, parsed.data.username);
  return NextResponse.json({ user });
}
