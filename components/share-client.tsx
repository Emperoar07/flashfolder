"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);
  const [remainingDownloads, setRemainingDownloads] = useState(0);
  const [maxDownloads, setMaxDownloads] = useState(0);

  // Check if wallet has already purchased this share
  useEffect(() => {
    if (connected && walletAddress) {
      setCheckingPurchase(true);
      fetch(`/api/share/${token}/purchased`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.hasAlreadyPaid) {
            setPurchasedDownloadId(data.downloadId);
            setAlreadyPurchased(true);
            setDownloadCount(data.downloadCount ?? 0);
            setRemainingDownloads(data.remainingDownloads ?? 0);
            setMaxDownloads(data.maxDownloads ?? 1);
          }
          setCheckingPurchase(false);
        })
        .catch((err) => {
          console.error("Failed to check purchase status:", err);
          setCheckingPurchase(false);
        });
    }
  }, [connected, walletAddress, token]);

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
            {/* Already purchased status */}
            {alreadyPurchased && connected && (
              <div
                style={{
                  background: "var(--success-subtle)",
                  border: "1px solid var(--success-border)",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  textAlign: "center",
                }}
              >
                <div style={{ marginBottom: 4, color: "var(--success)", fontWeight: "bold" }}>
                  ✓ Already purchased with this wallet
                </div>
                <div style={{ fontSize: 10, opacity: 0.8 }}>
                  {remainingDownloads > 0 
                    ? `${remainingDownloads} download${remainingDownloads !== 1 ? "s" : ""} of ${maxDownloads} remaining`
                    : "All downloads used"}
                </div>
              </div>
            )}

            {/* Checking purchase status */}
            {connected && checkingPurchase && (
              <div
                style={{
                  background: "var(--neutral-bg)",
                  border: "1px solid var(--neutral-border)",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  textAlign: "center",
                }}
              >
                Verifying purchase status...
              </div>
            )}

            {/* Download section - require wallet connection */}
            {!connected ? (
              <div
                style={{
                  background: "var(--info-bg)",
                  border: "1px solid var(--info-border)",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  textAlign: "center",
                }}
              >
                <div style={{ marginBottom: 4 }}>
                  Connect your wallet to access this {isFile ? "file" : "content"}
                </div>
              </div>
            ) : alreadyPurchased && isFile && data.share.downloadPriceApt && data.share.downloadPriceApt > 0 ? (
              remainingDownloads > 0 ? (
                <Link
                  href={
                    `/api/files/${data.file.id}/download?token=${token}&downloadId=${purchasedDownloadId}${walletAddress ? `&wallet=${encodeURIComponent(walletAddress)}` : ""}${password ? `&password=${encodeURIComponent(password)}` : ""}`
                  }
                  className="btn-primary"
                  style={{ textDecoration: "none", textAlign: "center" }}
                >
                  Download ({remainingDownloads} of {maxDownloads})
                </Link>
              ) : (
                <button
                  disabled
                  style={{
                    padding: "12px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: "var(--surface-active)",
                    color: "var(--foreground)",
                    cursor: "not-allowed",
                    fontSize: 13,
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    opacity: 0.6,
                  }}
                >
                  Download Limit Reached
                </button>
              )
            ) : isFile && data.share.downloadPriceApt && data.share.downloadPriceApt > 0 ? (
              <>
                {/* Paid download */}
                <div
                  style={{
                    background: "var(--gold-bg)",
                    border: "1px solid var(--gold-border)",
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

                <button
                  onClick={async () => {
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
                      setAlreadyPurchased(true);

                      // Trigger download with the download ID
                      const downloadUrl = `/api/files/${data.file.id}/download?token=${token}&downloadId=${result.downloadId}${walletAddress ? `&wallet=${encodeURIComponent(walletAddress)}` : ""}${password ? `&password=${encodeURIComponent(password)}` : ""}`;
                      window.location.href = downloadUrl;
                    } catch (err) {
                      setPurchaseError_state(err instanceof Error ? err.message : "Payment failed");
                    }
                  }}
                  disabled={isPurchasing || purchasedDownloadId !== null}
                  style={{
                    padding: "12px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: purchasedDownloadId ? "var(--surface-active)" : "var(--accent-red)",
                    color: "var(--foreground)",
                    cursor: purchasedDownloadId || isPurchasing ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    opacity: purchasedDownloadId || isPurchasing ? 0.6 : 1,
                  }}
                >
                  {purchasedDownloadId ? "Already Downloaded" : isPurchasing ? "Processing Payment..." : `Pay ${data.share.downloadPriceApt} APT to Download`}
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
                  background: "var(--error-subtle)",
                  border: "1px solid var(--error-border)",
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 12,
                  color: "var(--error)",
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
