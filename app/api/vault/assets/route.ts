import { PublicPreviewMode } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  createVaultAsset,
  listVaultAssets,
} from "@/lib/server/flashvault";
import { getRequestWalletAddress } from "@/lib/server/workspace";
import { createVaultAssetSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const vaultAssets = await listVaultAssets(getRequestWalletAddress(request));
  return NextResponse.json({ vaultAssets });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = createVaultAssetSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const vaultAsset = await createVaultAsset(getRequestWalletAddress(request), {
      nftObjectId: parsed.data.nftObjectId,
      collectionName: parsed.data.collectionName,
      nftName: parsed.data.nftName,
      publicPreviewMode: parsed.data.publicPreviewMode as PublicPreviewMode | undefined,
      ownerOnly: parsed.data.ownerOnly,
    });

    return NextResponse.json({ vaultAsset }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create vault asset." },
      { status: 400 },
    );
  }
}
