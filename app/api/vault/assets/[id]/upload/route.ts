import { VaultFileRole } from "@prisma/client";
import { NextResponse } from "next/server";

import { uploadVaultFile } from "@/lib/server/flashvault";
import { getRequestWalletAddress } from "@/lib/server/workspace";
import { isStorageError, toStorageResponse } from "@/lib/storage/errors";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const formData = await request.formData();
    const file = formData.get("file");
    const role = formData.get("role");
    const description = formData.get("description");
    const encrypt = formData.get("encrypt");

    if (!(file instanceof File) || typeof role !== "string") {
      return NextResponse.json(
        { error: "Vault upload requires a file and role." },
        { status: 400 },
      );
    }

    const created = await uploadVaultFile(getRequestWalletAddress(request), id, {
      file,
      role: role as VaultFileRole,
      description:
        typeof description === "string" && description.length ? description : null,
      encrypt: encrypt === "true",
    });

    return NextResponse.json({ file: created }, { status: 201 });
  } catch (error) {
    if (isStorageError(error)) {
      const mapped = toStorageResponse(error, "Vault upload failed.");
      return NextResponse.json({ error: mapped.message, code: mapped.code }, { status: mapped.status });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Vault upload failed." },
      { status: 400 },
    );
  }
}
