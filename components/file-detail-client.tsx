"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { FilePreview } from "@/components/file-preview";
import { useWorkspaceWallet } from "@/components/wallet-status";
import { apiFetch } from "@/lib/client/api";
import type { FileRecord } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";

type FileDetailClientProps = {
  fileId: string;
};

export function FileDetailClient({ fileId }: FileDetailClientProps) {
  const { walletAddress } = useWorkspaceWallet();
  const query = useQuery({
    queryKey: ["file", fileId, walletAddress],
    queryFn: () =>
      apiFetch<{ file: FileRecord }>(`/api/files/${fileId}`, {}, walletAddress),
  });

  if (query.isLoading) {
    return <div className="rounded-[2rem] bg-[#111] p-8 text-[rgba(240,237,230,0.55)]">Loading file...</div>;
  }

  if (!query.data?.file) {
    return (
      <div className="rounded-[2rem] bg-[#111] p-8 text-[rgba(240,237,230,0.55)]">
        File not found.
      </div>
    );
  }

  const file = query.data.file;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6 rounded-[2rem] bg-[#111] p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[rgba(240,237,230,0.35)]">
            File detail
          </p>
          <h1 className="mt-4 text-4xl font-semibold font-[family-name:var(--font-bebas-neue)] tracking-[0.06em] text-[#f0ede6]">
            {file.filename}
          </h1>
          <p className="mt-3 text-[rgba(240,237,230,0.35)]">
            {file.description ?? "No description yet."}
          </p>
        </div>
        <FilePreview
          fileId={file.id}
          originalName={file.originalName}
          previewType={file.previewType}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-sm text-[rgba(240,237,230,0.35)]">Folder</p>
            <p className="mt-2 text-lg font-semibold text-[#f0ede6]">
              {file.folder?.name ?? "Root"}
            </p>
          </div>
          <div className="rounded-3xl bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-sm text-[rgba(240,237,230,0.35)]">Size</p>
            <p className="mt-2 text-lg font-semibold text-[#f0ede6]">
              {formatBytes(file.size)}
            </p>
          </div>
          <div className="rounded-3xl bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-sm text-[rgba(240,237,230,0.35)]">Updated</p>
            <p className="mt-2 text-lg font-semibold text-[#f0ede6]">
              {formatDate(file.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      <aside className="space-y-6 rounded-[2rem] bg-[#111] p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[rgba(240,237,230,0.35)]">
            Active shares
          </p>
          <div className="mt-4 space-y-3">
            {file.shares.map((share) => (
              <Link
                key={share.id}
                className="block rounded-3xl bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm font-medium text-[#f0ede6]"
                href={`/share/${share.token}`}
              >
                {share.shareType.toLowerCase()} link
              </Link>
            ))}
            {file.shares.length === 0 ? (
              <div className="rounded-3xl bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm text-[rgba(240,237,230,0.35)]">
                No shares have been created for this file yet.
              </div>
            ) : null}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[rgba(240,237,230,0.35)]">
            Recent activity
          </p>
          <div className="mt-4 space-y-3">
            {file.views.map((view) => (
              <div key={view.id} className="rounded-3xl bg-[rgba(255,255,255,0.03)] px-4 py-4">
                <p className="text-sm font-medium text-[#f0ede6]">
                  {view.eventType.toLowerCase()}
                </p>
                <p className="mt-1 text-sm text-[rgba(240,237,230,0.35)]">
                  {formatDate(view.viewedAt)}
                </p>
              </div>
            ))}
            {file.views.length === 0 ? (
              <div className="rounded-3xl bg-[rgba(255,255,255,0.03)] px-4 py-4 text-sm text-[rgba(240,237,230,0.35)]">
                Analytics will appear after preview and download events.
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
