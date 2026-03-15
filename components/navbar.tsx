"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useWorkspaceWallet } from "@/components/wallet-status";
import { ThemeToggle } from "@/components/theme-toggle";
import { shortenWallet } from "@/lib/utils";

function WalletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const {
    walletAddress,
    connected,
    connect,
    disconnect,
    wallets,
    authError,
    isAuthenticating,
    lastError,
  } = useWorkspaceWallet();
  const [connectDropdownOpen, setConnectDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const walletError = authError ?? lastError;

  const navLinks =
    pathname === "/"
      ? [
          { href: "/", label: "Home" },
          { href: "/dashboard", label: "Dashboard" },
          { href: "/vault", label: "Vault" },
        ]
      : [
          { href: "/", label: "Home" },
          { href: "/dashboard", label: "Dashboard" },
          { href: "/vault", label: "Vault" },
          ...(connected
            ? [
                { href: "/share", label: "Share" },
                { href: "/settings", label: "Settings" },
              ]
            : []),
        ];

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      
      // Don't close if clicking inside desktop dropdown container (includes button)
      if (desktopDropdownRef.current?.contains(target)) {
        return;
      }
      
      // Don't close if clicking inside mobile dropdown container
      if (mobileDropdownRef.current?.contains(target)) {
        return;
      }
      
      // Otherwise, close the dropdown
      setConnectDropdownOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setConnectDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  async function handleWalletConnect(walletName: string) {
    // Don't close dropdown immediately - let wallet adapter handle it
    await connect(walletName);
    setConnectDropdownOpen(false);
  }

  function handleDisconnect() {
    setConnectDropdownOpen(false);
    void disconnect();
  }

  const btnClass =
    "rounded-full border border-[var(--border)] px-5 py-2 text-[11px] tracking-[0.05em] text-[var(--foreground)] transition hover:border-[var(--accent-red)] hover:bg-[var(--accent-red-subtle)]";

  return (
    <>
      <nav className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b border-[var(--border)] bg-[var(--navbar-bg)] px-6 py-4 backdrop-blur-xl sm:px-10">
        <Link
          href="/"
          className="font-[family-name:var(--font-bebas-neue)] text-[22px] tracking-[0.15em] text-[var(--foreground)]"
        >
          <span className="text-[var(--accent-red)]">FLASH</span>FOLDER
        </Link>

        <div className="hidden items-center gap-6 sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative text-[10px] uppercase tracking-[0.2em] transition-colors ${
                isActive(link.href)
                  ? "text-[var(--accent-red)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--accent-red)]"
              }`}
            >
              {link.label}
              {isActive(link.href) ? (
                <span className="absolute -bottom-1.5 left-0 right-0 h-px bg-[var(--accent-red)]" />
              ) : null}
            </Link>
          ))}

            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent-red)]" />
            Testnet
          </span>

          <div className="relative" ref={desktopDropdownRef}>
            <button
              onClick={() => {
                console.log("[Navbar] Connect button clicked");
                setConnectDropdownOpen((open) => !open);
              }}
              className={`inline-flex items-center gap-2 ${btnClass}`}
              type="button"
            >
              <WalletIcon />
              {connected && walletAddress ? shortenWallet(walletAddress) : "Connect"}
            </button>

            {connectDropdownOpen ? (
              <div className="absolute right-0 top-full z-[9999] mt-2 min-w-[260px] rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-2xl backdrop-blur-xl overflow-y-auto max-h-[50vh]">
                {connected ? (
                  <>
                    <div className="px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                      Connected wallet
                    </div>
                    <div className="px-3 py-1 break-all text-[11px] text-[var(--foreground)]">
                      {walletAddress}
                    </div>
                    <div className="my-2 h-px bg-[var(--border)]" />
                    <button
                      onClick={handleDisconnect}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] text-[var(--accent-red)] transition hover:bg-[var(--accent-red-subtle)]"
                      type="button"
                    >
                      <span>&#x23FB;</span>
                      Disconnect Wallet
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                      Connect an Aptos wallet ({wallets.length} found)
                    </div>
                    <div className="my-1 h-px bg-[var(--border)]" />
                    {wallets.length > 0 ? (
                      wallets.slice(0, 5).map((wallet) => (
                        <button
                          key={wallet.name}
                          onClick={() => {
                            console.log("[Navbar] Wallet button clicked:", wallet.name);
                            void handleWalletConnect(wallet.name);
                          }}
                          disabled={isAuthenticating}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[11px] text-[var(--foreground)] transition hover:bg-[var(--surface-subtle-hover)] disabled:opacity-60"
                          type="button"
                        >
                          <WalletIcon />
                          {isAuthenticating ? "Verifying wallet..." : wallet.name}
                        </button>
                      ))
                    ) : (
                      <div className="rounded-lg border border-[var(--border-gold)] bg-[var(--accent-gold-subtle)] px-3 py-3 text-[11px] text-[var(--accent-gold)]">
                        No Aptos wallet was detected. Install Petra, Nightly, Backpack, OKX Wallet, or another Aptos-compatible wallet, then refresh.
                      </div>
                    )}
                    {walletError ? (
                      <div className="mt-2 rounded-lg border border-[var(--border-hover)] bg-[var(--accent-red-subtle)] px-3 py-2 text-[11px] text-[var(--error-text)]">
                        {walletError}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}
          </div>
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-3 sm:hidden">
          <ThemeToggle />
          <button
            onClick={() => setConnectDropdownOpen((open) => !open)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-[10px] text-[var(--foreground)] transition hover:border-[var(--accent-red)]"
            type="button"
          >
            <WalletIcon />
            {connected && walletAddress ? shortenWallet(walletAddress) : "Connect"}
          </button>
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {connectDropdownOpen ? (
        <div className="fixed inset-0 z-[45] bg-transparent sm:hidden" onClick={() => setConnectDropdownOpen(false)}>
          <div
            ref={mobileDropdownRef}
            className="fixed right-4 top-[68px] z-[46] min-w-[250px] rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-2xl backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {connected ? (
              <>
                <div className="px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                  Connected wallet
                </div>
                <div className="px-3 py-1 break-all text-[11px] text-[var(--foreground)]">
                  {walletAddress}
                </div>
                <div className="my-2 h-px bg-[var(--border)]" />
                <button
                  onClick={handleDisconnect}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] text-[var(--accent-red)] transition hover:bg-[var(--accent-red-subtle)]"
                  type="button"
                >
                  <span>&#x23FB;</span>
                  Disconnect Wallet
                </button>
              </>
            ) : (
              <>
                <div className="px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
                  Connect an Aptos wallet
                </div>
                <div className="my-1 h-px bg-[var(--border)]" />
                {wallets.length > 0 ? (
                  wallets.slice(0, 5).map((wallet) => (
                    <button
                      key={wallet.name}
                      onClick={() => void handleWalletConnect(wallet.name)}
                      disabled={isAuthenticating}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[11px] text-[var(--foreground)] transition hover:bg-[var(--surface-subtle-hover)] disabled:opacity-60"
                      type="button"
                    >
                      <WalletIcon />
                      {isAuthenticating ? "Verifying wallet..." : wallet.name}
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg border border-[var(--border-gold)] bg-[var(--accent-gold-subtle)] px-3 py-3 text-[11px] text-[var(--accent-gold)]">
                    No Aptos wallet was detected. Install Petra, Nightly, Backpack, OKX Wallet, or another Aptos-compatible wallet, then refresh.
                  </div>
                )}
                {walletError ? (
                  <div className="mt-2 rounded-lg border border-[var(--border-hover)] bg-[var(--accent-red-subtle)] px-3 py-2 text-[11px] text-[var(--error-text)]">
                    {walletError}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}

      {mobileMenuOpen ? (
        <>
          <div
            className="mobile-nav-overlay"
            style={{ display: "block" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="mobile-nav-drawer">
            <div style={{ marginBottom: 8, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)", marginBottom: 4 }}>
                Network
              </div>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-secondary)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-red)", display: "inline-block" }} />
                Testnet
              </span>
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`mobile-nav-link${isActive(link.href) ? " active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
