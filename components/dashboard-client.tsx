"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useMemo, useState, useTransition } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";

import { FilePreview } from "@/components/file-preview";
import { useWorkspaceWallet } from "@/components/wallet-status";
import { apiFetch } from "@/lib/client/api";
import { useCurrentUser } from "@/lib/client/hooks";
import {
  PREVIEW_TYPES,
  SHARE_TYPES,
  type PreviewTypeValue,
} from "@/lib/file-kinds";
import type { FileRecord, FolderRecord, ShareRecord } from "@/lib/types";
import { formatBytes, formatDate, shortenWallet } from "@/lib/utils";

function fileIconClass(type: PreviewTypeValue) {
  switch (type) {
    case PREVIEW_TYPES.IMAGE:
      return "img";
    case PREVIEW_TYPES.VIDEO:
      return "vid";
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
  const { walletAddress } = useWorkspaceWallet();
  const profileQuery = useCurrentUser(walletAddress);
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

  const storageMode = settingsQuery.data?.settings.activeStorageMode ?? "local";

  return (
    <div className="dashboard">
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-section-label">Workspace</div>
          <nav className="sidebar-nav">
            <a
              href="#"
              className="active"
              onClick={(e) => {
                e.preventDefault();
                startTransition(() => setActiveFolderId(null));
              }}
            >
              <span className="icon">&#x1F4C1;</span> My Files
            </a>
            <Link href="/vault">
              <span className="icon">&#x1F512;</span> Vault
            </Link>
            <Link href="/settings">
              <span className="icon">&#x2699;</span> Settings
            </Link>
          </nav>
        </div>
        <div>
          <div className="sidebar-section-label">Folders</div>
          <div className="folder-tree">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="folder-item"
                onClick={() => startTransition(() => setActiveFolderId(folder.id))}
                style={activeFolderId === folder.id ? { color: "var(--accent-red)" } : undefined}
              >
                &#x1F4C2; {folder.name}
              </div>
            ))}
            <div
              className="folder-item"
              style={{ color: "var(--accent-red)" }}
              onClick={() => createFolderMutation.mutate()}
            >
              + New Folder
            </div>
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
              disabled={uploadMutation.isPending}
              onClick={() => uploadMutation.mutate()}
              type="button"
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload"}
            </button>
          </div>
        )}

        <div style={{ marginTop: 32 }}>
          <div className="file-table-header">
            <h3>ALL FILES</h3>
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
              <span>Name</span>
              <span>Size</span>
              <span>Modified</span>
              <span>Status</span>
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
                  {file.shares.length > 0 ? "Shared" : "Stored"}
                </span>
              </div>
            ))}
            {filteredFiles.length === 0 && (
              <div className="file-table-row" style={{ cursor: "default" }}>
                <span style={{ color: "var(--text-muted)", gridColumn: "1 / -1", textAlign: "center" }}>
                  No files yet. Upload something to get started.
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
                    <div key={share.id} className="activity-item">
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
