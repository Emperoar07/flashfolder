"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useWorkspaceWallet } from "@/components/wallet-status";
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

  if (!connected) {
    return (
      <main className="mx-auto max-w-5xl px-6 pb-16 sm:px-8" style={{ paddingTop: 80 }}>
        <div style={{ textAlign: "center", paddingTop: 80 }}>
          <div style={{ fontSize: 48, opacity: 0.15, marginBottom: 16 }}>&#x1F517;</div>
          <h1
            style={{
              fontFamily: "var(--font-bebas-neue)",
              fontSize: 32,
              letterSpacing: "0.06em",
              color: "var(--foreground)",
            }}
          >
            CONNECT TO VIEW SHARES
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
            Connect your wallet to view and manage your shared files.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 pb-16 sm:px-8" style={{ paddingTop: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            color: "var(--text-muted)",
          }}
        >
          Share Hub
        </p>
        <h1
          style={{
            fontFamily: "var(--font-bebas-neue)",
            fontSize: 42,
            letterSpacing: "0.06em",
            color: "var(--foreground)",
            marginTop: 12,
          }}
        >
          YOUR SHARED FILES
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
          Manage and distribute your share links across platforms.
        </p>
      </div>

      {sharesQuery.isLoading && (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-secondary)", fontSize: 13 }}>
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
          <div style={{ fontSize: 48, opacity: 0.15, marginBottom: 16 }}>&#x1F517;</div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            No shared files yet. Share a file from your{" "}
            <Link href="/dashboard" style={{ color: "var(--accent-red)", textDecoration: "none" }}>
              dashboard
            </Link>{" "}
            to get started.
          </p>
        </div>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {shares.map((share) => {
          const shareUrl =
            typeof window !== "undefined"
              ? `${window.location.origin}/share/${share.token}`
              : `/share/${share.token}`;
          const isExpired = share.expiresAt && new Date(share.expiresAt) < new Date();

          return (
            <div
              key={share.id}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: 24,
                opacity: isExpired ? 0.5 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <h3
                      style={{
                        fontFamily: "var(--font-bebas-neue)",
                        fontSize: 20,
                        letterSpacing: "0.06em",
                        color: "var(--foreground)",
                      }}
                    >
                      {share.file.filename.toUpperCase()}
                    </h3>
                    <span
                      style={{
                        fontSize: 9,
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        padding: "3px 10px",
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
                      }}
                    >
                      {isExpired ? "Expired" : share.shareType}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text-secondary)" }}>
                    <span>{formatBytes(share.file.size)}</span>
                    <span>{share.file.mimeType.split("/")[1]?.toUpperCase()}</span>
                    {share.expiresAt && <span>Expires {formatDate(share.expiresAt)}</span>}
                    <span>Created {formatDate(share.createdAt)}</span>
                  </div>

                  {/* Share URL */}
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        padding: "8px 14px",
                        fontSize: 11,
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-dm-mono)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {shareUrl}
                    </div>
                    <Link
                      href={`/share/${share.token}`}
                      style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        padding: "8px 16px",
                        background: "var(--accent-red)",
                        color: "var(--foreground)",
                        borderRadius: 999,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      View
                    </Link>
                  </div>

                  {/* Social sharing buttons */}
                  {!isExpired && (
                    <div style={{ marginTop: 12 }}>
                      <SocialShareButtons
                        url={shareUrl}
                        title={`Check out "${share.file.filename}" on FlashFolder`}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
