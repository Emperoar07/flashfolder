import { NextResponse } from "next/server";

import { getSettingsSnapshot } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ settings: getSettingsSnapshot() });
}
