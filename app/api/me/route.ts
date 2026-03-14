import { NextResponse } from "next/server";

import {
  getCurrentUserProfile,
  getRequestWalletAddress,
} from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const profile = await getCurrentUserProfile(getRequestWalletAddress(request));
  return NextResponse.json(profile);
}
