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
    return <div className="rounded-[2rem] bg-white/80 p-8">Loading file...</div>;
  }

  if (!query.data?.file) {
    return (
      <div className="rounded-[2rem] bg-white/80 p-8 text-slate-600">
        File not found.
      </div>
    );
  }

  const file = query.data.file;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6 rounded-[2rem] bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            File detail
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-950">
            {file.filename}
          </h1>
          <p className="mt-3 text-slate-500">
            {file.description ?? "No description yet."}
          </p>
        </div>
        <FilePreview
          fileId={file.id}
          originalName={file.originalName}
          previewType={file.previewType}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Folder</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {file.folder?.name ?? "Root"}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Size</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {formatBytes(file.size)}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Updated</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {formatDate(file.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      <aside className="space-y-6 rounded-[2rem] bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Active shares
          </p>
          <div className="mt-4 space-y-3">
            {file.shares.map((share) => (
              <Link
                key={share.id}
                className="block rounded-3xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-900"
                href={`/share/${share.token}`}
              >
                {share.shareType.toLowerCase()} link
              </Link>
            ))}
            {file.shares.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                No shares have been created for this file yet.
              </div>
            ) : null}
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Recent activity
          </p>
          <div className="mt-4 space-y-3">
            {file.views.map((view) => (
              <div key={view.id} className="rounded-3xl bg-slate-50 px-4 py-4">
                <p className="text-sm font-medium text-slate-900">
                  {view.eventType.toLowerCase()}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(view.viewedAt)}
                </p>
              </div>
            ))}
            {file.views.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Analytics will appear after preview and download events.
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
