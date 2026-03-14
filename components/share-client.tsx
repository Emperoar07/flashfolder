"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { FilePreview } from "@/components/file-preview";
import { apiFetch } from "@/lib/client/api";
import { VAULT_FILE_ROLES } from "@/lib/file-kinds";
import type { SharedResourcePayload } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";

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
    return <div className="rounded-[2rem] bg-white/80 p-8">Loading share...</div>;
  }

  if (query.error) {
    return (
      <div className="rounded-[2rem] bg-white/80 p-8 text-slate-600">
        This share is unavailable.
      </div>
    );
  }

  const data = query.data;
  const vaultPreviewFile =
    data?.resourceType === "vault"
      ? data.vaultAsset.vaultFiles.find((entry) => entry.role === VAULT_FILE_ROLES.TEASER) ??
        data.vaultAsset.vaultFiles.find((entry) => entry.role === VAULT_FILE_ROLES.PRIMARY_MEDIA) ??
        data.vaultAsset.vaultFiles[0]
      : null;

  if (!data) {
    return (
      <div className="rounded-[2rem] bg-white/80 p-8 text-slate-600">
        Share data is unavailable.
      </div>
    );
  }

  if (data.locked) {
    return (
      <div className="rounded-[2rem] bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-center text-3xl font-semibold text-slate-950">
          Password required
        </h1>
        <p className="mt-3 text-center text-slate-500">
          Enter the share password to open this shared resource.
        </p>
        <input
          className="mt-6 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Share password"
          value={password}
        />
      </div>
    );
  }

  if (data.expired) {
    return (
      <div className="rounded-[2rem] bg-white/80 p-8 text-slate-600 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        This share expired. Ask the owner to issue a fresh link.
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-[2rem] bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
          Shared from FlashFolder
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
          {data.resourceType === "file"
            ? data.file.filename
            : data.vaultAsset.nftName ?? "FlashVault asset"}
        </h1>
        <p className="mt-3 text-slate-500">
          {data.resourceType === "file" ? (
            <>
              By {data.file.user.username ?? "FlashFolder user"} on{" "}
              {formatDate(data.file.createdAt)}
            </>
          ) : (
            <>
              Private vault for Aptos NFT content by{" "}
              {data.vaultAsset.user.username ?? "FlashFolder user"}.
            </>
          )}
        </p>
      </div>
      {data.resourceType === "file" ? (
        <>
          <FilePreview
            fileId={data.file.id}
            originalName={data.file.originalName}
            password={password}
            previewType={data.file.previewType}
            token={token}
          />
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-2">
              {formatBytes(data.file.size)}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-2">
              {data.file.mimeType}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-2">
              {data.share.shareType.toLowerCase()} link
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-950">
              Vault the content, not the chain record.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              This shared view can expose teaser or gated collector media without
              pretending the NFT is hidden onchain.
            </p>
          </div>
          {data.vaultAsset.vaultFiles.length > 0 ? (
            <FilePreview
              originalName={vaultPreviewFile?.file.originalName ?? "vault-content"}
              password={password}
              previewType={vaultPreviewFile?.file.previewType ?? "OTHER"}
              src={`/api/vault/assets/${data.vaultAsset.id}/content?token=${token}&role=${vaultPreviewFile?.role ?? VAULT_FILE_ROLES.PRIMARY_MEDIA}${password ? `&password=${encodeURIComponent(password)}` : ""}&inline=1`}
            />
          ) : (
            <div className="rounded-3xl bg-slate-100 p-8 text-sm text-slate-600">
              No preview file is configured for this vault asset yet.
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-2">
              {data.vaultAsset.collectionName ?? "Vault asset"}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-2">
              {data.share.shareType.toLowerCase()} access
            </span>
          </div>
        </>
      )}
      <div className="flex flex-wrap gap-3">
        <Link
          className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          href={
            data.resourceType === "file"
              ? `/api/files/${data.file.id}/download?token=${token}${password ? `&password=${encodeURIComponent(password)}` : ""}`
              : `/api/vault/assets/${data.vaultAsset.id}/content?token=${token}&download=1${password ? `&password=${encodeURIComponent(password)}` : ""}`
          }
        >
          {data.resourceType === "file" ? "Download file" : "Open vault content"}
        </Link>
        <Link
          className="rounded-full bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700"
          href="/"
        >
          Visit FlashFolder
        </Link>
      </div>
    </div>
  );
}
