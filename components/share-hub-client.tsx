"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useWorkspaceWallet } from "@/components/wallet-status";
import { WorkspaceDropdown } from "@/components/workspace-dropdown";
import { SocialShareButtons } from "@/components/social-share-buttons";
import { apiFetch } from "@/lib/client/api";
import { formatBytes, formatDate, shortenWallet } from "@/lib/utils";
import type { ShareRecord } from "@/lib/types";

type ShareWithFile = ShareRecord & {
  file: {
    id: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    folder: { name: string } | null;
  };
};

export function ShareHubClient() {
  const { walletAddress, connected } = useWorkspaceWallet();

  const sharesQuery = useQuery({
    queryKey: ["shares", walletAddress],
    queryFn: () =>
      apiFetch<{ shares: ShareWithFile[] }>("/api/shares", {}, walletAddress),
    enabled: connected,
  });

  const shares = sharesQuery.data?.shares ?? [];
  const activeShares = shares.filter(
    (s) => !s.expiresAt || new Date(s.expiresAt) > new Date(),
  );
  const expiredShares = shares.filter(
    (s) => s.expiresAt && new Date(s.expiresAt) <= new Date(),
  );

  return (
    <div className="dashboard">
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <WorkspaceDropdown activePage="shared" />

        <div>
          <div className="sidebar-section-label">Share Stats</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 8,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12,
                padding: 16,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-bebas-neue)",
                  fontSize: 28,
                  color: "var(--foreground)",
                }}
              >
                {shares.length}
              </div>
              <div
                style={{
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "var(--text-muted)",
                }}
              >
                Total
              </div>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12,
                padding: 16,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-bebas-neue)",
                  fontSize: 28,
                  color: "var(--accent-red)",
                }}
              >
                {activeShares.length}
              </div>
              <div
                style={{
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "var(--text-muted)",
                }}
              >
                Active
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="sidebar-section-label">Share Types</div>
          <div style={{ marginTop: 8 }}>
            {["PUBLIC", "PRIVATE", "PASSWORD"].map((type) => {
              const count = shares.filter((s) => s.shareType === type).length;
              return (
                <div
                  key={type}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: "var(--text-secondary)", textTransform: "capitalize" }}>
                    {type.toLowerCase()}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-bebas-neue)",
                      fontSize: 16,
                      color: count > 0 ? "var(--foreground)" : "var(--text-muted)",
                    }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* Hero section */}
        <div className="vault-hero">
          <div className="section-label">Share Hub</div>
          <h2>
            YOUR LINKS. YOUR <em>REACH.</em>
          </h2>
          <p>
            Manage and distribute your shared files across platforms. Share to X, Facebook, WhatsApp, Telegram, or copy the link.
          </p>
          <div className="vault-metrics">
            <div className="metric">
              <div className="metric-value">{activeShares.length}</div>
              <div className="metric-label">Active Links</div>
            </div>
            <div className="metric">
              <div className="metric-value">{expiredShares.length}</div>
              <div className="metric-label">Expired</div>
            </div>
            <div className="metric">
              <div className="metric-value">
                {shares.filter((s) => s.shareType === "PASSWORD").length}
              </div>
              <div className="metric-label">Protected</div>
            </div>
          </div>
        </div>

        {/* Share list */}
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-bebas-neue)",
                fontSize: 22,
                letterSpacing: "0.1em",
                color: "var(--foreground)",
              }}
            >
              YOUR SHARES
            </h2>
          </div>

          {sharesQuery.isLoading && (
            <div
              style={{
                textAlign: "center",
                padding: 60,
                color: "var(--text-secondary)",
                fontSize: 13,
              }}
            >
              Loading shares...
            </div>
          )}

          {!sharesQuery.isLoading && shares.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: 60,
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 20,
              }}
            >
              <div style={{ fontSize: 48, opacity: 0.15, marginBottom: 16 }}>
                &#x1F517;
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-bebas-neue)",
                  fontSize: 20,
                  letterSpacing: "0.08em",
                  color: "var(--foreground)",
                  marginBottom: 8,
                }}
              >
                NO SHARED FILES YET
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Share a file from your{" "}
                <Link
                  href="/dashboard"
                  style={{ color: "var(--accent-red)", textDecoration: "none" }}
                >
                  dashboard
                </Link>{" "}
                to get started.
              </p>
            </div>
          )}

          <div style={{ display: "grid", gap: 12 }}>
            {shares.map((share) => {
              const shareUrl =
                typeof window !== "undefined"
                  ? `${window.location.origin}/share/${share.token}`
                  : `/share/${share.token}`;
              const isExpired =
                share.expiresAt && new Date(share.expiresAt) < new Date();

              return (
                <div
                  key={share.id}
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    padding: 20,
                    opacity: isExpired ? 0.5 : 1,
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpired)
                      e.currentTarget.style.borderColor = "var(--border-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    {/* File info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <h3
                          style={{
                            fontFamily: "var(--font-bebas-neue)",
                            fontSize: 18,
                            letterSpacing: "0.06em",
                            color: "var(--foreground)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {share.file.filename.toUpperCase()}
                        </h3>
                        <span
                          style={{
                            fontSize: 9,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            padding: "2px 8px",
                            borderRadius: 999,
                            border: `1px solid ${
                              share.shareType === "PASSWORD"
                                ? "var(--accent-gold)"
                                : isExpired
                                  ? "rgba(255,255,255,0.1)"
                                  : "var(--accent-red)"
                            }`,
                            color:
                              share.shareType === "PASSWORD"
                                ? "var(--accent-gold)"
                                : isExpired
                                  ? "var(--text-muted)"
                                  : "var(--accent-red)",
                            flexShrink: 0,
                          }}
                        >
                          {isExpired ? "Expired" : share.shareType}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 12,
                          fontSize: 10,
                          color: "var(--text-muted)",
                          marginTop: 6,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        <span>{formatBytes(share.file.size)}</span>
                        <span>
                          {share.file.mimeType.split("/")[1]?.toUpperCase()}
                        </span>
                        <span>Created {formatDate(share.createdAt)}</span>
                        {share.expiresAt && (
                          <span>
                            {isExpired ? "Expired" : "Expires"}{" "}
                            {formatDate(share.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* View button */}
                    <Link
                      href={`/share/${share.token}`}
                      style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        padding: "8px 20px",
                        background: "var(--accent-red)",
                        color: "var(--foreground)",
                        borderRadius: 999,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      View
                    </Link>
                  </div>

                  {/* Share URL + social buttons */}
                  {!isExpired && (
                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          minWidth: 200,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          padding: "6px 12px",
                          fontSize: 10,
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-dm-mono)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {shareUrl}
                      </div>
                      <SocialShareButtons
                        url={shareUrl}
                        title={`Check out "${share.file.filename}" on FlashFolder`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="detail-sidebar">
        <div className="detail-preview">
          <div style={{ fontSize: 48, opacity: 0.15 }}>&#x1F517;</div>
        </div>
        <h3
          style={{
            fontFamily: "var(--font-bebas-neue)",
            fontSize: 18,
            letterSpacing: "0.1em",
          }}
        >
          Share Hub
        </h3>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            marginTop: 8,
            lineHeight: 1.6,
          }}
        >
          All your shared files in one place. Distribute links across X,
          Facebook, WhatsApp, and Telegram with one click.
        </p>

        <div style={{ marginTop: 32 }}>
          <div className="sidebar-section-label">Quick Actions</div>
          <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
            <Link
              href="/dashboard"
              className="btn-primary"
              style={{
                textDecoration: "none",
                textAlign: "center",
                fontSize: 10,
                padding: "10px 16px",
              }}
            >
              Share a File
            </Link>
            <Link
              href="/vault"
              className="btn-secondary"
              style={{
                textDecoration: "none",
                textAlign: "center",
                fontSize: 10,
                padding: "10px 16px",
              }}
            >
              Share Vault Content
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <div className="sidebar-section-label">Recent Activity</div>
          <div className="activity-list">
            {shares.slice(0, 5).map((share) => {
              const isExpired =
                share.expiresAt && new Date(share.expiresAt) < new Date();
              return (
                <div key={share.id} className="activity-item">
                  <div
                    className={`activity-dot${
                      isExpired ? "" : share.shareType === "PASSWORD" ? " gold" : ""
                    }`}
                    style={isExpired ? { background: "var(--text-muted)" } : undefined}
                  />
                  <div>
                    <div className="activity-text">
                      {share.file.filename}
                    </div>
                    <div className="activity-time">
                      {isExpired ? "expired" : share.shareType.toLowerCase()}{" "}
                      &middot; {formatDate(share.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
            {shares.length === 0 && (
              <div className="activity-item">
                <div className="activity-dot" />
                <div>
                  <div className="activity-text">No shares yet</div>
                  <div className="activity-time">
                    Share a file to see activity
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
