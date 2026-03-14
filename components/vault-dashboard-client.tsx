"use client";

import {
  BadgeCheck,
  EyeOff,
  FolderKanban,
  Import,
  Shield,
  Sparkles,
  TowerControl,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { WalletStatus, useWorkspaceWallet } from "@/components/wallet-status";
import { WorkspaceNav } from "@/components/workspace-nav";
import {
  useCreateVaultAsset,
  useCurrentUser,
  useVaultAssets,
  useWalletNfts,
} from "@/lib/client/hooks";
import { PREVIEW_TYPES, VAULT_FILE_ROLES } from "@/lib/file-kinds";
import { formatDate, shortenWallet } from "@/lib/utils";

function previewModeLabel(mode: string) {
  switch (mode) {
    case "HIDDEN":
      return "Hidden";
    case "BLURRED":
      return "Blurred";
    case "PLACEHOLDER":
      return "Placeholder";
    default:
      return "Teaser";
  }
}

export function VaultDashboardClient() {
  const { walletAddress } = useWorkspaceWallet();
  const profileQuery = useCurrentUser(walletAddress);
  const vaultAssetsQuery = useVaultAssets(walletAddress);
  const walletNftsQuery = useWalletNfts(walletAddress);
  const createVaultAsset = useCreateVaultAsset(walletAddress);

  const vaultAssets = vaultAssetsQuery.data?.vaultAssets ?? [];
  const ownedNfts = walletNftsQuery.data?.nfts ?? [];
  const importedObjectIds = new Set(vaultAssets.map((asset) => asset.nftObjectId));
  const availableImports = ownedNfts.filter(
    (asset) => !importedObjectIds.has(asset.objectId),
  );

  return (
    <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-6 rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            FlashVault
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Vault dashboard
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            Private vault for Aptos NFT content. Vault the content, not the chain
            record.
          </p>
        </div>

        <WorkspaceNav />

        <div className="rounded-3xl bg-slate-950 p-5 text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Current wallet
          </p>
          <p className="mt-3 text-xl font-semibold">{shortenWallet(walletAddress)}</p>
          <p className="mt-2 text-sm text-white/70">
            Ownership reads are isolated, so the mock service can be replaced with
            real Aptos checks later.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-950">Privacy explainer</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            FlashVault does not hide ownership onchain. It protects owner-gated
            media, unlockables, and collector access while the NFT record stays
            publicly queryable on Aptos.
          </p>
        </div>
      </aside>

      <section className="space-y-6">
        <div className="rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.24),transparent_35%),linear-gradient(135deg,#020617_0%,#0f172a_50%,#155e75_140%)] p-8 text-white shadow-[0_40px_120px_rgba(15,23,42,0.3)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                Optional premium mode
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                Owner-gated media and unlockables for Aptos collectibles.
              </h2>
              <p className="mt-4 max-w-xl text-base text-white/72">
                Import owned digital assets, attach encrypted files, and publish
                teaser or collector-only content without ever claiming the NFT is
                hidden from the chain.
              </p>
            </div>
            <WalletStatus />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Vault assets</p>
              <p className="mt-2 text-3xl font-semibold">
                {profileQuery.data?.stats.vaultAssetCount ?? vaultAssets.length}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Owned NFTs detected</p>
              <p className="mt-2 text-3xl font-semibold">{ownedNfts.length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Collector shares</p>
              <p className="mt-2 text-3xl font-semibold">
                {vaultAssets.reduce((sum, asset) => sum + asset.shares.length, 0)}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Locked files</p>
              <p className="mt-2 text-3xl font-semibold">
                {vaultAssets.reduce((sum, asset) => sum + asset.vaultFiles.length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Imported vaults
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">
              Collector assets already protected in FlashVault
            </h3>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {vaultAssets.map((asset) => {
                const teaserFile =
                  asset.vaultFiles.find((entry) => entry.role === VAULT_FILE_ROLES.TEASER) ??
                  null;

                return (
                  <Link
                    key={asset.id}
                    className="group rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
                    href={`/vault/${asset.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                          {asset.collectionName ?? "Vault asset"}
                        </p>
                        <h4 className="mt-2 text-xl font-semibold text-slate-950">
                          {asset.nftName ?? asset.nftObjectId}
                        </h4>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {asset.ownerOnly ? "Owner only" : "Shared"}
                      </span>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-slate-100">
                      {teaserFile && teaserFile.file.previewType === PREVIEW_TYPES.IMAGE ? (
                        <div className="relative h-48">
                          <Image
                            alt={asset.nftName ?? "Vault asset"}
                            className="object-cover transition duration-300 group-hover:scale-[1.02]"
                            fill
                            sizes="(min-width: 768px) 40vw, 100vw"
                            src={`/api/vault/assets/${asset.id}/content?role=${teaserFile.role}&inline=1`}
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex h-48 flex-col items-center justify-center bg-[radial-gradient(circle_at_top,#38bdf8,transparent_36%),#0f172a] p-6 text-center text-sm text-white/80">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/70">
                            {teaserFile ? teaserFile.file.previewType.toLowerCase() : "No teaser"}
                          </span>
                          <p className="mt-3 max-w-[16rem]">
                            {teaserFile
                              ? "Preview this vault asset from the detail page to load protected or non-image media."
                              : "Add teaser media or a placeholder file to make this vault screenshot-ready."}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-700">
                        {previewModeLabel(asset.publicPreviewMode)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-700">
                        {asset.vaultFiles.length} files
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-700">
                        {asset.shares.length} shares
                      </span>
                    </div>
                  </Link>
                );
              })}

              {vaultAssets.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-600 md:col-span-2">
                  Import your first collectible below to create a premium vault
                  space for teaser media, unlockables, and owner-only access logs.
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <Import className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    NFT import
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-950">
                    Available collectibles
                  </h3>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {availableImports.map((asset) => (
                  <div
                    key={asset.objectId}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-slate-200">
                        {asset.imageUrl ? (
                          <Image
                            alt={asset.tokenName}
                            className="object-cover"
                            fill
                            sizes="64px"
                            src={asset.imageUrl}
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-slate-300 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-700">
                            NFT
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {asset.tokenName}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {asset.collectionName}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                          {asset.description}
                        </p>
                      </div>
                    </div>
                    <button
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                      disabled={createVaultAsset.isPending}
                      onClick={() =>
                        createVaultAsset.mutate({
                          nftObjectId: asset.objectId,
                          collectionName: asset.collectionName,
                          nftName: asset.tokenName,
                          publicPreviewMode: "TEASER",
                          ownerOnly: true,
                        })
                      }
                      type="button"
                    >
                      <Shield className="h-4 w-4" />
                      Import to vault
                    </button>
                  </div>
                ))}

                {availableImports.length === 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
                    Every detected collectible already has a vault record, so the
                    next step is adding media or unlockables.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                How it works
              </p>
              <div className="mt-4 space-y-4 text-sm text-slate-600">
                <div className="flex gap-3">
                  <BadgeCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <p>Detect owned Aptos digital assets with a replaceable chain service.</p>
                </div>
                <div className="flex gap-3">
                  <FolderKanban className="mt-0.5 h-4 w-4 text-sky-600" />
                  <p>Store vault records, preview modes, shares, and logs in Postgres.</p>
                </div>
                <div className="flex gap-3">
                  <TowerControl className="mt-0.5 h-4 w-4 text-violet-600" />
                  <p>Keep Shelby isolated as the future blob layer behind the storage interface.</p>
                </div>
                <div className="flex gap-3">
                  <EyeOff className="mt-0.5 h-4 w-4 text-amber-600" />
                  <p>Serve protected content through verified routes instead of public static URLs.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-slate-950 p-6 text-white">
              <p className="text-xs uppercase tracking-[0.25em] text-white/60">
                Recent vault activity
              </p>
              <div className="mt-4 space-y-3">
                {vaultAssets.flatMap((asset) => asset.accessLogs).slice(0, 4).map((log) => (
                  <div key={log.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">
                      {log.accessType.replaceAll("_", " ").toLowerCase()}
                    </p>
                    <p className="mt-1 text-sm text-white/65">{formatDate(log.createdAt)}</p>
                  </div>
                ))}
                {vaultAssets.every((asset) => asset.accessLogs.length === 0) ? (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                    Access logs appear after ownership checks, protected previews, or
                    collector downloads.
                  </div>
                ) : null}
              </div>
              <div className="mt-5 inline-flex items-center gap-2 text-sm text-sky-300">
                <Sparkles className="h-4 w-4" />
                Ready for a Shelby early-access demo once real storage credentials land.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
