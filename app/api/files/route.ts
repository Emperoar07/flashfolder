import { NextResponse } from "next/server";

import { getFiles, getRequestWalletAddress } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const search = searchParams.get("search");
    const sortFieldParam = searchParams.get("sortField");
    const sortDirParam = searchParams.get("sortDir");
    const scopeParam = searchParams.get("scope");
    const sortField =
      sortFieldParam === "name" ||
      sortFieldParam === "size" ||
      sortFieldParam === "date" ||
      sortFieldParam === "type"
        ? sortFieldParam
        : "date";
    const sortDir = sortDirParam === "asc" || sortDirParam === "desc" ? sortDirParam : "desc";
    const scope = scopeParam === "folder" ? "folder" : "workspace";
    const files = await getFiles(getRequestWalletAddress(request), {
      folderId,
      search,
      sortField,
      sortDir,
      scope,
    });

    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load files." },
      { status: 401 },
    );
  }
}
