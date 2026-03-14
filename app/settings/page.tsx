import Link from "next/link";

import { getSettingsSnapshot } from "@/lib/server/workspace";

export default async function SettingsPage() {
  const settings = getSettingsSnapshot();

  return (
    <main className="mx-auto max-w-5xl px-6 pb-16 pt-10 sm:px-8">
      <div className="rounded-[2rem] bg-[#111] p-8">
        <p className="text-xs uppercase tracking-[0.25em] text-[rgba(240,237,230,0.35)]">
          Settings
        </p>
        <h1 className="mt-4 text-4xl font-semibold font-[family-name:var(--font-bebas-neue)] tracking-[0.06em] text-[#f0ede6]">
          Runtime integration settings
        </h1>
        <p className="mt-3 max-w-2xl text-[rgba(240,237,230,0.55)]">
          FlashFolder can now run on a temporary production-safe Blob adapter
          while Shelby access is pending. When Shelby credentials arrive, you
          can switch storage modes without rewriting the product layer.
          FlashVault uses the same storage boundary, plus a separate ownership
          verification layer for Aptos NFT content.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-sm text-[rgba(240,237,230,0.35)]">Requested mode</p>
            <p className="mt-2 text-2xl font-semibold text-[#f0ede6]">
              {settings.requestedStorageMode}
            </p>
          </div>
          <div className="rounded-3xl bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-sm text-[rgba(240,237,230,0.35)]">Aptos network</p>
            <p className="mt-2 text-2xl font-semibold text-[#f0ede6]">
              {settings.aptosNetwork}
            </p>
          </div>
          <div className="rounded-3xl bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-sm text-[rgba(240,237,230,0.35)]">Blob configured</p>
            <p className="mt-2 text-2xl font-semibold text-[#f0ede6]">
              {settings.blobConfigured ? "Yes" : "Not yet"}
            </p>
          </div>
          <div className="rounded-3xl bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-sm text-[rgba(240,237,230,0.35)]">Active adapter</p>
            <p className="mt-2 text-2xl font-semibold text-[#f0ede6]">
              {settings.activeStorageMode}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-sm text-[rgba(240,237,230,0.35)]">Integration status</p>
            <p className="mt-2 text-2xl font-semibold text-[#f0ede6]">
              {settings.storageState.replaceAll("_", " ")}
            </p>
          </div>
          <div className="rounded-3xl bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-sm text-[rgba(240,237,230,0.35)]">Upload limit</p>
            <p className="mt-2 text-2xl font-semibold text-[#f0ede6]">
              {settings.maxUploadMb} MB
            </p>
            {settings.maxUploadMb !== settings.configuredMaxUploadMb ? (
              <p className="mt-2 text-sm text-[rgba(240,237,230,0.35)]">
                Configured for {settings.configuredMaxUploadMb} MB, capped by the
                active adapter.
              </p>
            ) : null}
          </div>
        </div>

        {settings.storageFallbackReason ? (
          <div className="mt-4 rounded-3xl border border-[rgba(184,160,106,0.2)] bg-[rgba(184,160,106,0.08)] p-5 text-sm text-[#b8a06a]">
            {settings.storageFallbackReason}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-[rgba(240,237,230,0.35)]">
              Aptos provider mode
            </p>
            <h2 className="mt-3 text-2xl font-semibold font-[family-name:var(--font-bebas-neue)] tracking-[0.06em] text-[#f0ede6]">
              {settings.aptos.integrationState.replaceAll("_", " ")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[rgba(240,237,230,0.55)]">
              {settings.aptos.notes ??
                "Aptos services are isolated behind discovery and ownership verification providers."}
            </p>
          </div>
          <div className="rounded-3xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-[rgba(240,237,230,0.35)]">
              Wallet auth mode
            </p>
            <h2 className="mt-3 text-2xl font-semibold font-[family-name:var(--font-bebas-neue)] tracking-[0.06em] text-[#f0ede6]">
              {settings.walletAuth.mode}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[rgba(240,237,230,0.55)]">
              {settings.walletAuth.challengeFlowReady
                ? "Challenge-response login is scaffolded and ready for real signature verification wiring."
                : "Mock wallet auth is active for local demos and product development."}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-sm text-[rgba(240,237,230,0.35)]">Aptos source</p>
            <p className="mt-2 text-2xl font-semibold text-[#f0ede6]">
              {settings.aptos.source}
            </p>
          </div>
          <div className="rounded-3xl bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-sm text-[rgba(240,237,230,0.35)]">Mock enabled</p>
            <p className="mt-2 text-2xl font-semibold text-[#f0ede6]">
              {settings.aptos.mockEnabled ? "Yes" : "No"}
            </p>
          </div>
          <div className="rounded-3xl bg-[rgba(255,255,255,0.03)] p-5">
            <p className="text-sm text-[rgba(240,237,230,0.35)]">Indexer configured</p>
            <p className="mt-2 text-2xl font-semibold text-[#f0ede6]">
              {settings.aptos.indexerConfigured ? "Yes" : "Not yet"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-[rgba(240,237,230,0.35)]">
              FlashVault mode
            </p>
            <h2 className="mt-3 text-2xl font-semibold font-[family-name:var(--font-bebas-neue)] tracking-[0.06em] text-[#f0ede6]">
              Private vault for Aptos NFT content
            </h2>
            <p className="mt-3 text-sm leading-6 text-[rgba(240,237,230,0.55)]">
              FlashVault protects owner-gated media and unlockables. It does not
              hide NFT ownership from the blockchain, so the correct mental model
              is: vault the content, not the chain record.
            </p>
          </div>
          <div className="rounded-3xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-[rgba(240,237,230,0.35)]">
              Mock chain reads
            </p>
            <h2 className="mt-3 text-2xl font-semibold font-[family-name:var(--font-bebas-neue)] tracking-[0.06em] text-[#f0ede6]">
              Replaceable Aptos ownership service
            </h2>
            <p className="mt-3 text-sm leading-6 text-[rgba(240,237,230,0.55)]">
              The current build uses mock digital asset data for demo speed. When
              you move to real networks, swap the isolated Aptos service instead
              of rewriting the UI or the vault storage flow.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-[rgba(255,255,255,0.05)] p-6">
          <p className="text-sm font-semibold text-[#f0ede6]">Recommended rollout</p>
          <p className="mt-3 text-[rgba(240,237,230,0.55)]">
            1. Connect `BLOB_READ_WRITE_TOKEN` and switch
            `FLASHFOLDER_STORAGE_MODE` to `blob` for temporary production-safe
            uploads on Vercel.
          </p>
          <p className="mt-2 text-[rgba(240,237,230,0.55)]">
            2. Keep Blob mode for small server-side uploads while Shelby access
            is pending.
          </p>
          <p className="mt-2 text-[rgba(240,237,230,0.55)]">
            3. Add `SHELBY_API_KEY`, `SHELBY_RPC_URL`, and namespace values when
            you receive them.
          </p>
          <p className="mt-2 text-[rgba(240,237,230,0.55)]">
            4. Replace the placeholder methods in
            `lib/storage/shelby-storage.ts`.
          </p>
          <p className="mt-2 text-[rgba(240,237,230,0.55)]">
            5. Swap mock Aptos NFT reads for real wallet ownership checks in
            `lib/server/aptos/service.ts`.
          </p>
          <p className="mt-2 text-[rgba(240,237,230,0.55)]">
            6. Remove fallback-to-local behavior only after Shelby uploads,
            downloads, and range reads pass the integration checklist.
          </p>
          <p className="mt-2 text-[rgba(240,237,230,0.55)]">
            7. Replace mock wallet login with real challenge verification in
            `lib/server/aptos/auth.ts`.
          </p>
          <p className="mt-4 text-sm text-[#b8a06a]">
            On Vercel, local storage is ephemeral. Use `blob` as the temporary
            production adapter and reserve `local` for local development only.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex rounded-full bg-[#c8392b] px-5 py-3 text-sm font-semibold text-[#f0ede6]"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
          <Link
            className="inline-flex rounded-full bg-[rgba(255,255,255,0.05)] px-5 py-3 text-sm font-semibold text-[rgba(240,237,230,0.55)]"
            href="/vault"
          >
            Open vault
          </Link>
        </div>
      </div>
    </main>
  );
}
