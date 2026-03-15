"use client";

import Link from "next/link";
import { useState } from "react";

type WorkspaceDropdownProps = {
  activePage: "files" | "shared" | "vault" | "settings";
};

function FilesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SharedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function VaultIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const PAGES = [
  { id: "files" as const, href: "/dashboard", icon: FilesIcon, label: "My Files" },
  { id: "shared" as const, href: "/share", icon: SharedIcon, label: "Shared" },
  { id: "vault" as const, href: "/vault", icon: VaultIcon, label: "Vault" },
  { id: "settings" as const, href: "/settings", icon: SettingsIcon, label: "Settings" },
];

export function WorkspaceDropdown({ activePage }: WorkspaceDropdownProps) {
  const [open, setOpen] = useState(false);

  const current = PAGES.find((p) => p.id === activePage) ?? PAGES[0];
  const CurrentIcon = current.icon;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <span
          className="sidebar-section-label"
          style={{ marginBottom: 0, cursor: "pointer" }}
        >
          Workspace
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: "var(--text-muted)",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {!open && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            background: "rgba(200,57,43,0.08)",
            border: "1px solid rgba(200,57,43,0.15)",
            borderRadius: 10,
            fontSize: 13,
            color: "var(--foreground)",
          }}
        >
          <span style={{ color: "var(--accent-gold)", display: "flex" }}>
            <CurrentIcon />
          </span>
          {current.label}
        </div>
      )}

      {open && (
        <nav className="sidebar-nav" style={{ marginTop: 8 }}>
          {PAGES.map((page) => {
            const Icon = page.icon;
            const isActive = page.id === activePage;
            return isActive ? (
              <a
                key={page.id}
                href="#"
                className="active"
                onClick={(e) => e.preventDefault()}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <span style={{ color: "var(--accent-gold)", display: "flex" }}>
                  <Icon />
                </span>
                {page.label}
              </a>
            ) : (
              <Link
                key={page.id}
                href={page.href}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <span style={{ display: "flex", opacity: 0.5 }}>
                  <Icon />
                </span>
                {page.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
