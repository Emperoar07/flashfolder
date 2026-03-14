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
      <aside className="space-y-6 rounded-[2rem] border border-[rgba(255,255,255,0.07)] bg-[#111] p-6 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[rgba(240,237,230,0.35)]">
            FlashVault
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-bebas-neue)] tracking-[0.06em] text-3xl font-semibold text-[#f0ede6]">
            Vault dashboard
          </h1>
          <p className="mt-3 text-sm text-[rgba(240,237,230,0.35)]">
            Private vault for Aptos NFT content. Vault the content, not the chain
            record.
          </p>
        </div>

        <WorkspaceNav />

        <div className="rounded-3xl bg-[rgba(255,255,255,0.05)] p-5 text-[#f0ede6]">
          <p className="text-xs uppercase tracking-[0.3em] text-[rgba(240,237,230,0.35)]">
            Current wallet
          </p>
          <p className="mt-3 text-xl font-semibold">{shortenWallet(walletAddress)}</p>
          <p className="mt-2 text-sm text-[rgba(240,237,230,0.55)]">
            Ownership reads are isolated, so the mock service can be replaced with
            real Aptos checks later.
          </p>
        </div>

        <div className="rounded-3xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-5">
          <p className="text-sm font-semibold text-[#f0ede6]">Privacy explainer</p>
          <p className="mt-3 text-sm leading-6 text-[rgba(240,237,230,0.55)]">
            FlashVault does not hide ownership onchain. It protects owner-gated
            media, unlockables, and collector access while the NFT record stays
            publicly queryable on Aptos.
          </p>
        </div>
      </aside>

      <section className="space-y-6">
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,#0a0a0a_0%,#141414_50%,rgba(184,160,106,0.12)_100%)] border-[rgba(255,255,255,0.07)] p-8 text-[#f0ede6]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-[rgba(240,237,230,0.35)]">
                Optional premium mode
              </p>
              <h2 className="mt-4 font-[family-name:var(--font-bebas-neue)] tracking-[0.06em] text-4xl font-semibold sm:text-5xl">
                Owner-gated media and unlockables for Aptos collectibles.
              </h2>
              <p className="mt-4 max-w-xl text-base text-[rgba(240,237,230,0.55)]">
                Import owned digital assets, attach encrypted files, and publish
                teaser or collector-only content without ever claiming the NFT is
                hidden from the chain.
              </p>
            </div>
            <WalletStatus />
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-3xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-sm text-[rgba(240,237,230,0.35)]">Vault assets</p>
              <p className="mt-2 text-3xl font-semibold">
                {profileQuery.data?.stats.vaultAssetCount ?? vaultAssets.length}
              </p>
            </div>
            <div className="rounded-3xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-sm text-[rgba(240,237,230,0.35)]">Owned NFTs detected</p>
              <p className="mt-2 text-3xl font-semibold">{ownedNfts.length}</p>
            </div>
            <div className="rounded-3xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-sm text-[rgba(240,237,230,0.35)]">Collector shares</p>
              <p className="mt-2 text-3xl font-semibold">
                {vaultAssets.reduce((sum, asset) => sum + asset.shares.length, 0)}
              </p>
            </div>
            <div className="rounded-3xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-4">
              <p className="text-sm text-[rgba(240,237,230,0.35)]">Locked files</p>
              <p className="mt-2 text-3xl font-semibold">
                {vaultAssets.reduce((sum, asset) => sum + asset.vaultFiles.length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="rounded-[2rem] border border-[rgba(255,255,255,0.07)] bg-[#111] p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.25em] text-[rgba(240,237,230,0.35)]">
              Imported vaults
            </p>
            <h3 className="mt-3 font-[family-name:var(--font-bebas-neue)] tracking-[0.06em] text-2xl font-semibold text-[#f0ede6]">
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
                    className="group rounded-[1.75rem] border border-[rgba(255,255,255,0.07)] bg-[#111] p-4 transition hover:-translate-y-0.5 hover:border-[rgba(184,160,106,0.2)]"
                    href={`/vault/${asset.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[rgba(240,237,230,0.35)]">
                          {asset.collectionName ?? "Vault asset"}
                        </p>
                        <h4 className="mt-2 text-xl font-semibold text-[#f0ede6]">
                          {asset.nftName ?? asset.nftObjectId}
                        </h4>
                      </div>
                      <span className="rounded-full bg-[rgba(184,160,106,0.1)] px-3 py-1 text-xs font-semibold text-[#b8a06a]">
                        {asset.ownerOnly ? "Owner only" : "Shared"}
                      </span>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-[rgba(255,255,255,0.05)]">
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
                        <div className="flex h-48 flex-col items-center justify-center bg-[linear-gradient(135deg,#0a0a0a_0%,#141414_50%,rgba(184,160,106,0.12)_100%)] p-6 text-center text-sm text-[rgba(240,237,230,0.55)]">
                          <span className="rounded-full border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-xs uppercase tracking-[0.22em] text-[rgba(240,237,230,0.55)]">
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
                      <span className="rounded-full bg-[rgba(255,255,255,0.05)] px-3 py-2 text-[rgba(240,237,230,0.55)]">
                        {previewModeLabel(asset.publicPreviewMode)}
                      </span>
                      <span className="rounded-full bg-[rgba(255,255,255,0.05)] px-3 py-2 text-[rgba(240,237,230,0.55)]">
                        {asset.vaultFiles.length} files
                      </span>
                      <span className="rounded-full bg-[rgba(255,255,255,0.05)] px-3 py-2 text-[rgba(240,237,230,0.55)]">
                        {asset.shares.length} shares
                      </span>
                    </div>
                  </Link>
                );
              })}

              {vaultAssets.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-[rgba(200,57,43,0.3)] bg-[rgba(255,255,255,0.03)] p-8 text-sm text-[rgba(240,237,230,0.55)] md:col-span-2">
                  Import your first collectible below to create a premium vault
                  space for teaser media, unlockables, and owner-only access logs.
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-[rgba(255,255,255,0.07)] bg-[#111] p-6 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c8392b] text-[#f0ede6]">
                  <Import className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[rgba(240,237,230,0.35)]">
                    NFT import
                  </p>
                  <h3 className="mt-1 font-[family-name:var(--font-bebas-neue)] tracking-[0.06em] text-2xl font-semibold text-[#f0ede6]">
                    Available collectibles
                  </h3>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {availableImports.map((asset) => (
                  <div
                    key={asset.objectId}
                    className="rounded-3xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-[rgba(255,255,255,0.05)]">
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
                          <div className="flex h-full items-center justify-center bg-[rgba(255,255,255,0.08)] text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(240,237,230,0.55)]">
                            NFT
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#f0ede6]">
                          {asset.tokenName}
                        </p>
                        <p className="mt-1 text-sm text-[rgba(240,237,230,0.35)]">
                          {asset.collectionName}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[rgba(240,237,230,0.35)]">
                          {asset.description}
                        </p>
                      </div>
                    </div>
                    <button
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#c8392b] px-4 py-2 text-sm font-semibold text-[#f0ede6]"
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
                  <div className="rounded-3xl bg-[rgba(255,255,255,0.03)] p-5 text-sm text-[rgba(240,237,230,0.55)]">
                    Every detected collectible already has a vault record, so the
                    next step is adding media or unlockables.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[rgba(255,255,255,0.07)] bg-[#111] p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.25em] text-[rgba(240,237,230,0.35)]">
                How it works
              </p>
              <div className="mt-4 space-y-4 text-sm text-[rgba(240,237,230,0.55)]">
                <div className="flex gap-3">
                  <BadgeCheck className="mt-0.5 h-4 w-4 text-[#b8a06a]" />
                  <p>Detect owned Aptos digital assets with a replaceable chain service.</p>
                </div>
                <div className="flex gap-3">
                  <FolderKanban className="mt-0.5 h-4 w-4 text-[#b8a06a]" />
                  <p>Store vault records, preview modes, shares, and logs in Postgres.</p>
                </div>
                <div className="flex gap-3">
                  <TowerControl className="mt-0.5 h-4 w-4 text-[#c8392b]" />
                  <p>Keep Shelby isolated as the future blob layer behind the storage interface.</p>
                </div>
                <div className="flex gap-3">
                  <EyeOff className="mt-0.5 h-4 w-4 text-[#b8a06a]" />
                  <p>Serve protected content through verified routes instead of public static URLs.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-[rgba(255,255,255,0.05)] p-6 text-[#f0ede6]">
              <p className="text-xs uppercase tracking-[0.25em] text-[rgba(240,237,230,0.35)]">
                Recent vault activity
              </p>
              <div className="mt-4 space-y-3">
                {vaultAssets.flatMap((asset) => asset.accessLogs).slice(0, 4).map((log) => (
                  <div key={log.id} className="rounded-3xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-4">
                    <p className="text-sm font-semibold text-[#f0ede6]">
                      {log.accessType.replaceAll("_", " ").toLowerCase()}
                    </p>
                    <p className="mt-1 text-sm text-[rgba(240,237,230,0.45)]">{formatDate(log.createdAt)}</p>
                  </div>
                ))}
                {vaultAssets.every((asset) => asset.accessLogs.length === 0) ? (
                  <div className="rounded-3xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-4 text-sm text-[rgba(240,237,230,0.55)]">
                    Access logs appear after ownership checks, protected previews, or
                    collector downloads.
                  </div>
                ) : null}
              </div>
              <div className="mt-5 inline-flex items-center gap-2 text-sm text-[#b8a06a]">
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
