"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useWorkspaceWallet } from "@/components/wallet-status";
import { WorkspaceDropdown } from "@/components/workspace-dropdown";
import {
  useCreateVaultAsset,
  useCurrentUser,
  useVaultAssets,
  useWalletNfts,
} from "@/lib/client/hooks";
import { formatDate } from "@/lib/utils";

const GRAD_CLASSES = ["grad1", "grad2", "grad3"];
const GRAD_EMOJIS = ["\u{1F3A8}", "\u{1F30A}", "\u{1F331}"];

export function VaultDashboardClient() {
  const router = useRouter();
  const { walletAddress, isAuthenticated } = useWorkspaceWallet();
  const profileQuery = useCurrentUser(walletAddress, { enabled: isAuthenticated });
  const vaultAssetsQuery = useVaultAssets(walletAddress);
  const walletNftsQuery = useWalletNfts(walletAddress);
  const createVaultAsset = useCreateVaultAsset(walletAddress);
  const [importingId, setImportingId] = useState<string | null>(null);

  const vaultAssets = vaultAssetsQuery.data?.vaultAssets ?? [];
  const ownedNfts = walletNftsQuery.data?.nfts ?? [];
  const importedObjectIds = new Set(vaultAssets.map((asset) => asset.nftObjectId));
  const availableImports = ownedNfts.filter(
    (asset) => !importedObjectIds.has(asset.objectId),
  );

  return (
    <div className="vault-page">
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <WorkspaceDropdown activePage="vault" />

        <div>
          <div className="sidebar-section-label">How FlashVault Works</div>
          <div className="how-works">
            <div className="how-step">
              <div className="how-num">01</div>
              <div className="how-step-text">
                <h4>Connect Wallet</h4>
                <p>Link your Aptos wallet to authenticate and verify on-chain identity.</p>
              </div>
            </div>
            <div className="how-step">
              <div className="how-num">02</div>
              <div className="how-step-text">
                <h4>Import NFT</h4>
                <p>Select an NFT from your wallet to create a gated vault bound to that token.</p>
              </div>
            </div>
            <div className="how-step">
              <div className="how-num">03</div>
              <div className="how-step-text">
                <h4>Upload Content</h4>
                <p>Add files to your vault. Only holders of the linked NFT can access them.</p>
              </div>
            </div>
            <div className="how-step">
              <div className="how-num">04</div>
              <div className="how-step-text">
                <h4>Share or Sell</h4>
                <p>Transfer the NFT to grant access, or sell it with content attached.</p>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "auto",
            padding: 16,
            background: "var(--accent-gold-subtle)",
            border: "1px solid var(--border-gold)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "var(--accent-gold)",
              marginBottom: 6,
            }}
          >
            Privacy Note
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Vault contents are encrypted and access-gated by NFT ownership.
            FlashFolder never stores your private keys.
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="vault-main">
        <div className="vault-hero">
          <div className="section-label">FlashVault</div>
          <h2>
            YOUR NFTS. YOUR <em>VAULT.</em>
          </h2>
          <p>
            Gate files behind NFT ownership. Only token holders can unlock and
            access vault contents, verified on-chain through Aptos.
          </p>
          <div className="vault-metrics">
            <div className="metric">
              <div className="metric-value">
                {profileQuery.data?.stats.vaultAssetCount ?? vaultAssets.length}
              </div>
              <div className="metric-label">Active Vaults</div>
            </div>
            <div className="metric">
              <div className="metric-value">
                {vaultAssets.reduce((sum, a) => sum + a.vaultFiles.length, 0)}
              </div>
              <div className="metric-label">Vaulted Files</div>
            </div>
            <div className="metric">
              <div className="metric-value">{ownedNfts.length}</div>
              <div className="metric-label">NFTs Linked</div>
            </div>
          </div>
        </div>

        <div className="file-table-header">
          <h3 style={{ fontFamily: "var(--font-bebas-neue)", fontSize: 18, letterSpacing: "0.1em" }}>
            YOUR VAULTS
          </h3>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {vaultAssets.length} vault{vaultAssets.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="nft-grid">
          {vaultAssets.length === 0 && (
            <div
              className="nft-card"
              style={{
                borderStyle: "dashed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 280,
              }}
            >
              <div style={{ textAlign: "center", padding: 32 }}>
                <div style={{ fontSize: 32, opacity: 0.15, marginBottom: 12 }}>🔒</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                  No vaults yet
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
                  Import an NFT below to create your first vault
                </div>
              </div>
            </div>
          )}
          {vaultAssets.map((asset, i) => {
            const meta = asset.nftMetadataSnapshot as { imageUrl?: string } | null;
            return (
            <div key={asset.id} className="nft-card" style={{ color: "inherit" }}>
              <div className="nft-thumb">
                {meta?.imageUrl ? (
                  <img
                    src={meta.imageUrl}
                    alt={asset.nftName ?? "NFT"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                <div className={`nft-thumb-inner ${GRAD_CLASSES[i % 3]}`}>
                  {GRAD_EMOJIS[i % 3]}
                </div>
                )}
                <span className="nft-badge owner">Owner</span>
              </div>
              <div className="nft-info">
                <div className="nft-name">{asset.nftName ?? asset.nftObjectId}</div>
                <div className="nft-collection">{asset.collectionName ?? "Vault asset"}</div>
                <div className="nft-stats">
                  <span className="nft-stat">
                    <strong>{asset.vaultFiles.length}</strong> files
                  </span>
                  <span className="nft-stat">
                    <strong>{asset.shares.length}</strong> shares
                  </span>
                </div>
                <Link
                  href={`/vault/${asset.id}`}
                  className="btn-primary"
                  style={{ display: "block", textAlign: "center", marginTop: 12, textDecoration: "none" }}
                >
                  Open Vault
                </Link>
              </div>
            </div>
            );
          })}
        </div>

        {/* AVAILABLE NFTs — not yet imported */}
        {availableImports.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <div className="file-table-header">
              <h3 style={{ fontFamily: "var(--font-bebas-neue)", fontSize: 18, letterSpacing: "0.1em" }}>
                AVAILABLE NFTS
              </h3>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {availableImports.length} NFT{availableImports.length !== 1 ? "s" : ""} ready to import
              </span>
            </div>

            <div className="nft-grid">
              {availableImports.map((nft, i) => {
                const isImporting = importingId === nft.objectId;
                return (
                  <div key={nft.objectId} className="nft-card">
                    <div className="nft-thumb">
                      {nft.imageUrl ? (
                        <img
                          src={nft.imageUrl}
                          alt={nft.tokenName}
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius-sm)" }}
                        />
                      ) : (
                        <div className={`nft-thumb-inner ${GRAD_CLASSES[(i + vaultAssets.length) % 3]}`}>
                          {GRAD_EMOJIS[(i + vaultAssets.length) % 3]}
                        </div>
                      )}
                      <span className="nft-badge available">Available</span>
                    </div>
                    <div className="nft-info">
                      <div className="nft-name">{nft.tokenName}</div>
                      <div className="nft-collection">{nft.collectionName}</div>
                      {nft.description && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {nft.description}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "0 16px 16px" }}>
                      <button
                        className="btn-primary"
                        style={{ width: "100%", padding: "10px 0", fontSize: 10 }}
                        disabled={isImporting || createVaultAsset.isPending}
                        onClick={async () => {
                          setImportingId(nft.objectId);
                          try {
                            const result = await createVaultAsset.mutateAsync({
                              nftObjectId: nft.objectId,
                              collectionName: nft.collectionName,
                              nftName: nft.tokenName,
                              publicPreviewMode: "TEASER",
                              ownerOnly: true,
                            });
                            router.push(`/vault/${result.vaultAsset.id}`);
                          } catch {
                            setImportingId(null);
                          }
                        }}
                        type="button"
                      >
                        {isImporting ? "Importing…" : "Import to Vault"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 40 }}>
          <div className="sidebar-section-label">Vault Activity</div>
          <div className="activity-list">
            {vaultAssets
              .flatMap((asset) =>
                asset.accessLogs.map((log) => ({ ...log, assetName: asset.nftName })),
              )
              .slice(0, 5)
              .map((log) => (
                <div key={log.id} className="activity-item">
                  <div className="activity-dot gold" />
                  <div>
                    <div className="activity-text">
                      {log.accessType.replaceAll("_", " ").toLowerCase()}
                      {log.assetName ? ` — ${log.assetName}` : ""}
                    </div>
                    <div className="activity-time">{formatDate(log.createdAt)}</div>
                  </div>
                </div>
              ))}
            {vaultAssets.every((a) => a.accessLogs.length === 0) && (
              <div className="activity-item">
                <div className="activity-dot" />
                <div>
                  <div className="activity-text">No vault activity yet</div>
                  <div className="activity-time">Import an NFT to get started</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
