"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useWorkspaceWallet } from "@/components/wallet-status";
import { WorkspaceDropdown } from "@/components/workspace-dropdown";
import { useCurrentUser } from "@/lib/client/hooks";
import { apiFetch } from "@/lib/client/api";
import { shortenWallet, formatDate } from "@/lib/utils";
import type { CurrentUserProfile } from "@/lib/types";

type SettingsData = {
  aptosNetwork: string;
  activeStorageMode: string;
  storageState: string;
  storageFallbackReason: string | null;
  blobConfigured: boolean;
  maxUploadMb: number;
  walletAuth: { mode: string };
  aptos: { mockEnabled: boolean };
};

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 0",
        borderBottom: "1px solid var(--border)",
        gap: 16,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            color: "var(--foreground)",
            fontWeight: 500,
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 500,
        color: active ? "#34d399" : "var(--accent-gold)",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: active ? "#34d399" : "var(--accent-gold)",
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}

function ReadOnlyValue({ value }: { value: string }) {
  return (
    <span
      style={{
        fontSize: 13,
        fontFamily: "var(--font-dm-mono)",
        color: "var(--foreground)",
        background: "rgba(255,255,255,0.03)",
        padding: "6px 14px",
        borderRadius: 8,
        border: "1px solid var(--border)",
      }}
    >
      {value}
    </span>
  );
}

export function SettingsClient() {
  const { walletAddress, connected } = useWorkspaceWallet();
  const queryClient = useQueryClient();
  const profileQuery = useCurrentUser(walletAddress);
  const [displayName, setDisplayName] = useState("");
  const [nameEditing, setNameEditing] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ settings: SettingsData }>("/api/settings"),
    enabled: connected,
  });

  const updateNameMutation = useMutation({
    mutationFn: (name: string) =>
      apiFetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name }),
      }, walletAddress),
    onSuccess: () => {
      setNameEditing(false);
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const settings = settingsQuery.data?.settings;
  const profile = profileQuery.data;

  if (!connected) {
    return (
      <div className="dashboard">
        <aside className="sidebar">
          <WorkspaceDropdown activePage="settings" />
        </aside>
        <main className="main-content">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "60vh",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 48, opacity: 0.15, marginBottom: 16 }}>&#x2699;</div>
            <h1
              style={{
                fontFamily: "var(--font-bebas-neue)",
                fontSize: 32,
                letterSpacing: "0.06em",
                color: "var(--foreground)",
              }}
            >
              CONNECT TO ACCESS SETTINGS
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
              Connect your wallet to manage your workspace settings.
            </p>
          </div>
        </main>
        <aside className="detail-sidebar" />
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <WorkspaceDropdown activePage="settings" />

        {/* Account summary */}
        <div>
          <div className="sidebar-section-label">Account</div>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 12,
              padding: 16,
              marginTop: 8,
            }}
          >
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              Connected as
            </div>
            <div
              style={{
                fontSize: 12,
                fontFamily: "var(--font-dm-mono)",
                color: "var(--foreground)",
                wordBreak: "break-all",
              }}
            >
              {shortenWallet(walletAddress)}
            </div>
            {profile && (
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  marginTop: 8,
                }}
              >
                Joined {formatDate(profile.user.createdAt)}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {profile && (
          <div>
            <div className="sidebar-section-label">Usage</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                marginTop: 8,
              }}
            >
              {[
                { value: profile.stats.fileCount, label: "Files" },
                { value: profile.stats.folderCount, label: "Folders" },
                { value: profile.stats.shareCount, label: "Shares" },
                { value: profile.stats.vaultAssetCount, label: "Vaults" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 10,
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-bebas-neue)",
                      fontSize: 22,
                      color: "var(--foreground)",
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "var(--text-muted)",
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <div className="vault-hero">
          <div className="section-label">Settings</div>
          <h2>
            YOUR WORKSPACE. YOUR <em>RULES.</em>
          </h2>
          <p>
            Manage your account, storage, and FlashVault preferences.
          </p>
        </div>

        {/* Account Settings */}
        <section
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
            marginTop: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "var(--accent-red)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              &#x1F464;
            </div>
            <h3
              style={{
                fontFamily: "var(--font-bebas-neue)",
                fontSize: 18,
                letterSpacing: "0.1em",
                color: "var(--foreground)",
              }}
            >
              ACCOUNT
            </h3>
          </div>

          <SettingRow
            label="Display Name"
            description="Your name shown across the workspace"
          >
            {nameEditing ? (
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter name"
                  style={{
                    fontSize: 12,
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                    padding: "6px 12px",
                    borderRadius: 8,
                    outline: "none",
                    width: 160,
                  }}
                />
                <button
                  type="button"
                  onClick={() => updateNameMutation.mutate(displayName)}
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    background: "var(--accent-red)",
                    color: "var(--foreground)",
                    border: "none",
                    padding: "6px 16px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setNameEditing(false)}
                  style={{
                    fontSize: 10,
                    background: "transparent",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                    padding: "6px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDisplayName(profile?.user.username?.split("::")[0] ?? "");
                  setNameEditing(true);
                }}
                style={{
                  fontSize: 12,
                  color: nameSaved ? "#34d399" : "var(--foreground)",
                  background: "rgba(255,255,255,0.03)",
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {nameSaved
                  ? "Saved!"
                  : profile?.user.username?.split("::")[0] || shortenWallet(walletAddress)}
              </button>
            )}
          </SettingRow>

          <SettingRow
            label="Wallet Address"
            description="Your connected Aptos wallet"
          >
            <ReadOnlyValue value={shortenWallet(walletAddress)} />
          </SettingRow>

          <SettingRow
            label="Network"
            description="The Aptos network your workspace operates on"
          >
            <ReadOnlyValue value={settings?.aptosNetwork ?? "testnet"} />
          </SettingRow>

          <SettingRow
            label="Auth Mode"
            description="How your identity is verified"
          >
            <ReadOnlyValue
              value={
                settings?.walletAuth.mode === "mock"
                  ? "Wallet + Email"
                  : "Challenge-Response"
              }
            />
          </SettingRow>
        </section>

        {/* Storage Settings */}
        <section
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
            marginTop: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: "var(--accent-gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              &#x1F4BE;
            </div>
            <h3
              style={{
                fontFamily: "var(--font-bebas-neue)",
                fontSize: 18,
                letterSpacing: "0.1em",
                color: "var(--foreground)",
              }}
            >
              STORAGE
            </h3>
          </div>

          <SettingRow
            label="Active Storage"
            description="Where your files are stored"
          >
            <ReadOnlyValue
              value={
                settings?.activeStorageMode === "local"
                  ? "Local"
                  : settings?.activeStorageMode === "blob"
                    ? "Cloud (Blob)"
                    : settings?.activeStorageMode ?? "Local"
              }
            />
          </SettingRow>

          <SettingRow
            label="Status"
            description="Current storage system health"
          >
            <StatusBadge
              active={settings?.storageState === "active"}
              label={settings?.storageState === "active" ? "Active" : "Pending"}
            />
          </SettingRow>

          <SettingRow
            label="Upload Limit"
            description="Maximum file size per upload"
          >
            <ReadOnlyValue value={`${settings?.maxUploadMb ?? 100} MB`} />
          </SettingRow>

          <SettingRow
            label="Cloud Backup"
            description="Vercel Blob backup status"
          >
            <StatusBadge
              active={settings?.blobConfigured ?? false}
              label={settings?.blobConfigured ? "Enabled" : "Not configured"}
            />
          </SettingRow>

          {settings?.storageFallbackReason && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: "rgba(184,160,106,0.08)",
                border: "1px solid rgba(184,160,106,0.2)",
                borderRadius: 10,
                fontSize: 11,
                color: "var(--accent-gold)",
              }}
            >
              {settings.storageFallbackReason}
            </div>
          )}
        </section>

        {/* FlashVault Settings */}
        <section
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
            marginTop: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, var(--accent-red), var(--accent-gold))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              &#x1F512;
            </div>
            <h3
              style={{
                fontFamily: "var(--font-bebas-neue)",
                fontSize: 18,
                letterSpacing: "0.1em",
                color: "var(--foreground)",
              }}
            >
              FLASHVAULT
            </h3>
          </div>

          <SettingRow
            label="NFT Verification"
            description="How vault ownership is verified"
          >
            <StatusBadge
              active={!settings?.aptos.mockEnabled}
              label={
                settings?.aptos.mockEnabled ? "Demo Mode" : "Live On-Chain"
              }
            />
          </SettingRow>

          <SettingRow
            label="Content Protection"
            description="Vault content is gated behind NFT ownership checks"
          >
            <ReadOnlyValue value="Owner-Gated" />
          </SettingRow>

          <SettingRow
            label="Encryption"
            description="Vault files are encrypted at rest before storage"
          >
            <StatusBadge active={true} label="AES Encrypted" />
          </SettingRow>
        </section>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 24,
          }}
        >
          <Link
            href="/dashboard"
            className="btn-primary"
            style={{ textDecoration: "none", fontSize: 10, padding: "10px 24px" }}
          >
            Back to Dashboard
          </Link>
          <Link
            href="/vault"
            className="btn-secondary"
            style={{ textDecoration: "none", fontSize: 10, padding: "10px 24px" }}
          >
            Open Vault
          </Link>
        </div>
      </main>

      {/* RIGHT SIDEBAR */}
      <aside className="detail-sidebar">
        <div className="detail-preview">
          <div style={{ fontSize: 48, opacity: 0.15 }}>&#x2699;</div>
        </div>
        <h3
          style={{
            fontFamily: "var(--font-bebas-neue)",
            fontSize: 18,
            letterSpacing: "0.1em",
          }}
        >
          Settings
        </h3>
        <p
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            marginTop: 8,
            lineHeight: 1.6,
          }}
        >
          Manage your workspace preferences, storage configuration, and vault settings.
        </p>

        <div style={{ marginTop: 32 }}>
          <div className="sidebar-section-label">Quick Info</div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-dot" style={{ background: "#34d399" }} />
              <div>
                <div className="activity-text">Aptos Testnet</div>
                <div className="activity-time">Connected</div>
              </div>
            </div>
            <div className="activity-item">
              <div
                className="activity-dot"
                style={{
                  background:
                    settings?.storageState === "active" ? "#34d399" : "var(--accent-gold)",
                }}
              />
              <div>
                <div className="activity-text">Storage</div>
                <div className="activity-time">
                  {settings?.activeStorageMode ?? "local"} &middot;{" "}
                  {settings?.storageState ?? "active"}
                </div>
              </div>
            </div>
            <div className="activity-item">
              <div
                className="activity-dot"
                style={{
                  background: settings?.aptos.mockEnabled
                    ? "var(--accent-gold)"
                    : "#34d399",
                }}
              />
              <div>
                <div className="activity-text">FlashVault</div>
                <div className="activity-time">
                  {settings?.aptos.mockEnabled ? "Demo mode" : "Live on-chain"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
