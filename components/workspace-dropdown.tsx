"use client";

import Link from "next/link";
import React, { useState } from "react";

type WorkspaceDropdownProps = {
  activePage: "files" | "shared" | "vault" | "settings";
};

function FilesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  );
}

function SharedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <line x1="8.4" y1="10.8" x2="15.6" y2="6.2" />
      <line x1="8.4" y1="13.2" x2="15.6" y2="17.8" />
    </svg>
  );
}

function VaultIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="9" x2="12" y2="7" />
      <line x1="12" y1="15" x2="12" y2="17" />
      <line x1="9" y1="12" x2="7" y2="12" />
      <line x1="15" y1="12" x2="17" y2="12" />
      <line x1="6" y1="8" x2="6" y2="10" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

const PAGES = [
  { id: "files" as const, href: "/dashboard", Icon: FilesIcon, label: "My Files" },
  { id: "shared" as const, href: "/share", Icon: SharedIcon, label: "Shared" },
  { id: "vault" as const, href: "/vault", Icon: VaultIcon, label: "Vault" },
  { id: "settings" as const, href: "/settings", Icon: SettingsIcon, label: "Settings" },
];

const PAGE_ICONS: Record<string, () => React.ReactElement> = {
  files: FilesIcon,
  shared: SharedIcon,
  vault: VaultIcon,
  settings: SettingsIcon,
};

const PAGE_LABELS: Record<string, string> = {
  files: "My Files",
  shared: "Shared",
  vault: "Vault",
  settings: "Settings",
};

export function WorkspaceDropdown({ activePage }: WorkspaceDropdownProps) {
  const [open, setOpen] = useState(false);
  const ActiveIcon = PAGE_ICONS[activePage] ?? FilesIcon;
  const activeLabel = PAGE_LABELS[activePage] ?? "Workspace";

  return (
    <div style={{ position: "relative" }}>
      {/* Trigger button — shows active page */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "8px 10px 8px 7px",
          borderRadius: 8,
          background: "var(--ws-bg)",
          borderLeft: "3px solid var(--ws-accent)",
          border: "none",
          borderLeftWidth: 3,
          borderLeftStyle: "solid",
          borderLeftColor: "var(--ws-accent)",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ display: "flex", flexShrink: 0, color: "var(--ws-accent)" }}>
          <ActiveIcon />
        </span>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: "var(--ws-accent-text)" }}>
          {activeLabel}
        </span>
        <span style={{ color: "var(--ws-accent)", opacity: 0.7 }}>
          <ChevronIcon open={open} />
        </span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          style={{
            marginTop: 4,
            borderRadius: 10,
            background: "var(--ws-bg-deep)",
            border: "1px solid var(--ws-border)",
            overflow: "hidden",
            boxShadow: "0 8px 24px var(--overlay)",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "var(--ws-label)",
              textTransform: "uppercase",
              padding: "10px 12px 8px",
              margin: 0,
            }}
          >
            Workspace
          </p>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 6px 6px" }}>
            {PAGES.map(({ id, href, Icon, label }) => {
              const isActive = id === activePage;

              const sharedStyle: React.CSSProperties = {
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: isActive ? "8px 10px 8px 7px" : "8px 10px",
                borderRadius: 8,
                background: isActive ? "var(--ws-bg)" : "transparent",
                borderLeft: isActive ? "3px solid var(--ws-accent)" : "3px solid transparent",
                textDecoration: "none",
                transition: "background 0.15s",
                cursor: "pointer",
                width: "100%",
              };

              const svgWrapStyle: React.CSSProperties = {
                display: "flex",
                flexShrink: 0,
                color: isActive ? "var(--ws-accent)" : "var(--ws-inactive)",
              };

              if (isActive) {
                return (
                  <div key={id} style={sharedStyle} onClick={() => setOpen(false)}>
                    <span style={svgWrapStyle}><Icon /></span>
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ws-accent-text)" }}>
                      {label}
                    </span>
                  </div>
                );
              }

              return (
                <Link
                  key={id}
                  href={href}
                  style={sharedStyle}
                  onClick={() => setOpen(false)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--ws-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span style={svgWrapStyle}><Icon /></span>
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ws-inactive-text)" }}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
