import { NextResponse } from "next/server";

import { getShare } from "@/lib/server/workspace";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, context: Context) {
  const { token } = await context.params;
  const password = new URL(request.url).searchParams.get("password") ?? undefined;
  const result = await getShare(token, password);

  if (!result) {
    return NextResponse.json({ error: "Share not found." }, { status: 404 });
  }

  return NextResponse.json(result);
}
