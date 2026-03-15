"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";

import { FilePreview } from "@/components/file-preview";
import { useWorkspaceWallet } from "@/components/wallet-status";
import { WorkspaceDropdown } from "@/components/workspace-dropdown";
import { apiFetch } from "@/lib/client/api";
import { uploadFileChunked } from "@/lib/client/upload-chunked";
import { useWorkspaceTransaction } from "@/lib/client/use-workspace-transaction";
import { useCurrentUser } from "@/lib/client/hooks";
import {
  PREVIEW_TYPES,
  SHARE_TYPES,
  type PreviewTypeValue,
} from "@/lib/file-kinds";
import type { FileRecord, FolderRecord, ShareRecord } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";

/* ── File type categories ── */

type FileCategory = "all" | "images" | "videos" | "music" | "docs";

const FILE_CATEGORIES: { key: FileCategory; label: string }[] = [
  { key: "all", label: "All Files" },
  { key: "images", label: "Pictures" },
  { key: "videos", label: "Videos" },
  { key: "music", label: "Music" },
  { key: "docs", label: "Documents" },
];

function getFileCategory(previewType: PreviewTypeValue): FileCategory {
  switch (previewType) {
    case PREVIEW_TYPES.IMAGE:
      return "images";
    case PREVIEW_TYPES.VIDEO:
      return "videos";
    case PREVIEW_TYPES.AUDIO:
      return "music";
    case PREVIEW_TYPES.PDF:
    case PREVIEW_TYPES.TEXT:
      return "docs";
    default:
      return "all";
  }
}

/* ── Sorting ── */

type SortField = "name" | "size" | "date" | "type";
type SortDir = "asc" | "desc";

/* ── Helpers ── */

function fileIconClass(type: PreviewTypeValue) {
  switch (type) {
    case PREVIEW_TYPES.IMAGE:
      return "img";
    case PREVIEW_TYPES.VIDEO:
      return "vid";
    case PREVIEW_TYPES.AUDIO:
      return "aud";
    case PREVIEW_TYPES.PDF:
    case PREVIEW_TYPES.TEXT:
      return "doc";
    default:
      return "zip";
  }
}

function fileIconEmoji(type: PreviewTypeValue) {
  switch (type) {
    case PREVIEW_TYPES.IMAGE:
      return "\u{1F5BC}";
    case PREVIEW_TYPES.VIDEO:
      return "\u25B6";
    case PREVIEW_TYPES.AUDIO:
      return "\u{1F3B5}";
    case PREVIEW_TYPES.PDF:
    case PREVIEW_TYPES.TEXT:
      return "\u{1F4C4}";
    default:
      return "\u{1F4E6}";
  }
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "GOOD MORNING";
  if (hour < 18) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}

type DashboardClientProps = {
  initialFolderId?: string;
};

export function DashboardClient({ initialFolderId }: DashboardClientProps) {
  const { walletAddress, connected } = useWorkspaceWallet();
  const { submitTransaction } = useWorkspaceTransaction();
  const profileQuery = useCurrentUser(walletAddress);
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();
  const [folderName, setFolderName] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(
    initialFolderId ?? null,
  );
  const [search, setSearch] = useState("");
  const [description, setDescription] = useState("");
  const [shareType] = useState<
    "PUBLIC" | "PRIVATE" | "PASSWORD"
  >("PUBLIC");
  const [sharePassword, setSharePassword] = useState("");
  const [downloadPrice, setDownloadPrice] = useState<number | "">(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<File | null>(null);
  const [movingFileId, setMovingFileId] = useState<string | null>(null);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadPhase, setUploadPhase] = useState<"idle" | "signing" | "uploading" | "done">("idle");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const trimmedSearch = deferredSearch.trim();
  const isWorkspaceSearch = Boolean(trimmedSearch);

  // File category & sorting state
  const [activeCategory, setActiveCategory] = useState<FileCategory>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setSelectedUpload(acceptedFiles[0] ?? null);
    },
    [],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    onDrop,
  });

  const foldersQuery = useQuery({
    queryKey: ["folders", walletAddress],
    queryFn: () =>
      apiFetch<{ folders: FolderRecord[] }>("/api/folders", {}, walletAddress),
    enabled: connected && Boolean(walletAddress),
  });

  const filesQuery = useQuery({
    queryKey: [
      "files",
      walletAddress,
      activeFolderId,
      trimmedSearch,
      sortField,
      sortDir,
      isWorkspaceSearch ? "workspace" : activeFolderId ? "folder" : "workspace",
    ],
    queryFn: () =>
      apiFetch<{ files: FileRecord[] }>((() => {
        const params = new URLSearchParams();

        if (activeFolderId) {
          params.set("folderId", activeFolderId);
        }
        if (trimmedSearch) {
          params.set("search", trimmedSearch);
        }
        params.set("sortField", sortField);
        params.set("sortDir", sortDir);
        params.set(
          "scope",
          isWorkspaceSearch ? "workspace" : activeFolderId ? "folder" : "workspace",
        );

        const query = params.toString();
        return `/api/files${query ? `?${query}` : ""}`;
      })(), {}, walletAddress),
    enabled: connected && Boolean(walletAddress),
  });

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () =>
      apiFetch<{
        settings: {
          requestedStorageMode: string;
          activeStorageMode: string;
          storageState: string;
          storageFallbackReason: string | null;
        };
      }>("/api/settings"),
  });

  /* ── Folder mutations with Aptos transactions ── */

  const createFolderMutation = useMutation({
    mutationFn: async () => {
      const name = folderName || "New Folder";

      // Submit Aptos transaction first
      await submitTransaction("folder_create");

      return apiFetch<{ folder: FolderRecord }>(
        "/api/folders",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        },
        walletAddress,
      );
    },
    onSuccess: () => {
      setFolderName("");
      setShowFolderInput(false);
      void queryClient.invalidateQueries({ queryKey: ["folders", walletAddress] });
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      // Submit Aptos transaction first
      await submitTransaction("folder_rename");

      return apiFetch<{ folder: FolderRecord }>(
        `/api/folders/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        },
        walletAddress,
      );
    },
    onSuccess: () => {
      setRenamingFolderId(null);
      setRenameValue("");
      void queryClient.invalidateQueries({ queryKey: ["folders", walletAddress] });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: string) => {
      // Submit Aptos transaction first
      await submitTransaction("folder_delete");

      return apiFetch<{ success: boolean }>(
        `/api/folders/${id}`,
        { method: "DELETE" },
        walletAddress,
      );
    },
    onSuccess: () => {
      setActiveFolderId(null);
      void queryClient.invalidateQueries({ queryKey: ["folders", walletAddress] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUpload) throw new Error("Pick a file first.");
      if (!connected) throw new Error("Wallet not connected. Please connect your wallet.");
      if (!walletAddress || walletAddress.trim().length === 0) {
        throw new Error("Invalid wallet address. Please reconnect your wallet.");
      }

      // Phase 1: Aptos transaction signing
      setUploadPhase("signing");
      setUploadProgress(0);
      await submitTransaction("file_upload");

      // Phase 2: Chunked upload with real progress tracking
      setUploadPhase("uploading");
      setUploadProgress(0);

      return uploadFileChunked({
        file: selectedUpload,
        folderId: activeFolderId,
        description: description || null,
        walletAddress: walletAddress.trim(),
        onProgress: ({ percent }) => setUploadProgress(percent),
      });
    },
    onSuccess: () => {
      setUploadPhase("done");
      setUploadProgress(100);
      setTimeout(() => {
        setUploadPhase("idle");
        setUploadProgress(0);
        setSelectedUpload(null);
        setDescription("");
      }, 1200);
      void queryClient.invalidateQueries({ queryKey: ["files", walletAddress] });
    },
    onError: () => {
      setUploadPhase("idle");
      setUploadProgress(0);
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      // Submit Aptos transaction first
      await submitTransaction("file_delete");

      return apiFetch<{ success: boolean }>(
        `/api/files/${fileId}`,
        { method: "DELETE" },
        walletAddress,
      );
    },
    onSuccess: () => {
      setSelectedFileId(null);
      void queryClient.invalidateQueries({ queryKey: ["files", walletAddress] });
    },
  });

  const createShareMutation = useMutation({
    mutationFn: async (fileId: string) => {
      // Submit Aptos transaction first
      await submitTransaction("file_share");

      const priceValue = downloadPrice === "" || downloadPrice === 0 ? null : downloadPrice;

      return apiFetch<{ share: ShareRecord }>(
        `/api/files/${fileId}/share`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shareType,
            password: shareType === "PASSWORD" ? sharePassword : undefined,
            downloadPriceApt: priceValue,
            sharerWallet: walletAddress,
          }),
        },
        walletAddress,
      );
    },
    onSuccess: () => {
      setSharePassword("");
      setDownloadPrice(0);
      setShowShareModal(false);
      void queryClient.invalidateQueries({ queryKey: ["files", walletAddress] });
    },
  });

  const moveFileMutation = useMutation({
    mutationFn: async ({ fileId, folderId }: { fileId: string; folderId: string | null }) => {
      // Submit Aptos transaction first
      await submitTransaction("file_move");

      return apiFetch<{ file: FileRecord }>(
        `/api/files/${fileId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId }),
        },
        walletAddress,
      );
    },
    onSuccess: () => {
      setMovingFileId(null);
      setMoveTargetFolderId("");
      void queryClient.invalidateQueries({ queryKey: ["files", walletAddress] });
    },
  });

  const folders = foldersQuery.data?.folders ?? [];
  const files = useMemo(() => filesQuery.data?.files ?? [], [filesQuery.data?.files]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<FileCategory, number> = { all: files.length, images: 0, videos: 0, music: 0, docs: 0 };
    for (const file of files) {
      const cat = getFileCategory(file.previewType);
      if (cat !== "all") counts[cat]++;
    }
    return counts;
  }, [files]);

  // Filter by search + category, then sort
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesCategory =
        activeCategory === "all" || getFileCategory(file.previewType) === activeCategory;
      return matchesCategory;
    });
  }, [files, activeCategory]);

  const selectedFile =
    filteredFiles.find((file) => file.id === selectedFileId) ??
    filteredFiles[0] ??
    null;

  // Keyboard arrow navigation for selected file
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!filteredFiles.length) return;
      const idx = filteredFiles.findIndex((f) => f.id === selectedFileId);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = filteredFiles[(idx + 1) % filteredFiles.length];
        if (next) setSelectedFileId(next.id);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = filteredFiles[(idx - 1 + filteredFiles.length) % filteredFiles.length];
        if (prev) setSelectedFileId(prev.id);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [filteredFiles, selectedFileId]);

  const metrics = useMemo(() => {
    const totalStorage = files.reduce((sum, file) => sum + file.size, 0);
    const totalShares = files.reduce((sum, file) => sum + file.shares.length, 0);
    return {
      totalStorage,
      totalShares,
      totalViews: files.reduce((sum, file) => sum + file.views.length, 0),
    };
  }, [files]);

  const storageMode = settingsQuery.data?.settings.activeStorageMode ?? "local";

  function handleSortClick(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sortIndicator = (field: SortField) =>
    sortField === field ? (sortDir === "asc" ? " \u2191" : " \u2193") : "";

  return (
    <div className="dashboard">
      {/* Overlay for mobile sidebar */}
      {mobileSidebarOpen && (
        <div
          style={{
            display: "none",
            position: "fixed",
            inset: 0,
            zIndex: 38,
            background: "rgba(0, 0, 0, 0.4)",
          }}
          className="mobile-sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`sidebar${mobileSidebarOpen ? " mobile-open" : ""}`}>
        {/* Mobile: Close button */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            display: "none",
            position: "absolute",
            top: 16,
            right: 16,
            background: "transparent",
            border: "none",
            color: "var(--text-secondary)",
            fontSize: 20,
            cursor: "pointer",
            padding: 0,
            width: 24,
            height: 24,
            alignItems: "center",
            justifyContent: "center",
          }}
          className="mobile-sidebar-close"
          title="Close sidebar"
        >
          ✕
        </button>
        <WorkspaceDropdown activePage="files" />
        <div>
          <div className="sidebar-section-label">Folders</div>
          <div className="folder-tree">
            <div
              className="folder-item"
              style={!activeFolderId ? { color: "var(--accent-red)" } : undefined}
              onClick={() => startTransition(() => setActiveFolderId(null))}
            >
              &#x1F4C1; All Files
            </div>
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="folder-item"
                style={activeFolderId === folder.id ? { color: "var(--accent-red)" } : undefined}
              >
                {renamingFolderId === folder.id ? (
                  <form
                    style={{ display: "flex", gap: 4, width: "100%" }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (renameValue.trim()) {
                        renameFolderMutation.mutate({ id: folder.id, name: renameValue.trim() });
                      }
                    }}
                  >
                    <input
                      className="search-input"
                      style={{ flex: 1, padding: "4px 8px", fontSize: 11 }}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      autoFocus
                      disabled={renameFolderMutation.isPending}
                    />
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ padding: "4px 8px", fontSize: 9 }}
                      disabled={renameFolderMutation.isPending}
                    >
                      {renameFolderMutation.isPending ? "Saving..." : "OK"}
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: "4px 8px",
                        fontSize: 9,
                        background: "transparent",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setRenamingFolderId(null);
                        setRenameValue("");
                      }}
                    >
                      X
                    </button>
                  </form>
                ) : (
                  <span
                    onClick={() => startTransition(() => setActiveFolderId(folder.id))}
                    style={{ flex: 1, cursor: "pointer" }}
                  >
                    &#x1F4C2; {folder.name}
                  </span>
                )}
                {renamingFolderId !== folder.id && connected && (
                  <span style={{ display: "flex", gap: 6, marginLeft: 8 }}>
                    <span
                      style={{ cursor: "pointer", fontSize: 11, opacity: 0.5 }}
                      title="Rename"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingFolderId(folder.id);
                        setRenameValue(folder.name);
                      }}
                    >
                      &#x270E;
                    </span>
                    <span
                      style={{ cursor: "pointer", fontSize: 11, opacity: 0.5, color: "var(--accent-red)" }}
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFolderMutation.mutate(folder.id);
                      }}
                    >
                      &#x2715;
                    </span>
                  </span>
                )}
              </div>
            ))}
            {connected ? (
              showFolderInput ? (
                <form
                  className="folder-item"
                  style={{ display: "flex", gap: 4 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    createFolderMutation.mutate();
                  }}
                >
                  <input
                    className="search-input"
                    style={{ flex: 1, padding: "4px 8px", fontSize: 11 }}
                    placeholder="Folder name"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    autoFocus
                    disabled={createFolderMutation.isPending}
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: "4px 8px", fontSize: 9 }}
                    disabled={createFolderMutation.isPending}
                  >
                    {createFolderMutation.isPending ? "Adding..." : "Add"}
                  </button>
                </form>
              ) : (
                <div
                  className="folder-item"
                  style={{ color: "var(--accent-red)", cursor: "pointer" }}
                  onClick={() => setShowFolderInput(true)}
                >
                  + New Folder
                </div>
              )
            ) : (
              <div
                className="folder-item"
                style={{ color: "var(--text-muted)", fontSize: 11, cursor: "default" }}
              >
                Connect wallet to manage folders
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="sidebar-section-label">Storage</div>
          <div className="storage-bar">
            <div
              className="storage-fill"
              style={{
                width: `${Math.min(100, (metrics.totalStorage / (100 * 1024 * 1024)) * 100)}%`,
              }}
            />
          </div>
          <div className="storage-text">
            {formatBytes(metrics.totalStorage)} / 100 MB
          </div>
          <div className="storage-text" style={{ marginTop: 12, color: "var(--accent-gold)" }}>
            Mode: {storageMode}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* Mobile: folder sidebar toggle */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen((o) => !o)}
          style={{
            width: "100%",
            marginBottom: 12,
            padding: "10px 14px",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-secondary)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            cursor: "pointer",
            alignItems: "center",
            gap: 8,
          }}
          className="mobile-sidebar-toggle"
        >
          <span>&#x1F4C1;</span>
          {mobileSidebarOpen ? "Hide Folders" : `Folders${activeFolderId ? ` · ${folders.find((f) => f.id === activeFolderId)?.name ?? ""}` : ""}`}
        </button>
        {/* Wallet-connect gate */}
        {!connected && (
          <div
            style={{
              marginBottom: 20,
              padding: "20px 20px",
              borderRadius: 12,
              border: "1px solid rgba(232,170,48,0.25)",
              background: "rgba(232,170,48,0.05)",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontFamily: "var(--font-bebas-neue)", letterSpacing: "0.1em", marginBottom: 2 }}>
                Wallet Required
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                Connect your Aptos wallet to open your Aptos testnet workspace,
                upload files, create folders, and manage shares.
              </div>
            </div>
          </div>
        )}

        <div className="dash-hero">
          <h2>{getTimeBasedGreeting()}</h2>
          <p>Welcome back to your workspace. Here&apos;s your overview.</p>
          <div className="metrics-row">
            <div className="metric">
              <div className="metric-value">{files.length}</div>
              <div className="metric-label">Files</div>
            </div>
            <div className="metric">
              <div className="metric-value">{formatBytes(metrics.totalStorage)}</div>
              <div className="metric-label">Storage</div>
            </div>
            <div className="metric">
              <div className="metric-value">{metrics.totalShares}</div>
              <div className="metric-label">Shares</div>
            </div>
            <div className="metric">
              <div className="metric-value">
                {profileQuery.data?.stats.vaultAssetCount ?? 0}
              </div>
              <div className="metric-label">Vaults</div>
            </div>
          </div>
        </div>

        {(createFolderMutation.error || renameFolderMutation.error || deleteFolderMutation.error) && (
          <div
            style={{
              padding: "10px 16px",
              marginBottom: 16,
              background: "rgba(200, 57, 43, 0.15)",
              border: "1px solid var(--accent-red)",
              borderRadius: "var(--radius-sm)",
              color: "var(--accent-red)",
              fontSize: 12,
            }}
          >
            {(createFolderMutation.error ?? renameFolderMutation.error ?? deleteFolderMutation.error)?.message}
          </div>
        )}

        {/* Upload area — wallet + folder required */}
        {!connected ? (
          <div
            style={{
              padding: "28px 20px",
              borderRadius: 10,
              border: "1px dashed var(--border)",
              textAlign: "center",
              marginTop: 24,
              opacity: 0.6,
            }}
          >
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Connect your wallet to upload files
            </div>
          </div>
        ) : !activeFolderId ? (
          <div
            style={{
              padding: "20px 16px",
              borderRadius: 10,
              border: "1px dashed var(--border-hover)",
              background: "rgba(232,170,48,0.04)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 8, opacity: 0.5 }}>&#x1F4C2;</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
              Select or create a folder first
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Files must be organised into a folder before uploading.
            </div>
            {folders.length === 0 && (
              <button
                type="button"
                className="btn-primary"
                style={{ marginTop: 12, padding: "8px 20px", fontSize: 10 }}
                onClick={() => setShowFolderInput(true)}
              >
                + Create Folder
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              style={{
                marginBottom: 10,
                padding: "6px 10px",
                background: "rgba(232,170,48,0.08)",
                border: "1px solid rgba(232,170,48,0.2)",
                borderRadius: 8,
                fontSize: 11,
                color: "var(--accent-gold)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>&#x1F4C2;</span>
              <span>
                Uploading to:{" "}
                <strong>{folders.find((f) => f.id === activeFolderId)?.name ?? "folder"}</strong>
              </span>
              <span
                style={{ marginLeft: "auto", cursor: "pointer", opacity: 0.6 }}
                title="Change folder"
                onClick={() => setActiveFolderId(null)}
              >
                &#x2715;
              </span>
            </div>

            <div
              {...getRootProps()}
              className={`upload-zone${isDragActive ? " active" : ""}`}
            >
              <input {...getInputProps()} />
              <div className="upload-icon">&#x2191;</div>
              <p>
                {selectedUpload ? (
                  <>Selected: {selectedUpload.name}</>
                ) : (
                  <>
                    Drag files here or <span className="highlight">browse</span>
                  </>
                )}
              </p>
            </div>

            {selectedUpload && (
              <>
                <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-muted)" }}>
                  File size: <strong>{(selectedUpload.size / 1024 / 1024).toFixed(2)} MB</strong> / 4.5 MB limit
                </div>

                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <input
                    className="search-input"
                    style={{ flex: 1, width: "auto" }}
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={uploadMutation.isPending}
                  />
                  <button
                    className="btn-primary"
                    style={{ padding: "10px 24px", fontSize: 10 }}
                    disabled={uploadMutation.isPending || !connected || !walletAddress?.trim() || selectedUpload.size > 4.5 * 1024 * 1024}
                    onClick={() => uploadMutation.mutate()}
                    type="button"
                    title={selectedUpload.size > 4.5 * 1024 * 1024 ? "File exceeds 4.5 MB limit" : undefined}
                  >
                    {uploadPhase === "signing"
                      ? "Signing…"
                      : uploadPhase === "uploading"
                        ? `${uploadProgress}%`
                        : uploadPhase === "done"
                          ? "Done ✓"
                          : "Upload"}
                  </button>
                </div>

                {/* Progress bar */}
                {uploadMutation.isPending && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 10,
                      color: "rgba(240,237,230,0.5)",
                      marginBottom: 5,
                    }}>
                      <span>
                        {uploadPhase === "signing"
                          ? "Waiting for wallet signature…"
                          : `Uploading ${selectedUpload.name}`}
                      </span>
                      <span>{uploadPhase === "uploading" ? `${uploadProgress}%` : ""}</span>
                    </div>
                    <div style={{
                      height: 4,
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.07)",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%",
                        borderRadius: 999,
                        background: uploadPhase === "signing"
                          ? "linear-gradient(90deg, #b8a06a, #e8aa30)"
                          : "linear-gradient(90deg, #c8392b, #e8aa30)",
                        width: uploadPhase === "signing" ? "30%" : `${uploadProgress}%`,
                        transition: uploadPhase === "signing"
                          ? "none"
                          : "width 0.2s ease",
                        animation: uploadPhase === "signing" ? "pulse-bar 1.2s ease-in-out infinite" : "none",
                      }} />
                    </div>
                  </div>
                )}

                {/* Done state */}
                {uploadPhase === "done" && !uploadMutation.isPending && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{
                      height: 4,
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.07)",
                      overflow: "hidden",
                    }}>
                      <div style={{
                        height: "100%",
                        width: "100%",
                        borderRadius: 999,
                        background: "linear-gradient(90deg, #22c55e, #16a34a)",
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#22c55e", marginTop: 4 }}>
                      File uploaded successfully
                    </div>
                  </div>
                )}

                {uploadMutation.error && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "8px 12px",
                      background: "rgba(200,57,43,0.1)",
                      border: "1px solid rgba(200,57,43,0.25)",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "var(--accent-red)",
                    }}
                  >
                    {uploadMutation.error instanceof Error
                      ? uploadMutation.error.message
                      : "Upload failed."}
                  </div>
                )}
              </>
            )}
          </>
        )}

        <div style={{ marginTop: 32 }}>
          {/* Category tabs */}
          <div
            style={{
              display: "flex",
              gap: 0,
              marginBottom: 16,
              borderBottom: "1px solid var(--border)",
            }}
          >
            {FILE_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  padding: "10px 20px",
                  fontSize: 10,
                  fontFamily: "var(--font-dm-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  background: "transparent",
                  color:
                    activeCategory === cat.key
                      ? "var(--accent-red)"
                      : "var(--text-secondary)",
                  border: "none",
                  borderBottom:
                    activeCategory === cat.key
                      ? "2px solid var(--accent-red)"
                      : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {cat.label}
                <span
                  style={{
                    marginLeft: 6,
                    opacity: 0.5,
                    fontSize: 9,
                  }}
                >
                  {categoryCounts[cat.key]}
                </span>
              </button>
            ))}
          </div>

          <div className="file-table-header">
            <h3>
              {trimmedSearch
                ? "SEARCH RESULTS"
                : activeCategory === "all"
                  ? activeFolderId
                    ? "FOLDER FILES"
                    : "ALL FILES"
                  : FILE_CATEGORIES.find((c) => c.key === activeCategory)?.label.toUpperCase()}
            </h3>
            <input
              type="text"
              className="search-input"
              placeholder="Search across every folder..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              {trimmedSearch
                ? `Searching every folder for "${trimmedSearch}".`
                : activeFolderId
                  ? `Showing files in ${folders.find((folder) => folder.id === activeFolderId)?.name ?? "selected folder"}.`
                  : "Showing files across your full workspace."}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select
                className="search-input"
                style={{ width: "auto", minWidth: 148 }}
                value={sortField}
                onChange={(event) => setSortField(event.target.value as SortField)}
              >
                <option value="date">Sort: Updated</option>
                <option value="name">Sort: Name</option>
                <option value="size">Sort: Size</option>
                <option value="type">Sort: Type</option>
              </select>
              <select
                className="search-input"
                style={{ width: "auto", minWidth: 148 }}
                value={sortDir}
                onChange={(event) => setSortDir(event.target.value as SortDir)}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
          <div className="file-table">
            <div className="file-table-row header">
              <span
                style={{ cursor: "pointer" }}
                onClick={() => handleSortClick("name")}
              >
                Name{sortIndicator("name")}
              </span>
              <span
                style={{ cursor: "pointer" }}
                onClick={() => handleSortClick("size")}
              >
                Size{sortIndicator("size")}
              </span>
              <span
                style={{ cursor: "pointer" }}
                onClick={() => handleSortClick("date")}
              >
                Modified{sortIndicator("date")}
              </span>
              <span
                style={{ cursor: "pointer" }}
                onClick={() => handleSortClick("type")}
              >
                Type{sortIndicator("type")}
              </span>
            </div>
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="file-table-row"
                onClick={() => setSelectedFileId(file.id)}
              >
                <div className="file-table-name">
                  <div className={`file-icon sm ${fileIconClass(file.previewType)}`}>
                    {fileIconEmoji(file.previewType)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div>{file.filename}</div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {file.folder?.name ?? "Root"} &middot; {file.mimeType}
                    </div>
                  </div>
                </div>
                <span className="file-size">{formatBytes(file.size)}</span>
                <span className="file-meta">{formatDate(file.updatedAt)}</span>
                <span
                  className="file-meta"
                  style={
                    file.shares.length > 0
                      ? { color: "var(--accent-red)" }
                      : undefined
                  }
                >
                  {file.shares.length > 0 ? "Shared" : file.previewType.toLowerCase()}
                </span>
              </div>
            ))}
            {filteredFiles.length === 0 && (
              <div className="file-table-row" style={{ cursor: "default" }}>
                <span style={{ color: "var(--text-muted)", gridColumn: "1 / -1", textAlign: "center" }}>
                  {activeCategory === "all"
                    ? trimmedSearch
                      ? "No files matched your workspace search."
                      : "No files yet. Upload something to get started."
                    : `No ${FILE_CATEGORIES.find((c) => c.key === activeCategory)?.label.toLowerCase()} found.`}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* RIGHT PANEL */}
      <aside className="right-panel">
        {selectedFile ? (
          <>
            {/* Prev / Next navigation */}
            {filteredFiles.length > 1 && (() => {
              const idx = filteredFiles.findIndex((f) => f.id === selectedFile.id);
              const prev = filteredFiles[idx - 1] ?? filteredFiles[filteredFiles.length - 1];
              const next = filteredFiles[idx + 1] ?? filteredFiles[0];
              return (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <button
                    type="button"
                    onClick={() => setSelectedFileId(prev.id)}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "4px 12px", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13 }}
                  >
                    ← Prev
                  </button>
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    {idx + 1} / {filteredFiles.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedFileId(next.id)}
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "4px 12px", color: "var(--text-secondary)", cursor: "pointer", fontSize: 13 }}
                  >
                    Next →
                  </button>
                </div>
              );
            })()}

            <div className="detail-preview">
              <FilePreview
                fileId={selectedFile.id}
                originalName={selectedFile.originalName}
                previewType={selectedFile.previewType}
                walletAddress={walletAddress ?? undefined}
              />
            </div>
            <h3 style={{ fontFamily: "var(--font-bebas-neue)", fontSize: 18, letterSpacing: "0.1em", marginTop: 12 }}>
              {selectedFile.filename}
            </h3>
            <dl className="detail-meta">
              <dt>Type</dt>
              <dd>{selectedFile.mimeType}</dd>
              <dt>Size</dt>
              <dd>{formatBytes(selectedFile.size)}</dd>
              <dt>Storage</dt>
              <dd>{storageMode}</dd>
              <dt>Shares</dt>
              <dd>{selectedFile.shares.length}</dd>
            </dl>
            <div className="detail-actions">
              <button
                className="action-share"
                onClick={() => {
                  setDownloadPrice(0);
                  setShowShareModal(true);
                }}
                disabled={!connected || createShareMutation.isPending}
                type="button"
                title={!connected ? "Connect wallet to share" : undefined}
                style={!connected ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
              >
                Share
              </button>
              <Link
                href={`/api/files/${selectedFile.id}/download`}
                className="action-dl"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                Download
              </Link>
            </div>

            {selectedFile.shares.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div className="sidebar-section-label">Share Links</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  <p style={{ marginBottom: 8 }}>
                    You have <strong>{selectedFile.shares.length}</strong> active share link{selectedFile.shares.length !== 1 ? "s" : ""} for this file.
                  </p>
                  <Link
                    href="/share"
                    style={{
                      display: "inline-block",
                      fontSize: 11,
                      color: "var(--accent-red)",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                  >
                    Manage in Share Hub →
                  </Link>
                </div>
              </div>
            )}

            {/* Move to folder — wallet required */}
            <div style={{ marginTop: 16 }}>
              {!connected ? null : movingFileId === selectedFile.id ? (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: 10,
                    border: "1px solid var(--border-hover)",
                    background: "rgba(232,170,48,0.04)",
                  }}
                >
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 8 }}>
                    Move to folder
                  </div>
                  <select
                    value={moveTargetFolderId}
                    onChange={(e) => setMoveTargetFolderId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "7px 10px",
                      borderRadius: 6,
                      border: "1px solid var(--border-hover)",
                      background: "#111",
                      color: "var(--text-primary)",
                      fontSize: 12,
                      marginBottom: 8,
                    }}
                  >
                    <option value="">— select destination —</option>
                    {folders
                      .filter((f) => f.id !== activeFolderId)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                  </select>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ flex: 1, padding: "8px", fontSize: 10 }}
                      disabled={!moveTargetFolderId || moveFileMutation.isPending}
                      onClick={() =>
                        moveFileMutation.mutate({
                          fileId: selectedFile.id,
                          folderId: moveTargetFolderId || null,
                        })
                      }
                    >
                      {moveFileMutation.isPending ? "Moving..." : "Confirm Move"}
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: "8px 12px",
                        fontSize: 10,
                        background: "transparent",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                      onClick={() => { setMovingFileId(null); setMoveTargetFolderId(""); }}
                    >
                      Cancel
                    </button>
                  </div>
                  {moveFileMutation.error && (
                    <div style={{ marginTop: 6, fontSize: 11, color: "var(--accent-red)" }}>
                      {moveFileMutation.error instanceof Error
                        ? moveFileMutation.error.message
                        : "Move failed."}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    background: "transparent",
                    color: "var(--accent-gold)",
                    border: "1px solid var(--border-hover)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                  }}
                  onClick={() => { setMovingFileId(selectedFile.id); setMoveTargetFolderId(""); }}
                >
                  Move to Folder
                </button>
              )}
            </div>

            {connected && (
              <div style={{ marginTop: 12 }}>
                <button
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    background: "transparent",
                    color: "var(--accent-red)",
                    border: "1px solid var(--border-hover)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                  }}
                  onClick={() => deleteFileMutation.mutate(selectedFile.id)}
                  type="button"
                >
                  Delete File
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="detail-preview">
              <div style={{ fontSize: 32, opacity: 0.15 }}>&#x1F4C1;</div>
            </div>
            <h3 style={{ fontFamily: "var(--font-bebas-neue)", fontSize: 18, letterSpacing: "0.1em" }}>
              Select a file
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>
              Click a file from the table to preview details, share, or download.
            </p>
          </>
        )}

        <div style={{ marginTop: 32 }}>
          <div className="sidebar-section-label">Recent Activity</div>
          <div className="activity-list">
            {files.slice(0, 3).map((file) => (
              <div key={file.id} className="activity-item">
                <div className={`activity-dot${file.shares.length > 0 ? " gold" : ""}`} />
                <div>
                  <div className="activity-text">
                    {file.filename}{" "}
                    {file.shares.length > 0 ? "shared via link" : "uploaded"}
                  </div>
                  <div className="activity-time">{formatDate(file.updatedAt)}</div>
                </div>
              </div>
            ))}
            {files.length === 0 && (
              <div className="activity-item">
                <div className="activity-dot" />
                <div>
                  <div className="activity-text">No activity yet</div>
                  <div className="activity-time">Upload a file to get started</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Share Modal */}
      {showShareModal && selectedFile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => !createShareMutation.isPending && setShowShareModal(false)}
        >
          <div
            style={{
              background: "var(--card)",
              borderRadius: 20,
              padding: 32,
              maxWidth: 400,
              width: "100%",
              border: "1px solid var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontFamily: "var(--font-bebas-neue)",
                fontSize: 20,
                letterSpacing: "0.08em",
                marginBottom: 16,
                color: "var(--foreground)",
              }}
            >
              CREATE SHARE LINK
            </h3>

            <p
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              Share "{selectedFile.filename}" with others. Set a price for downloads (optional).
            </p>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--text-secondary)",
                  marginBottom: 8,
                }}
              >
                Download Price (APT)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={downloadPrice}
                onChange={(e) =>
                  setDownloadPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="0 for free download"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.03)",
                  color: "var(--foreground)",
                  fontSize: 13,
                  fontFamily: "var(--font-dm-mono)",
                }}
              />
              <p
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  marginTop: 6,
                  fontStyle: "italic",
                }}
              >
                Set 0 or leave empty for free download. Viewers get one free preview, payment required to download.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => !createShareMutation.isPending && setShowShareModal(false)}
                disabled={createShareMutation.isPending}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  cursor: createShareMutation.isPending ? "not-allowed" : "pointer",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  opacity: createShareMutation.isPending ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => selectedFile && createShareMutation.mutate(selectedFile.id)}
                disabled={createShareMutation.isPending}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--accent-red)",
                  color: "var(--foreground)",
                  cursor: createShareMutation.isPending ? "not-allowed" : "pointer",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  opacity: createShareMutation.isPending ? 0.7 : 1,
                }}
              >
                {createShareMutation.isPending ? "Creating..." : "Create Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
