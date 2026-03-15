import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Health-check endpoint – reports whether required environment variables are
 * set and the database is reachable. Never exposes actual secret values.
 */
export async function GET() {
  const checks: Record<string, boolean | string> = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    FLASHVAULT_ENCRYPTION_SECRET: Boolean(process.env.FLASHVAULT_ENCRYPTION_SECRET),
    FLASHFOLDER_AUTH_SECRET: Boolean(process.env.FLASHFOLDER_AUTH_SECRET),
    FLASHFOLDER_STORAGE_MODE: process.env.FLASHFOLDER_STORAGE_MODE ?? "(unset → local)",
    BLOB_READ_WRITE_TOKEN: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    NEXT_PUBLIC_APTOS_NETWORK: process.env.NEXT_PUBLIC_APTOS_NETWORK ?? "(unset → testnet)",
    NODE_ENV: process.env.NODE_ENV ?? "unknown",
  };

  let dbReachable = false;
  let dbError: string | null = null;

  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    dbReachable = true;
  } catch (error) {
    dbError = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json({
    ok: dbReachable && checks.DATABASE_URL === true && (checks.FLASHVAULT_ENCRYPTION_SECRET === true || checks.FLASHFOLDER_AUTH_SECRET === true),
    checks,
    db: { reachable: dbReachable, error: dbError },
  });
}
