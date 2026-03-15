import { ShareType } from "@prisma/client";
import { NextResponse } from "next/server";

import { createVaultShare } from "@/lib/server/flashvault";
import { getRequestWalletAddress } from "@/lib/server/workspace";
import { shareSchema } from "@/lib/validation";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  const payload = await request.json();
  const parsed = shareSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { id } = await context.params;
    const share = await createVaultShare(getRequestWalletAddress(request), id, {
      shareType: parsed.data.shareType as ShareType,
      password: parsed.data.password,
      expiresAt: parsed.data.expiresAt,
      downloadPriceApt: parsed.data.downloadPriceApt,
      maxDownloadsPerPayment: parsed.data.maxDownloadsPerPayment,
    });

    return NextResponse.json({ share }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create vault share." },
      { status: 400 },
    );
  }
}
