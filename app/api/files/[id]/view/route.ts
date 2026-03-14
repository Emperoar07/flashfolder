import { ViewEventType } from "@prisma/client";
import { NextResponse } from "next/server";

import { recordFileEvent } from "@/lib/server/workspace";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  await recordFileEvent(id, request, ViewEventType.VIEW);
  return NextResponse.json({ success: true });
}
