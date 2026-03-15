"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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

export function Navbar() {
  const pathname = usePathname();
  const { walletAddress, connected, connect, disconnect, wallets } =
    useWorkspaceWallet();
  const [googleLoading, setGoogleLoading] = useState(false);

  const isLanding = pathname === "/";
  const isApp = !isLanding;

  const navLinks = isApp
    ? [
        { href: "/", label: "Home" },
        { href: "/dashboard", label: "Dashboard" },
        { href: "/vault", label: "Vault" },
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

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      // Redirect to Google OAuth endpoint
      window.location.href = "/api/auth/google";
    } catch {
      setGoogleLoading(false);
    }
  }

  return (
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

        {/* Wallet connect */}
        {connected ? (
          <button
            onClick={() => void disconnect()}
            className="rounded-full border border-[rgba(255,255,255,0.07)] px-5 py-2 text-[11px] tracking-[0.05em] text-[#f0ede6] transition hover:border-[#c8392b] hover:bg-[rgba(200,57,43,0.08)]"
            type="button"
          >
            {shortenWallet(walletAddress)}
          </button>
        ) : wallets.length > 0 ? (
          <button
            onClick={() => void connect(wallets[0].name)}
            className="rounded-full border border-[rgba(255,255,255,0.07)] px-5 py-2 text-[11px] tracking-[0.05em] text-[#f0ede6] transition hover:border-[#c8392b] hover:bg-[rgba(200,57,43,0.08)]"
            type="button"
          >
            Connect Wallet
          </button>
        ) : (
          <span className="rounded-full border border-[rgba(255,255,255,0.07)] px-5 py-2 text-[11px] tracking-[0.05em] text-[#f0ede6]">
            {shortenWallet(walletAddress)}
          </span>
        )}

        {/* Google sign-in */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.07)] px-5 py-2 text-[11px] tracking-[0.05em] text-[#f0ede6] transition hover:border-[#c8392b] hover:bg-[rgba(200,57,43,0.08)]"
          type="button"
        >
          <GoogleIcon />
          {googleLoading ? "Signing in..." : "Google"}
        </button>
      </div>
    </nav>
  );
}
