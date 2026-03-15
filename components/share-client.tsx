"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { FilePreview } from "@/components/file-preview";
import { SocialShareButtons } from "@/components/social-share-buttons";
import { apiFetch } from "@/lib/client/api";
import { VAULT_FILE_ROLES } from "@/lib/file-kinds";
import type { SharedResourcePayload } from "@/lib/types";
import { formatBytes, formatDate, shortenWallet } from "@/lib/utils";

type ShareClientProps = {
  token: string;
};

export function ShareClient({ token }: ShareClientProps) {
  const [password, setPassword] = useState("");
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
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href={
                isFile
                  ? `/api/files/${data.file.id}/download?token=${token}${password ? `&password=${encodeURIComponent(password)}` : ""}`
                  : `/api/vault/assets/${data.vaultAsset.id}/content?token=${token}&download=1${password ? `&password=${encodeURIComponent(password)}` : ""}`
              }
              className="btn-primary"
              style={{ flex: 1, justifyContent: "center", textDecoration: "none" }}
            >
              {isFile ? "Download" : "Open Vault Content"}
            </Link>
            <Link
              href="/"
              className="btn-secondary"
              style={{ textDecoration: "none" }}
            >
              FlashFolder
            </Link>
          </div>
          <div style={{ marginTop: 16 }}>
            <SocialShareButtons
              url={typeof window !== "undefined" ? window.location.href : `/share/${token}`}
              title={`Check out "${fileName}" on FlashFolder`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
