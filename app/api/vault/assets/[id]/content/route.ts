import { VaultFileRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { readVaultContentBuffer, resolveVaultContent } from "@/lib/server/flashvault";
import { getOptionalRequestWalletAddress } from "@/lib/server/workspace";
import { getStorageAdapterForProvider } from "@/lib/storage";
import { toStorageResponse } from "@/lib/storage/errors";
import { respondWithStoredFile } from "@/lib/storage/http";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const password = searchParams.get("password") ?? undefined;
    const role = searchParams.get("role");
    const inline = searchParams.get("inline") === "1";
    const action = searchParams.get("download") === "1" ? "download" : "view";

    const resolved = await resolveVaultContent({
      vaultAssetId: id,
      walletAddress: getOptionalRequestWalletAddress(request),
      shareToken: token,
      password,
      role: role ? (role as VaultFileRole) : undefined,
      action,
    });

    if (!resolved.vaultFile.file.isEncrypted) {
      return respondWithStoredFile({
        adapter: getStorageAdapterForProvider(resolved.vaultFile.file.storageProvider),
        blobKey: resolved.vaultFile.file.blobKey,
        mimeType: resolved.vaultFile.file.mimeType,
        originalName: resolved.vaultFile.file.originalName,
        size: resolved.vaultFile.file.size,
        inline,
        request,
      });
    }

    const contentBuffer = await readVaultContentBuffer({
      blobKey: resolved.vaultFile.file.blobKey,
      storageProvider: resolved.vaultFile.file.storageProvider,
      isEncrypted: resolved.vaultFile.file.isEncrypted,
      encryptedKeyRef: resolved.vaultFile.encryptedKeyRef,
    });

    const safeName = resolved.vaultFile.file.originalName.replace(/[\r\n"]/g, "_");
    return new NextResponse(new Uint8Array(contentBuffer), {
      headers: {
        "Accept-Ranges": "none",
        "Content-Type": resolved.vaultFile.file.mimeType,
        "Content-Length": String(contentBuffer.byteLength),
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${safeName}"`,
      },
    });
  } catch (error) {
    const mapped = toStorageResponse(error, "Vault content unavailable.");
    return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
  }
}
