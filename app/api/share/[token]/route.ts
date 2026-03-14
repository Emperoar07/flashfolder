import { NextResponse } from "next/server";

import { getVaultShare } from "@/lib/server/flashvault";
import { getFileShare } from "@/lib/server/workspace";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, context: Context) {
  const { token } = await context.params;
  const password = new URL(request.url).searchParams.get("password") ?? undefined;
  const fileShare = await getFileShare(token, password);
  const result = fileShare ?? (await getVaultShare(token, password));

  if (!result) {
    return NextResponse.json({ error: "Share not found." }, { status: 404 });
  }

  return NextResponse.json(result);
}
