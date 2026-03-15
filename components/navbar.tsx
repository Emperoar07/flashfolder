"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useWorkspaceWallet } from "@/components/wallet-status";
import { shortenWallet } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

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
  const { walletAddress, connected, connect, disconnect, wallets, isDemo } =
    useWorkspaceWallet();
  const [connectDropdownOpen, setConnectDropdownOpen] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googlePassword, setGooglePassword] = useState("");
  const [googleMode, setGoogleMode] = useState<"signin" | "signup">("signin");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect if logged in via email (stored in localStorage)
  const [emailUser, setEmailUser] = useState<string | null>(null);
  useEffect(() => {
    const stored = localStorage.getItem("flashfolder.wallet");
    if (stored?.startsWith("email:")) {
      setEmailUser(stored.replace("email:", ""));
    }
  }, []);

  const isLoggedIn = connected || !!emailUser;
  const displayName = connected
    ? shortenWallet(walletAddress)
    : emailUser
      ? emailUser.length > 20 ? emailUser.slice(0, 18) + "..." : emailUser
      : null;
  const connectionType: "wallet" | "email" | null = connected ? "wallet" : emailUser ? "email" : null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setConnectDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setGoogleModalOpen(false);
        setConnectDropdownOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const isLanding = pathname === "/";
  const isApp = !isLanding;

  const navLinks = isApp
    ? [
        { href: "/", label: "Home" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/vault", label: "Vault" },
        ...(isLoggedIn ? [{ href: "/share", label: "Share" }] : []),
        { href: "/settings", label: "Settings" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/vault", label: "Vault" },
      ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  function handleDisconnect() {
    setConnectDropdownOpen(false);
    if (connected) {
      void disconnect();
    }
    if (emailUser) {
      localStorage.removeItem("flashfolder.wallet");
      document.cookie = "ff_session=; path=/; max-age=0";
      document.cookie = "ff_wallet=; path=/; max-age=0";
      setEmailUser(null);
      window.location.reload();
    }
  }

  async function handleGoogleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGoogleLoading(true);
    setGoogleError(null);

    try {
      const endpoint = googleMode === "signup" ? "/api/auth/google/register" : "/api/auth/google/login";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: googleEmail, password: googlePassword }),
      });

      const data = await res.json() as { error?: string; wallet?: string };

      if (!res.ok) {
        setGoogleError(data.error ?? "Authentication failed.");
        return;
      }

      if (data.wallet) {
        localStorage.setItem("flashfolder.wallet", data.wallet);
      }
      setGoogleModalOpen(false);
      window.location.reload();
    } catch {
      setGoogleError("Network error. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  }

  const btnClass =
    "rounded-full border border-[rgba(255,255,255,0.07)] px-5 py-2 text-[11px] tracking-[0.05em] text-[#f0ede6] transition hover:border-[#c8392b] hover:bg-[rgba(200,57,43,0.08)]";

  return (
    <>
      <nav className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b border-[rgba(255,255,255,0.07)] bg-[rgba(10,10,10,0.85)] px-10 py-4 backdrop-blur-xl">
        <Link
          href="/"
          className="font-[family-name:var(--font-bebas-neue)] text-[22px] tracking-[0.15em] text-[#f0ede6]"
        >
          <span className="text-[#c8392b]">FLASH</span>FOLDER
        </Link>

        <div className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative text-[10px] uppercase tracking-[0.2em] transition-colors ${
                isActive(link.href)
                  ? "text-[#c8392b]"
                  : "text-[rgba(240,237,230,0.55)] hover:text-[#c8392b]"
              }`}
            >
              {link.label}
              {isActive(link.href) ? (
                <span className="absolute -bottom-1.5 left-0 right-0 h-px bg-[#c8392b]" />
              ) : null}
            </Link>
          ))}

          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[rgba(240,237,230,0.35)]">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#c8392b]" />
            Testnet
          </span>

          {/* Single connect button / account dropdown */}
          <div className="relative" ref={dropdownRef}>
            {isLoggedIn ? (
              /* ── Connected state: show identity, click for dropdown ── */
              <button
                onClick={() => setConnectDropdownOpen((o) => !o)}
                className={`inline-flex items-center gap-2 ${btnClass}`}
                type="button"
              >
                {connectionType === "wallet" ? <WalletIcon /> : <GoogleIcon />}
                {displayName}
              </button>
            ) : (
              /* ── Not connected: single "Connect" button opens method picker ── */
              <button
                onClick={() => setConnectDropdownOpen((o) => !o)}
                className={btnClass}
                type="button"
              >
                Connect
              </button>
            )}

            {/* Dropdown */}
            {connectDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 min-w-[240px] rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#111] p-2 shadow-2xl backdrop-blur-xl">
                {isLoggedIn ? (
                  /* ── Logged-in dropdown: show info + disconnect ── */
                  <>
                    <div className="px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-[rgba(240,237,230,0.35)]">
                      {connectionType === "wallet" ? "Connected wallet" : "Signed in as"}
                    </div>
                    <div className="px-3 py-1 text-[11px] text-[#f0ede6] break-all">
                      {connectionType === "wallet" ? walletAddress : emailUser}
                    </div>
                    <div className="my-2 h-px bg-[rgba(255,255,255,0.07)]" />
                    <button
                      onClick={handleDisconnect}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] text-[#c8392b] transition hover:bg-[rgba(200,57,43,0.08)]"
                      type="button"
                    >
                      <span>&#x23FB;</span>
                      {connectionType === "wallet" ? "Disconnect Wallet" : "Sign Out"}
                    </button>
                  </>
                ) : (
                  /* ── Not logged-in dropdown: choose connection method ── */
                  <>
                    <div className="px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-[rgba(240,237,230,0.35)]">
                      Choose connection method
                    </div>
                    <div className="my-1 h-px bg-[rgba(255,255,255,0.07)]" />

                    {/* Wallet option */}
                    {wallets.length > 0 ? (
                      wallets.slice(0, 3).map((wallet) => (
                        <button
                          key={wallet.name}
                          onClick={() => {
                            setConnectDropdownOpen(false);
                            void connect(wallet.name);
                          }}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[11px] text-[#f0ede6] transition hover:bg-[rgba(255,255,255,0.05)]"
                          type="button"
                        >
                          <WalletIcon />
                          {wallet.name}
                        </button>
                      ))
                    ) : (
                      <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[11px] text-[rgba(240,237,230,0.35)]">
                        <WalletIcon />
                        No wallet detected
                      </div>
                    )}

                    <div className="my-1 h-px bg-[rgba(255,255,255,0.07)]" />

                    {/* Google/Email option */}
                    <button
                      onClick={() => {
                        setConnectDropdownOpen(false);
                        setGoogleModalOpen(true);
                        setGoogleError(null);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[11px] text-[#f0ede6] transition hover:bg-[rgba(255,255,255,0.05)]"
                      type="button"
                    >
                      <GoogleIcon />
                      Sign in with Google / Email
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Google sign-in / sign-up modal */}
      {googleModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(0,0,0,0.7)] backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setGoogleModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-[400px] rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[#111] p-8 shadow-2xl">
            <button
              onClick={() => setGoogleModalOpen(false)}
              className="absolute right-4 top-4 text-[rgba(240,237,230,0.35)] transition hover:text-[#f0ede6]"
              type="button"
            >
              &#x2715;
            </button>

            <div className="text-center">
              <h2 className="font-[family-name:var(--font-bebas-neue)] text-[28px] tracking-[0.1em] text-[#f0ede6]">
                <span className="text-[#c8392b]">FLASH</span>FOLDER
              </h2>
              <p className="mt-1 text-[12px] text-[rgba(240,237,230,0.45)]">
                {googleMode === "signin" ? "Sign in with your account" : "Create a new account"}
              </p>
            </div>

            <div className="mt-6 flex rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-1">
              <button
                type="button"
                onClick={() => { setGoogleMode("signin"); setGoogleError(null); }}
                className={`flex-1 rounded-lg py-2 text-[10px] uppercase tracking-[0.15em] transition ${
                  googleMode === "signin"
                    ? "bg-[#c8392b] text-[#f0ede6]"
                    : "text-[rgba(240,237,230,0.45)] hover:text-[#f0ede6]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setGoogleMode("signup"); setGoogleError(null); }}
                className={`flex-1 rounded-lg py-2 text-[10px] uppercase tracking-[0.15em] transition ${
                  googleMode === "signup"
                    ? "bg-[#c8392b] text-[#f0ede6]"
                    : "text-[rgba(240,237,230,0.45)] hover:text-[#f0ede6]"
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleGoogleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-[rgba(240,237,230,0.35)] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#0a0a0a] px-4 py-3 text-[13px] text-[#f0ede6] outline-none placeholder:text-[rgba(240,237,230,0.25)] focus:border-[#c8392b] transition"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.15em] text-[rgba(240,237,230,0.35)] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={googlePassword}
                  onChange={(e) => setGooglePassword(e.target.value)}
                  placeholder={googleMode === "signup" ? "Min 6 characters" : "Enter password"}
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#0a0a0a] px-4 py-3 text-[13px] text-[#f0ede6] outline-none placeholder:text-[rgba(240,237,230,0.25)] focus:border-[#c8392b] transition"
                />
              </div>

              {googleError && (
                <div className="rounded-lg bg-[rgba(200,57,43,0.12)] border border-[rgba(200,57,43,0.3)] px-4 py-2 text-[12px] text-[#c8392b]">
                  {googleError}
                </div>
              )}

              <button
                type="submit"
                disabled={googleLoading}
                className="w-full rounded-xl bg-[#c8392b] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#f0ede6] transition hover:bg-[#a82d22] disabled:opacity-50"
              >
                {googleLoading
                  ? "Please wait..."
                  : googleMode === "signin"
                    ? "Sign In"
                    : "Create Account"}
              </button>
            </form>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.07)]" />
              <span className="text-[10px] text-[rgba(240,237,230,0.25)] uppercase tracking-[0.1em]">or</span>
              <div className="flex-1 h-px bg-[rgba(255,255,255,0.07)]" />
            </div>

            <button
              type="button"
              onClick={() => { window.location.href = "/api/auth/google"; }}
              className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[12px] text-[#f0ede6] transition hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.06)]"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </div>
        </div>
      )}
    </>
  );
}
