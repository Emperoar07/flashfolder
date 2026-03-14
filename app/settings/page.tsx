import Link from "next/link";

import { getSettingsSnapshot } from "@/lib/server/workspace";

export default async function SettingsPage() {
  const settings = getSettingsSnapshot();

  return (
    <main className="mx-auto max-w-5xl px-6 pb-16 pt-10 sm:px-8">
      <div className="rounded-[2rem] bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
          Settings
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-950">
          Storage adapter configuration
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          FlashFolder is running in local mock mode until Shelby access is
          approved. When you receive credentials, update your environment
          variables and replace the TODOs in the Shelby adapter.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Active adapter</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {settings.storageMode}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Aptos network</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {settings.aptosNetwork}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Shelby configured</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {settings.shelbyConfigured ? "Yes" : "Not yet"}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Upload limit</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {settings.maxUploadMb} MB
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-sm font-semibold">When Shelby access lands</p>
          <p className="mt-3 text-white/70">
            1. Add `SHELBY_API_KEY`, `SHELBY_RPC_URL`, and namespace values to
            your environment.
          </p>
          <p className="mt-2 text-white/70">
            2. Swap `FLASHFOLDER_STORAGE_MODE` from `local` to `shelby`.
          </p>
          <p className="mt-2 text-white/70">
            3. Replace the placeholder methods in
            `lib/storage/shelby-storage.ts`.
          </p>
          <p className="mt-4 text-sm text-amber-300">
            On Vercel, local storage is ephemeral. Keep `local` mode for local dev only.
          </p>
        </div>

        <Link
          className="mt-8 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          href="/dashboard"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
