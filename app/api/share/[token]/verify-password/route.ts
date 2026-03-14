import { NextResponse } from "next/server";

import { verifySharePassword } from "@/lib/server/workspace";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: Context) {
  const { token } = await context.params;
  const payload = (await request.json()) as { password?: string };

  if (!payload.password) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const valid = await verifySharePassword(token, payload.password);
  return NextResponse.json({ valid });
}
