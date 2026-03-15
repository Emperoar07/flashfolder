"use client";

import Image from "next/image";
import Link from "next/link";

import { useWorkspaceWallet } from "@/components/wallet-status";
import {
  useCreateVaultAsset,
  useCurrentUser,
  useVaultAssets,
  useWalletNfts,
} from "@/lib/client/hooks";
import { VAULT_FILE_ROLES } from "@/lib/file-kinds";
import { formatDate } from "@/lib/utils";

const GRAD_CLASSES = ["grad1", "grad2", "grad3"];
const GRAD_EMOJIS = ["\u{1F3A8}", "\u{1F30A}", "\u{1F331}"];

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
    <div className="vault-page">
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-section-label">Workspace</div>
          <nav className="sidebar-nav">
            <Link href="/dashboard">
              <span className="icon">&#x1F4C1;</span> My Files
            </Link>
            <Link href="/share">
              <span className="icon">&#x1F517;</span> Shared
            </Link>
            <a href="#" className="active">
              <span className="icon">&#x1F512;</span> Vault
            </a>
            <Link href="/settings">
              <span className="icon">&#x2699;</span> Settings
            </Link>
          </nav>
        </div>

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
            background: "rgba(184,160,106,0.05)",
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
          {availableImports.length > 0 && (
            <button
              className="btn-primary"
              style={{ padding: "10px 24px", fontSize: 10 }}
              onClick={() => {
                const nft = availableImports[0];
                createVaultAsset.mutate({
                  nftObjectId: nft.objectId,
                  collectionName: nft.collectionName,
                  nftName: nft.tokenName,
                  publicPreviewMode: "TEASER",
                  ownerOnly: true,
                });
              }}
              type="button"
            >
              Import NFT
            </button>
          )}
        </div>

        <div className="nft-grid">
          {vaultAssets.map((asset, i) => (
            <Link key={asset.id} href={`/vault/${asset.id}`} className="nft-card" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="nft-thumb">
                <div className={`nft-thumb-inner ${GRAD_CLASSES[i % 3]}`}>
                  {GRAD_EMOJIS[i % 3]}
                </div>
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
              </div>
            </Link>
          ))}
          <div
            className="nft-card"
            style={{
              borderStyle: "dashed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 280,
            }}
            onClick={() => {
              if (availableImports.length > 0) {
                const nft = availableImports[0];
                createVaultAsset.mutate({
                  nftObjectId: nft.objectId,
                  collectionName: nft.collectionName,
                  nftName: nft.tokenName,
                  publicPreviewMode: "TEASER",
                  ownerOnly: true,
                });
              }
            }}
          >
            <div style={{ textAlign: "center", padding: 32 }}>
              <div style={{ fontSize: 32, opacity: 0.15, marginBottom: 12 }}>+</div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                }}
              >
                Import NFT
              </div>
            </div>
          </div>
        </div>

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
