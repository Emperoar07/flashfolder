"use client";

import {
  Copy,
  Download,
  KeyRound,
  Link2,
  Lock,
  Shield,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { FilePreview } from "@/components/file-preview";
import { UploadDropzone } from "@/components/upload-dropzone";
import { useWorkspaceWallet } from "@/components/wallet-status";
import {
  useCreateVaultShare,
  useUploadVaultFile,
  useVaultAsset,
  useVerifyVaultOwnership,
} from "@/lib/client/hooks";
import {
  SHARE_TYPES,
  VAULT_FILE_ROLES,
  VAULT_PREVIEW_MODES,
} from "@/lib/file-kinds";
import { cn, formatBytes, formatDate } from "@/lib/utils";

type VaultAssetClientProps = {
  vaultAssetId: string;
};

function prettyRole(role: string) {
  return role.toLowerCase().replaceAll("_", " ");
}

export function VaultAssetClient({ vaultAssetId }: VaultAssetClientProps) {
  const { walletAddress } = useWorkspaceWallet();
  const vaultAssetQuery = useVaultAsset(walletAddress, vaultAssetId);
  const verifyOwnership = useVerifyVaultOwnership(walletAddress, vaultAssetId);
  const uploadVaultFile = useUploadVaultFile(walletAddress, vaultAssetId);
  const createVaultShare = useCreateVaultShare(walletAddress, vaultAssetId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [role, setRole] = useState<"PRIMARY_MEDIA" | "UNLOCKABLE" | "ATTACHMENT" | "TEASER">(
    "PRIMARY_MEDIA",
  );
  const [encrypt, setEncrypt] = useState(true);
  const [shareType, setShareType] = useState<"PUBLIC" | "PRIVATE" | "PASSWORD">(
    "PRIVATE",
  );
  const [sharePassword, setSharePassword] = useState("");
  const [previewRole, setPreviewRole] = useState("TEASER");
  const [securePreviewSrc, setSecurePreviewSrc] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const vaultAsset = vaultAssetQuery.data?.vaultAsset;
  const previewFile = useMemo(() => {
    if (!vaultAsset) {
      return null;
    }

    return (
      vaultAsset.vaultFiles.find((entry) => entry.role === previewRole) ??
      vaultAsset.vaultFiles.find((entry) => entry.role === VAULT_FILE_ROLES.TEASER) ??
      vaultAsset.vaultFiles[0] ??
      null
    );
  }, [previewRole, vaultAsset]);

  useEffect(() => {
    return () => {
      if (securePreviewSrc) {
        URL.revokeObjectURL(securePreviewSrc);
      }
    };
  }, [securePreviewSrc]);

  async function loadProtectedContent(targetRole: string, download = false) {
    if (!vaultAsset) {
      return;
    }

    setIsLoadingPreview(true);

    try {
      const response = await fetch(
        `/api/vault/assets/${vaultAsset.id}/content?role=${targetRole}${download ? "&download=1" : "&inline=1"}`,
        {
          headers: {
            "x-wallet-address": walletAddress,
          },
        },
      );

      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? ((await response.json()) as { error?: string })
        : null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to load protected content.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      if (download) {
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = previewFile?.file.originalName ?? "vault-content";
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      } else {
        setSecurePreviewSrc((current) => {
          if (current) {
            URL.revokeObjectURL(current);
          }
          return objectUrl;
        });
        setPreviewRole(targetRole);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingPreview(false);
    }
  }

  if (vaultAssetQuery.isLoading) {
    return <div className="rounded-[20px] bg-[var(--card)] p-8 text-[var(--foreground)]">Loading vault asset...</div>;
  }

  if (!vaultAsset) {
    return (
      <div className="rounded-[20px] bg-[var(--card)] p-8 text-[var(--text-secondary)]">
        Vault asset not found.
      </div>
    );
  }

  const teaserFile =
    vaultAsset.vaultFiles.find((entry) => entry.role === VAULT_FILE_ROLES.TEASER) ??
    null;
  const hasProtectedPreview =
    vaultAsset.vaultFiles.some((entry) => entry.role === VAULT_FILE_ROLES.PRIMARY_MEDIA) ||
    vaultAsset.vaultFiles.some((entry) => entry.role === VAULT_FILE_ROLES.UNLOCKABLE);
  const previewSrc =
    securePreviewSrc ??
    (previewFile?.role === VAULT_FILE_ROLES.TEASER
      ? `/api/vault/assets/${vaultAsset.id}/content?role=${previewFile.role}&inline=1`
      : undefined);

  return (
    <div className="space-y-8">
      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-8 text-[var(--foreground)]" style={{ background: 'linear-gradient(135deg, var(--card) 0%, var(--bg-elevated) 60%, var(--accent-red-subtle) 100%)' }}>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
            FlashVault asset
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-bebas-neue)] tracking-[0.06em] text-4xl font-semibold sm:text-5xl">
            {vaultAsset.nftName ?? vaultAsset.nftObjectId}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
            Private vault for Aptos NFT content with verified owner access,
            collector sharing, and optional encrypted uploads.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-1.5">
              {vaultAsset.collectionName ?? "Unassigned collection"}
            </span>
            <span className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-1.5">
              {vaultAsset.ownerOnly ? "Owner only access" : "Shared access enabled"}
            </span>
            <span className="rounded-md border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-1.5">
              {vaultAsset.publicPreviewMode.toLowerCase()} preview mode
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  Protected media
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-bebas-neue)] tracking-[0.06em] text-2xl font-semibold text-[var(--foreground)]">
                  Preview vault content
                </h2>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-red)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                disabled={verifyOwnership.isPending}
                onClick={() => verifyOwnership.mutate()}
                type="button"
              >
                <ShieldCheck className="h-4 w-4" />
                {verifyOwnership.isPending ? "Checking..." : "Verify ownership"}
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Vault the content, not the chain record.
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Ownership and transfer state remain public on Aptos. FlashVault only
                protects private media access, unlockables, and who can fetch the
                offchain content.
              </p>
            </div>

            <div className="mt-6">
              {previewFile && previewSrc ? (
                <FilePreview
                  originalName={previewFile.file.originalName}
                  previewType={previewFile.file.previewType}
                  src={previewSrc}
                />
              ) : (
                <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-[var(--border-hover)] bg-[var(--surface-subtle)] p-8 text-center text-sm text-[var(--text-secondary)]">
                  Add a teaser file or load protected media after ownership
                  verification to preview this vault asset.
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {vaultAsset.vaultFiles.map((entry) => (
                <button
                  key={entry.id}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-semibold",
                    previewRole === entry.role
                      ? "bg-[var(--accent-red)] text-[var(--foreground)]"
                      : "bg-[var(--surface-subtle-hover)] text-[var(--text-secondary)]",
                  )}
                  onClick={() =>
                    entry.role === VAULT_FILE_ROLES.TEASER
                      ? setPreviewRole(entry.role)
                      : void loadProtectedContent(entry.role)
                  }
                  type="button"
                >
                  {prettyRole(entry.role)}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {vaultAsset.vaultFiles.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-[var(--border)] bg-[var(--card-hover)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {entry.file.filename}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        {prettyRole(entry.role)}
                      </p>
                    </div>
                    <span className="rounded-md bg-[var(--surface-subtle-hover)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                      {entry.file.isEncrypted ? "Encrypted" : "Plain"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="rounded-md bg-[var(--surface-subtle-hover)] px-2.5 py-1.5">
                      {formatBytes(entry.file.size)}
                    </span>
                    <span className="rounded-md bg-[var(--surface-subtle-hover)] px-2.5 py-1.5">
                      {entry.file.mimeType}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-3">
                    {entry.role === VAULT_FILE_ROLES.TEASER ? (
                      <button
                        className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-red)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                        onClick={() => setPreviewRole(entry.role)}
                        type="button"
                      >
                        Preview teaser
                      </button>
                    ) : (
                      <>
                        <button
                          className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-red)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
                          disabled={isLoadingPreview}
                          onClick={() => loadProtectedContent(entry.role)}
                          type="button"
                        >
                          <Shield className="h-4 w-4" />
                          {isLoadingPreview ? "Loading..." : "Load protected"}
                        </button>
                        <button
                          className="inline-flex items-center gap-2 rounded-md bg-[var(--surface-subtle-hover)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]"
                          disabled={isLoadingPreview}
                          onClick={() => loadProtectedContent(entry.role, true)}
                          type="button"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-red)] text-[var(--foreground)]">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
                    Upload content
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-bebas-neue)] tracking-[0.06em] text-2xl font-semibold text-[var(--foreground)]">
                    Add media or unlockables
                  </h2>
                </div>
              </div>

              <div className="mt-5">
                <UploadDropzone
                  onSelectFile={setSelectedFile}
                  selectedFile={selectedFile}
                />
              </div>

              <div className="mt-4 grid gap-4">
                <select
                  className="rounded-md border border-[var(--border)] bg-[var(--card-hover)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                  onChange={(event) => setRole(event.target.value as typeof role)}
                  value={role}
                >
                  {Object.values(VAULT_FILE_ROLES).map((entryRole) => (
                    <option key={entryRole} value={entryRole}>
                      {prettyRole(entryRole)}
                    </option>
                  ))}
                </select>
                <textarea
                  className="h-28 rounded-xl border border-[var(--border)] bg-[var(--card-hover)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe what collectors unlock here."
                  value={description}
                />
                <label className="flex items-center gap-3 rounded-md bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  <input
                    checked={encrypt}
                    className="h-4 w-4"
                    onChange={(event) => setEncrypt(event.target.checked)}
                    type="checkbox"
                  />
                  Encrypt before upload for owner-only media.
                </label>
                <button
                  className="rounded-md bg-[var(--accent-red)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
                  disabled={!selectedFile || uploadVaultFile.isPending}
                  onClick={() =>
                    selectedFile &&
                    uploadVaultFile.mutate(
                      {
                        file: selectedFile,
                        role,
                        description,
                        encrypt,
                      },
                      {
                        onSuccess: () => {
                          setSelectedFile(null);
                          setDescription("");
                        },
                      },
                    )
                  }
                  type="button"
                >
                  {uploadVaultFile.isPending ? "Uploading..." : "Upload vault content"}
                </button>
              </div>
            </div>

            <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
                Access settings
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-bebas-neue)] tracking-[0.06em] text-2xl font-semibold text-[var(--foreground)]">
                Share with collectors
              </h2>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {(["PUBLIC", "PRIVATE", "PASSWORD"] as const).map((type) => (
                  <button
                    key={type}
                    className={cn(
                      "rounded-md px-3 py-2.5 text-xs font-semibold",
                      shareType === type
                        ? "bg-[var(--accent-red)] text-[var(--foreground)]"
                        : "bg-[var(--surface-subtle-hover)] text-[var(--text-secondary)]",
                    )}
                    onClick={() => setShareType(type)}
                    type="button"
                  >
                    {type.toLowerCase()}
                  </button>
                ))}
              </div>

              {shareType === SHARE_TYPES.PASSWORD ? (
                <input
                  className="mt-4 w-full rounded-md border border-[var(--border)] bg-[var(--card-hover)] px-4 py-3 text-sm text-[var(--foreground)] outline-none"
                  onChange={(event) => setSharePassword(event.target.value)}
                  placeholder="Collector password"
                  value={sharePassword}
                />
              ) : null}

              <button
                className="mt-4 w-full rounded-md bg-[var(--accent-red)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
                onClick={() =>
                  createVaultShare.mutate({
                    shareType,
                    password: shareType === SHARE_TYPES.PASSWORD ? sharePassword : undefined,
                  })
                }
                type="button"
              >
                Create vault share
              </button>

              <div className="mt-5 space-y-3">
                {vaultAsset.shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3"
                  >
                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      {share.shareType === SHARE_TYPES.PASSWORD ? (
                        <KeyRound className="h-4 w-4" />
                      ) : share.shareType === SHARE_TYPES.PRIVATE ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Link2 className="h-4 w-4" />
                      )}
                      <Link className="font-semibold text-[var(--foreground)]" href={`/share/${share.token}`}>
                        {share.shareType.toLowerCase()} link
                      </Link>
                    </div>
                    <button
                      className="rounded-md bg-[var(--card-hover)] p-2 text-[var(--text-secondary)]"
                      onClick={() =>
                        void navigator.clipboard.writeText(
                          `${window.location.origin}/share/${share.token}`,
                        )
                      }
                      type="button"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {vaultAsset.shares.length === 0 ? (
                  <div className="rounded-xl bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                    No collector links yet. Create a share when you want to expose
                    teaser or gated media outside your wallet session.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
              Ownership status
            </p>
            <div className="mt-4 rounded-xl bg-[var(--surface-subtle)] p-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {verifyOwnership.data?.isOwner
                  ? "Ownership verified for the connected wallet."
                  : "Run a fresh ownership check before loading owner-only media."}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {verifyOwnership.data?.isOwner
                  ? "Protected previews and downloads are now being requested through verified backend routes."
                  : "This is especially important if the NFT may have been transferred since the vault was created."}
              </p>
            </div>

            <div className="mt-4 grid gap-2">
              <div className="rounded-md bg-[var(--surface-subtle)] p-4">
                <p className="text-xs text-[var(--text-muted)]" style={{ textTransform: 'uppercase', letterSpacing: '0.2em' }}>Public preview mode</p>
                <p className="mt-1 text-lg font-semibold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', letterSpacing: '0.05em' }}>
                  {vaultAsset.publicPreviewMode === VAULT_PREVIEW_MODES.PLACEHOLDER
                    ? "Placeholder"
                    : vaultAsset.publicPreviewMode.toLowerCase()}
                </p>
              </div>
              <div className="rounded-md bg-[var(--surface-subtle)] p-4">
                <p className="text-xs text-[var(--text-muted)]" style={{ textTransform: 'uppercase', letterSpacing: '0.2em' }}>Protected files</p>
                <p className="mt-1 text-lg font-semibold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', letterSpacing: '0.05em' }}>
                  {vaultAsset.vaultFiles.length}
                </p>
              </div>
              <div className="rounded-md bg-[var(--surface-subtle)] p-4">
                <p className="text-xs text-[var(--text-muted)]" style={{ textTransform: 'uppercase', letterSpacing: '0.2em' }}>Has teaser content</p>
                <p className="mt-1 text-lg font-semibold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', letterSpacing: '0.05em' }}>
                  {teaserFile ? "Yes" : "Not yet"}
                </p>
              </div>
              <div className="rounded-md bg-[var(--surface-subtle)] p-4">
                <p className="text-xs text-[var(--text-muted)]" style={{ textTransform: 'uppercase', letterSpacing: '0.2em' }}>Has protected preview</p>
                <p className="mt-1 text-lg font-semibold text-[var(--foreground)]" style={{ fontFamily: 'var(--font-bebas-neue), sans-serif', letterSpacing: '0.05em' }}>
                  {hasProtectedPreview ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-muted)]">
              Access logs
            </p>
            <div className="mt-4 space-y-2">
              {vaultAsset.accessLogs.map((log) => (
                <div key={log.id} className="rounded-md bg-[var(--surface-subtle)] p-4">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {log.accessType.replaceAll("_", " ").toLowerCase()}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{formatDate(log.createdAt)}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {log.accessorWallet ?? "Anonymous or share route"}
                  </p>
                </div>
              ))}

              {vaultAsset.accessLogs.length === 0 ? (
                <div className="rounded-md bg-[var(--surface-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                  Vault access logs appear after verification checks, shared views,
                  or protected downloads.
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
