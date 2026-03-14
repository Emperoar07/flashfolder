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
          Runtime integration settings
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          FlashFolder is running in local mock mode until Shelby access is
          approved. When you receive credentials, update your environment
          variables and replace the TODOs in the Shelby adapter. FlashVault uses
          the same storage boundary, plus a separate ownership verification layer
          for Aptos NFT content.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Requested mode</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {settings.requestedStorageMode}
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
            <p className="text-sm text-slate-500">Active adapter</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {settings.activeStorageMode}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Integration status</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {settings.storageState.replaceAll("_", " ")}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Upload limit</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {settings.maxUploadMb} MB
            </p>
          </div>
        </div>

        {settings.storageFallbackReason ? (
          <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            {settings.storageFallbackReason}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Aptos provider mode
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              {settings.aptos.integrationState.replaceAll("_", " ")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {settings.aptos.notes ??
                "Aptos services are isolated behind discovery and ownership verification providers."}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Wallet auth mode
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              {settings.walletAuth.mode}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {settings.walletAuth.challengeFlowReady
                ? "Challenge-response login is scaffolded and ready for real signature verification wiring."
                : "Mock wallet auth is active for local demos and product development."}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Aptos source</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {settings.aptos.source}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Mock enabled</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {settings.aptos.mockEnabled ? "Yes" : "No"}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Indexer configured</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {settings.aptos.indexerConfigured ? "Yes" : "Not yet"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              FlashVault mode
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              Private vault for Aptos NFT content
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              FlashVault protects owner-gated media and unlockables. It does not
              hide NFT ownership from the blockchain, so the correct mental model
              is: vault the content, not the chain record.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Mock chain reads
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              Replaceable Aptos ownership service
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The current build uses mock digital asset data for demo speed. When
              you move to real networks, swap the isolated Aptos service instead
              of rewriting the UI or the vault storage flow.
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
          <p className="mt-2 text-white/70">
            4. Swap mock Aptos NFT reads for real wallet ownership checks in
            `lib/server/aptos/service.ts`.
          </p>
          <p className="mt-2 text-white/70">
            5. Remove fallback-to-local behavior only after Shelby uploads,
            downloads, and range reads pass the integration checklist.
          </p>
          <p className="mt-2 text-white/70">
            6. Replace mock wallet login with real challenge verification in
            `lib/server/aptos/auth.ts`.
          </p>
          <p className="mt-4 text-sm text-amber-300">
            On Vercel, local storage is ephemeral. Keep `local` mode for local dev only.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
          <Link
            className="inline-flex rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700"
            href="/vault"
          >
            Open vault
          </Link>
        </div>
      </div>
    </main>
  );
}
