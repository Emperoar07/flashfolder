"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useMemo, useState, useTransition } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";

import { FilePreview } from "@/components/file-preview";
import { SocialShareButtons } from "@/components/social-share-buttons";
import { useWorkspaceWallet } from "@/components/wallet-status";
import { WorkspaceDropdown } from "@/components/workspace-dropdown";
import { apiFetch } from "@/lib/client/api";
import { useAptosTransaction } from "@/lib/client/use-aptos-transaction";
import { useCurrentUser } from "@/lib/client/hooks";
import {
  PREVIEW_TYPES,
  SHARE_TYPES,
  type PreviewTypeValue,
} from "@/lib/file-kinds";
import type { FileRecord, FolderRecord, ShareRecord } from "@/lib/types";
import { formatBytes, formatDate, shortenWallet } from "@/lib/utils";

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

function sortFiles(files: FileRecord[], field: SortField, dir: SortDir) {
  const mult = dir === "asc" ? 1 : -1;
  return [...files].sort((a, b) => {
    switch (field) {
      case "name":
        return mult * a.filename.localeCompare(b.filename);
      case "size":
        return mult * (a.size - b.size);
      case "date":
        return mult * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      case "type":
        return mult * a.previewType.localeCompare(b.previewType);
      default:
        return 0;
    }
  });
}

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

type DashboardClientProps = {
  initialFolderId?: string;
};

export function DashboardClient({ initialFolderId }: DashboardClientProps) {
  const { walletAddress, connected } = useWorkspaceWallet();
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
  const [shareType, setShareType] = useState<
    "PUBLIC" | "PRIVATE" | "PASSWORD"
  >("PUBLIC");
  const [sharePassword, setSharePassword] = useState("");
  const [selectedUpload, setSelectedUpload] = useState<File | null>(null);
  const deferredSearch = useDeferredValue(search);

  // File category & sorting state
  const [activeCategory, setActiveCategory] = useState<FileCategory>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Aptos transaction hook
  const {
    submitFolderTransaction,
    isPending: txPending,
    error: txError,
    clearError: clearTxError,
    walletConnected,
  } = useAptosTransaction();

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
      let transactionHash: string | undefined;

      if (connected) {
        const hash = await submitFolderTransaction("folder_create", name);
        if (!hash) throw new Error("Transaction was rejected. Folder not created.");
        transactionHash = hash;
      }

      return apiFetch<{ folder: FolderRecord }>(
        "/api/folders",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, transactionHash }),
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
      let transactionHash: string | undefined;

      if (connected) {
        const hash = await submitFolderTransaction("folder_rename", name);
        if (!hash) throw new Error("Transaction was rejected. Folder not renamed.");
        transactionHash = hash;
      }

      return apiFetch<{ folder: FolderRecord }>(
        `/api/folders/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, transactionHash }),
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
      if (connected) {
        const hash = await submitFolderTransaction("folder_delete", "folder");
        if (!hash) throw new Error("Transaction was rejected. Folder not deleted.");
      }

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
      if (!selectedUpload) {
        throw new Error("Pick a file first.");
      }

      if (connected) {
        const hash = await submitFolderTransaction("file_upload", selectedUpload.name);
        if (!hash) throw new Error("Transaction was rejected. File not uploaded.");
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
    mutationFn: async (fileId: string) => {
      if (connected) {
        const hash = await submitFolderTransaction("file_delete", "file");
        if (!hash) throw new Error("Transaction was rejected. File not deleted.");
      }

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
      if (connected) {
        const hash = await submitFolderTransaction("file_share", "share");
        if (!hash) throw new Error("Transaction was rejected. Share not created.");
      }

      return apiFetch<{ share: ShareRecord }>(
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
      );
    },
    onSuccess: () => {
      setSharePassword("");
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
    const lowered = deferredSearch.toLowerCase();
    let result = files.filter((file) => {
      const matchesSearch = lowered
        ? file.filename.toLowerCase().includes(lowered) ||
          file.description?.toLowerCase().includes(lowered)
        : true;
      const matchesCategory =
        activeCategory === "all" || getFileCategory(file.previewType) === activeCategory;
      return matchesSearch && matchesCategory;
    });
    result = sortFiles(result, sortField, sortDir);
    return result;
  }, [deferredSearch, files, activeCategory, sortField, sortDir]);

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
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <WorkspaceDropdown activePage="files" />
        <div>
          <div className="sidebar-section-label">Folders</div>
          <div className="folder-tree">
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
                      disabled={renameFolderMutation.isPending || txPending}
                    />
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ padding: "4px 8px", fontSize: 9 }}
                      disabled={renameFolderMutation.isPending || txPending}
                    >
                      {txPending ? "Signing..." : "OK"}
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
                {renamingFolderId !== folder.id && (
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
            {showFolderInput ? (
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
                  disabled={createFolderMutation.isPending || txPending}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: "4px 8px", fontSize: 9 }}
                  disabled={createFolderMutation.isPending || txPending}
                >
                  {txPending ? "Signing..." : "Add"}
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
        <div className="dash-hero">
          <h2>GOOD EVENING</h2>
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

        {/* Transaction status */}
        {txError && (
          <div
            style={{
              padding: "10px 16px",
              marginBottom: 16,
              background: "rgba(200, 57, 43, 0.15)",
              border: "1px solid var(--accent-red)",
              borderRadius: "var(--radius-sm)",
              color: "var(--accent-red)",
              fontSize: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{txError}</span>
            <span style={{ cursor: "pointer", opacity: 0.7 }} onClick={clearTxError}>
              &#x2715;
            </span>
          </div>
        )}

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
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <input
                className="search-input"
                style={{ flex: 1, width: "auto" }}
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <button
                className="btn-primary"
                style={{ padding: "10px 24px", fontSize: 10 }}
                disabled={uploadMutation.isPending || txPending}
                onClick={() => uploadMutation.mutate()}
                type="button"
              >
                {txPending ? "Signing..." : uploadMutation.isPending ? "Uploading..." : "Upload"}
              </button>
            </div>
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
              {activeCategory === "all"
                ? "ALL FILES"
                : FILE_CATEGORIES.find((c) => c.key === activeCategory)?.label.toUpperCase()}
            </h3>
            <input
              type="text"
              className="search-input"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                  <span>{file.filename}</span>
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
                    ? "No files yet. Upload something to get started."
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
            <div className="detail-preview">
              {selectedFile.previewType === PREVIEW_TYPES.VIDEO ? (
                <div className="play-btn">&#x25B6;</div>
              ) : selectedFile.previewType === PREVIEW_TYPES.IMAGE ? (
                <FilePreview
                  fileId={selectedFile.id}
                  originalName={selectedFile.originalName}
                  previewType={selectedFile.previewType}
                />
              ) : selectedFile.previewType === PREVIEW_TYPES.AUDIO ? (
                <div style={{ fontSize: 32, opacity: 0.3 }}>&#x1F3B5;</div>
              ) : (
                <div style={{ fontSize: 32, opacity: 0.15 }}>&#x1F4C4;</div>
              )}
            </div>
            <h3 style={{ fontFamily: "var(--font-bebas-neue)", fontSize: 18, letterSpacing: "0.1em" }}>
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
                onClick={() => createShareMutation.mutate(selectedFile.id)}
                type="button"
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
                <div className="activity-list">
                  {selectedFile.shares.map((share) => (
                    <div key={share.id} style={{ marginBottom: 8 }}>
                      <div className="activity-item">
                        <div className={`activity-dot${share.shareType === SHARE_TYPES.PASSWORD ? " gold" : ""}`} />
                        <div>
                          <Link
                            href={`/share/${share.token}`}
                            className="activity-text"
                            style={{ textDecoration: "none" }}
                          >
                            {share.shareType.toLowerCase()} link
                          </Link>
                          <div
                            className="activity-time"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              void navigator.clipboard.writeText(
                                `${window.location.origin}/share/${share.token}`,
                              )
                            }
                          >
                            Click to copy
                          </div>
                        </div>
                      </div>
                      <div style={{ marginLeft: 20, marginTop: 4 }}>
                        <SocialShareButtons
                          url={`${window.location.origin}/share/${share.token}`}
                          title={`Check out "${selectedFile.filename}" on FlashFolder`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 24 }}>
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
    </div>
  );
}
