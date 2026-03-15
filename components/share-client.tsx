"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { FilePreview } from "@/components/file-preview";
import { useSharePurchase } from "@/lib/client/use-share-purchase";
import { apiFetch } from "@/lib/client/api";
import { VAULT_FILE_ROLES } from "@/lib/file-kinds";
import type { SharedResourcePayload } from "@/lib/types";
import { formatBytes, formatDate, shortenWallet } from "@/lib/utils";
import { useWorkspaceWallet } from "@/components/wallet-status";

type ShareClientProps = {
  token: string;
};

export function ShareClient({ token }: ShareClientProps) {
  const { connected, walletAddress } = useWorkspaceWallet();
  const { purchaseDownload, isPurchasing, error: purchaseError } = useSharePurchase();
  const [password, setPassword] = useState("");
  const [purchasedDownloadId, setPurchasedDownloadId] = useState<string | null>(null);
  const [purchaseError_state, setPurchaseError_state] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["share", token, password],
    queryFn: () =>
      apiFetch<SharedResourcePayload>(
        `/api/share/${token}${password ? `?password=${encodeURIComponent(password)}` : ""}`,
      ),
    retry: false,
  });

  if (query.isLoading) {
    return (
      <div className="share-page">
        <div className="share-card">
          <div className="share-preview">
            <div className="lock-icon">&#x1F512;</div>
          </div>
          <div className="share-body">
            <h3>LOADING...</h3>
            <div className="shared-by">Retrieving share data</div>
          </div>
        </div>
      </div>
    );
  }

  if (query.error) {
    return (
      <div className="share-page">
        <div className="share-card">
          <div className="share-preview">
            <div className="lock-icon">&#x274C;</div>
          </div>
          <div className="share-body">
            <h3>UNAVAILABLE</h3>
            <div className="shared-by">This share link is no longer valid.</div>
          </div>
        </div>
      </div>
    );
  }

  const data = query.data;

  if (!data) {
    return (
      <div className="share-page">
        <div className="share-card">
          <div className="share-preview">
            <div className="lock-icon">&#x1F512;</div>
          </div>
          <div className="share-body">
            <h3>NO DATA</h3>
            <div className="shared-by">Share data is unavailable.</div>
          </div>
        </div>
      </div>
    );
  }

  if (data.expired) {
    return (
      <div className="share-page">
        <div className="share-card">
          <div className="share-preview">
            <div className="lock-icon">&#x23F0;</div>
          </div>
          <div className="share-body">
            <h3>EXPIRED</h3>
            <div className="shared-by">This share has expired. Ask the owner for a fresh link.</div>
          </div>
        </div>
      </div>
    );
  }

  if (data.locked) {
    return (
      <div className="share-page">
        <div className="share-card">
          <div className="share-preview">
            <div className="lock-icon">&#x1F512;</div>
          </div>
          <div className="share-body">
            <h3>PASSWORD REQUIRED</h3>
            <div className="shared-by">
              This share is password protected.
            </div>
            <div className="share-badges">
              <span className="badge type">Password Protected</span>
            </div>
            <div className="password-form">
              <input
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button">Unlock</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unlocked share — file or vault
  const isFile = data.resourceType === "file";
  const fileName = isFile
    ? data.file.filename
    : data.vaultAsset.nftName ?? "FlashVault Asset";
  const sharedByAddress = isFile
    ? data.file.user.walletAddress
    : data.vaultAsset.user.walletAddress;
  const fileSize = isFile ? formatBytes(data.file.size) : null;
  const mimeType = isFile ? data.file.mimeType : null;

  const vaultPreviewFile =
    !isFile
      ? data.vaultAsset.vaultFiles.find((e) => e.role === VAULT_FILE_ROLES.TEASER) ??
        data.vaultAsset.vaultFiles.find((e) => e.role === VAULT_FILE_ROLES.PRIMARY_MEDIA) ??
        data.vaultAsset.vaultFiles[0]
      : null;

  return (
    <div className="share-page">
      <div className="share-card" style={{ maxWidth: 600 }}>
        <div className="share-preview" style={{ position: "relative" }}>
          {isFile ? (
            <FilePreview
              fileId={data.file.id}
              originalName={data.file.originalName}
              password={password}
              previewType={data.file.previewType}
              token={token}
            />
          ) : vaultPreviewFile ? (
            <FilePreview
              originalName={vaultPreviewFile.file.originalName ?? "vault-content"}
              password={password}
              previewType={vaultPreviewFile.file.previewType ?? "OTHER"}
              src={`/api/vault/assets/${data.vaultAsset.id}/content?token=${token}&role=${vaultPreviewFile.role}${password ? `&password=${encodeURIComponent(password)}` : ""}&inline=1`}
            />
          ) : (
            <div className="lock-icon">&#x1F512;</div>
          )}
        </div>
        <div className="share-body">
          <h3>{fileName.toUpperCase()}</h3>
          <div className="shared-by">
            Shared by {shortenWallet(sharedByAddress)}
          </div>
          <div className="share-badges">
            {data.share.shareType === "PASSWORD" && (
              <span className="badge type">Password Protected</span>
            )}
            {data.share.expiresAt && (
              <span className="badge exp">
                Expires {formatDate(data.share.expiresAt)}
              </span>
            )}
            {fileSize && <span className="badge">{fileSize}</span>}
            {mimeType && <span className="badge">{mimeType.split("/")[1]?.toUpperCase()}</span>}
            {!isFile && (
              <span className="badge exp">
                {data.vaultAsset.collectionName ?? "Vault"}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
            {/* Download button - handle paid vs free */}
            {isFile && data.share.downloadPriceApt && data.share.downloadPriceApt > 0 ? (
              <>
                {/* Show price info only if wallet is connected */}
                {connected && (
                  <div
                    style={{
                      background: "rgba(232,170,48,0.1)",
                      border: "1px solid rgba(232,170,48,0.3)",
                      borderRadius: 10,
                      padding: 12,
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ marginBottom: 4 }}>
                      Download requires payment of{" "}
                      <span style={{ fontWeight: "bold", color: "var(--accent-gold)" }}>
                        {data.share.downloadPriceApt} APT
                      </span>
                    </div>
                    <div style={{ fontSize: 10, opacity: 0.8 }}>
                      Payment will be sent to {shortenWallet(data.share.sharerWallet || "")}
                    </div>
                  </div>
                )}

                {/* Show message if wallet not connected */}
                {!connected && (
                  <div
                    style={{
                      background: "rgba(100,150,255,0.1)",
                      border: "1px solid rgba(100,150,255,0.3)",
                      borderRadius: 10,
                      padding: 12,
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ marginBottom: 4 }}>
                      Connect your wallet to pay{" "}
                      <span style={{ fontWeight: "bold", color: "rgba(100,150,255,0.8)" }}>
                        {data.share.downloadPriceApt} APT
                      </span>
                      {" "}and download
                    </div>
                  </div>
                )}

                {/* Download button */}
                <button
                  onClick={async () => {
                    if (!connected) {
                      setPurchaseError_state("Please connect your wallet to download");
                      return;
                    }
                    if (!walletAddress) {
                      setPurchaseError_state("Wallet address not available");
                      return;
                    }

                    try {
                      const result = await purchaseDownload({
                        shareToken: token,
                        sharerWallet: data.share.sharerWallet || "",
                        priceApt: data.share.downloadPriceApt || 0,
                      });

                      // Mark as purchased and disable further downloads
                      setPurchasedDownloadId(result.downloadId);

                      // Trigger download with the download ID
                      const downloadUrl = `/api/files/${data.file.id}/download?token=${token}&downloadId=${result.downloadId}${password ? `&password=${encodeURIComponent(password)}` : ""}`;
                      window.location.href = downloadUrl;
                    } catch (err) {
                      setPurchaseError_state(err instanceof Error ? err.message : "Payment failed");
                    }
                  }}
                  disabled={isPurchasing || !connected || purchasedDownloadId !== null}
                  style={{
                    padding: "12px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: purchasedDownloadId ? "rgba(255,255,255,0.1)" : connected ? "var(--accent-red)" : "rgba(255,255,255,0.1)",
                    color: "var(--foreground)",
                    cursor: purchasedDownloadId || !connected || isPurchasing ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    opacity: purchasedDownloadId || !connected || isPurchasing ? 0.6 : 1,
                  }}
                >
                  {purchasedDownloadId ? "Already Downloaded" : isPurchasing ? "Processing Payment..." : connected ? `Pay ${data.share.downloadPriceApt} APT to Download` : "Connect Wallet to Download"}
                </button>
              </>
            ) : (
              <Link
                href={
                  isFile
                    ? `/api/files/${data.file.id}/download?token=${token}${password ? `&password=${encodeURIComponent(password)}` : ""}`
                    : `/api/vault/assets/${data.vaultAsset.id}/content?token=${token}&download=1${password ? `&password=${encodeURIComponent(password)}` : ""}`
                }
                className="btn-primary"
                style={{ textDecoration: "none" }}
              >
                {isFile ? "Download" : "Open Vault Content"}
              </Link>
            )}

            {/* Home button */}
            <Link
              href="/"
              className="btn-secondary"
              style={{ textDecoration: "none" }}
            >
              FlashFolder
            </Link>

            {/* Error message */}
            {(purchaseError_state || purchaseError) && (
              <div
                style={{
                  background: "rgba(255,100,100,0.1)",
                  border: "1px solid rgba(255,100,100,0.3)",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 12,
                  color: "#ff6464",
                  textAlign: "center",
                }}
              >
                {purchaseError_state || purchaseError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
