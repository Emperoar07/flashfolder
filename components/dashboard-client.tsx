"use client";

import { PreviewType, ShareType } from "@prisma/client";
import {
  AudioLines,
  CirclePlay,
  Copy,
  FileArchive,
  FileText,
  FolderOpen,
  ImageIcon,
  KeyRound,
  Link2,
  Lock,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { FilePreview } from "@/components/file-preview";
import { UploadDropzone } from "@/components/upload-dropzone";
import { WalletStatus, useWorkspaceWallet } from "@/components/wallet-status";
import { apiFetch } from "@/lib/client/api";
import type { FileRecord, FolderRecord, ShareRecord } from "@/lib/types";
import { formatBytes, formatDate, shortenWallet } from "@/lib/utils";

type DashboardClientProps = {
  initialFolderId?: string;
};

function previewIcon(type: PreviewType) {
  switch (type) {
    case PreviewType.IMAGE:
      return <ImageIcon className="h-4 w-4" />;
    case PreviewType.VIDEO:
      return <CirclePlay className="h-4 w-4" />;
    case PreviewType.AUDIO:
      return <AudioLines className="h-4 w-4" />;
    case PreviewType.TEXT:
    case PreviewType.PDF:
      return <FileText className="h-4 w-4" />;
    default:
      return <FileArchive className="h-4 w-4" />;
  }
}

export function DashboardClient({ initialFolderId }: DashboardClientProps) {
  const { walletAddress } = useWorkspaceWallet();
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();
  const [folderName, setFolderName] = useState("");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(
    initialFolderId ?? null,
  );
  const [search, setSearch] = useState("");
  const [description, setDescription] = useState("");
  const [shareType, setShareType] = useState<
    "PUBLIC" | "PRIVATE" | "PASSWORD"
  >("PUBLIC");
  const [sharePassword, setSharePassword] = useState("");
  const [selectedUpload, setSelectedUpload] = useState<File | null>(null);
  const deferredSearch = useDeferredValue(search);

  const foldersQuery = useQuery({
    queryKey: ["folders", walletAddress],
    queryFn: () =>
      apiFetch<{ folders: FolderRecord[] }>("/api/folders", {}, walletAddress),
  });

  const filesQuery = useQuery({
    queryKey: ["files", walletAddress, activeFolderId],
    queryFn: () =>
      apiFetch<{ files: FileRecord[] }>(
        `/api/files${activeFolderId ? `?folderId=${activeFolderId}` : ""}`,
        {},
        walletAddress,
      ),
  });

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ settings: { storageMode: string } }>("/api/settings"),
  });

  const createFolderMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ folder: FolderRecord }>(
        "/api/folders",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: folderName || "New Folder" }),
        },
        walletAddress,
      ),
    onSuccess: () => {
      setFolderName("");
      void queryClient.invalidateQueries({ queryKey: ["folders", walletAddress] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUpload) {
        throw new Error("Pick a file first.");
      }

      const formData = new FormData();
      formData.set("file", selectedUpload);
      formData.set("description", description);
      if (activeFolderId) {
        formData.set("folderId", activeFolderId);
      }

      return apiFetch<{ file: FileRecord }>(
        "/api/files/upload",
        {
          method: "POST",
          body: formData,
        },
        walletAddress,
      );
    },
    onSuccess: () => {
      setSelectedUpload(null);
      setDescription("");
      void queryClient.invalidateQueries({ queryKey: ["files", walletAddress] });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) =>
      apiFetch<{ success: boolean }>(
        `/api/files/${fileId}`,
        { method: "DELETE" },
        walletAddress,
      ),
    onSuccess: () => {
      setSelectedFileId(null);
      void queryClient.invalidateQueries({ queryKey: ["files", walletAddress] });
    },
  });

  const createShareMutation = useMutation({
    mutationFn: (fileId: string) =>
      apiFetch<{ share: ShareRecord }>(
        `/api/files/${fileId}/share`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shareType,
            password: shareType === "PASSWORD" ? sharePassword : undefined,
          }),
        },
        walletAddress,
      ),
    onSuccess: () => {
      setSharePassword("");
      void queryClient.invalidateQueries({ queryKey: ["files", walletAddress] });
    },
  });

  const folders = foldersQuery.data?.folders ?? [];
  const files = useMemo(() => filesQuery.data?.files ?? [], [filesQuery.data?.files]);

  const filteredFiles = useMemo(() => {
    const lowered = deferredSearch.toLowerCase();
    return files.filter((file) =>
      lowered
        ? file.filename.toLowerCase().includes(lowered) ||
          file.description?.toLowerCase().includes(lowered)
        : true,
    );
  }, [deferredSearch, files]);

  const selectedFile =
    filteredFiles.find((file) => file.id === selectedFileId) ??
    filteredFiles[0] ??
    null;

  const metrics = useMemo(() => {
    const totalStorage = files.reduce((sum, file) => sum + file.size, 0);
    const totalShares = files.reduce((sum, file) => sum + file.shares.length, 0);
    return {
      totalStorage,
      totalShares,
      totalViews: files.reduce((sum, file) => sum + file.views.length, 0),
    };
  }, [files]);

  return (
    <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
      <aside className="space-y-6 rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Workspace
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            {shortenWallet(walletAddress)}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Hot-storage UX on top of a Shelby-ready adapter.
          </p>
        </div>

        <div className="rounded-3xl bg-slate-950 p-5 text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Storage
          </p>
          <p className="mt-3 text-3xl font-semibold">
            {settingsQuery.data?.settings.storageMode ?? "local"}
          </p>
          <p className="mt-2 text-sm text-white/70">
            Local mock mode is active until Shelby credentials are approved.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Folders
            </h3>
            <FolderOpen className="h-4 w-4 text-slate-400" />
          </div>
          <button
            className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium ${
              activeFolderId === null
                ? "bg-slate-950 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
            onClick={() => startTransition(() => setActiveFolderId(null))}
            type="button"
          >
            All files
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium ${
                activeFolderId === folder.id
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
              onClick={() => startTransition(() => setActiveFolderId(folder.id))}
              type="button"
            >
              {folder.name}
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <label className="text-xs uppercase tracking-[0.25em] text-slate-500">
            New folder
          </label>
          <input
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            onChange={(event) => setFolderName(event.target.value)}
            placeholder="Campaign Assets"
            value={folderName}
          />
          <button
            className="mt-3 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white"
            disabled={createFolderMutation.isPending}
            onClick={() => createFolderMutation.mutate()}
            type="button"
          >
            Create folder
          </button>
        </div>
      </aside>

      <section className="space-y-6">
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,#0f172a_0%,#111827_45%,#0ea5e9_120%)] p-8 text-white shadow-[0_40px_120px_rgba(15,23,42,0.25)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">
                FlashFolder
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                A decentralized file workspace for the files you actually open.
              </h1>
              <p className="mt-4 max-w-xl text-base text-white/72">
                Upload once, preview instantly, and keep Shelby isolated behind a
                storage adapter until real network credentials arrive.
              </p>
            </div>
            <WalletStatus />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Files</p>
              <p className="mt-2 text-3xl font-semibold">{files.length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Storage</p>
              <p className="mt-2 text-3xl font-semibold">
                {formatBytes(metrics.totalStorage)}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Shares</p>
              <p className="mt-2 text-3xl font-semibold">{metrics.totalShares}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm outline-none"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search files or descriptions"
                value={search}
              />
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-sm text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">File</th>
                    <th className="px-4 py-3 font-medium">Folder</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    <th className="px-4 py-3 font-medium">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-sm">
                  {filteredFiles.map((file) => (
                    <tr
                      key={file.id}
                      className="cursor-pointer transition hover:bg-slate-50"
                      onClick={() => setSelectedFileId(file.id)}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="rounded-xl bg-slate-100 p-2 text-slate-700">
                            {previewIcon(file.previewType)}
                          </span>
                          <div>
                            <p className="font-medium text-slate-950">{file.filename}</p>
                            <p className="text-slate-500">
                              {file.description ?? "No description"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {file.folder?.name ?? "Root"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {formatDate(file.updatedAt)}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {formatBytes(file.size)}
                      </td>
                    </tr>
                  ))}
                  {filteredFiles.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-slate-500" colSpan={4}>
                        No files yet. Upload a sample asset to make the workspace feel real.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
              Upload
            </p>
            <div className="mt-4">
              <UploadDropzone
                onSelectFile={setSelectedUpload}
                selectedFile={selectedUpload}
              />
            </div>
            <textarea
              className="mt-4 h-28 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add a quick note for the file detail page"
              value={description}
            />
            <button
              className="mt-4 w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white"
              disabled={uploadMutation.isPending}
              onClick={() => uploadMutation.mutate()}
              type="button"
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload to workspace"}
            </button>
          </div>
        </div>
      </section>

      <aside className="space-y-6 rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        {selectedFile ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  File detail
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                  {selectedFile.filename}
                </h2>
              </div>
              <button
                className="rounded-2xl bg-slate-100 p-3 text-slate-600 transition hover:bg-slate-200"
                onClick={() => deleteFileMutation.mutate(selectedFile.id)}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <FilePreview
              fileId={selectedFile.id}
              originalName={selectedFile.originalName}
              previewType={selectedFile.previewType}
            />

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Size
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {formatBytes(selectedFile.size)}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Views
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {selectedFile.views.length}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Shares
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {selectedFile.shares.length}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Share
                </p>
                <Link
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-700"
                  href={`/files/${selectedFile.id}`}
                >
                  <Settings2 className="h-4 w-4" />
                  Full page
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {(["PUBLIC", "PRIVATE", "PASSWORD"] as const).map((type) => (
                  <button
                    key={type}
                    className={`rounded-2xl px-3 py-3 text-xs font-semibold ${
                      shareType === type
                        ? "bg-slate-950 text-white"
                        : "bg-white text-slate-700"
                    }`}
                    onClick={() => setShareType(type)}
                    type="button"
                  >
                    {type.toLowerCase()}
                  </button>
                ))}
              </div>

              {shareType === "PASSWORD" ? (
                <input
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                  onChange={(event) => setSharePassword(event.target.value)}
                  placeholder="Password for the share link"
                  value={sharePassword}
                />
              ) : null}

              <button
                className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                onClick={() => createShareMutation.mutate(selectedFile.id)}
                type="button"
              >
                Create share link
              </button>

              <div className="mt-4 space-y-2">
                {selectedFile.shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {share.shareType === ShareType.PASSWORD ? (
                        <KeyRound className="h-4 w-4 text-slate-500" />
                      ) : share.shareType === ShareType.PRIVATE ? (
                        <Lock className="h-4 w-4 text-slate-500" />
                      ) : (
                        <Link2 className="h-4 w-4 text-slate-500" />
                      )}
                      <Link className="font-medium text-slate-900" href={`/share/${share.token}`}>
                        {share.shareType.toLowerCase()}
                      </Link>
                    </div>
                    <button
                      className="rounded-full bg-slate-100 p-2 text-slate-600"
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
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500">
            Select a file to preview it, create a share link, and inspect analytics.
          </div>
        )}

        <div className="rounded-3xl bg-slate-950 p-6 text-white">
          <p className="text-xs uppercase tracking-[0.25em] text-white/60">
            Next step
          </p>
          <p className="mt-3 text-lg font-semibold">
            Ask Shelby for test tokens once the UI and metadata flow feel right.
          </p>
          <Link
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-300"
            href="/settings"
          >
            Open storage settings
          </Link>
        </div>
      </aside>
    </div>
  );
}
