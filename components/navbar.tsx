"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useWorkspaceWallet } from "@/components/wallet-status";
import { shortenWallet } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { walletAddress, connected, connect, disconnect, wallets } =
    useWorkspaceWallet();

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

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b border-[rgba(255,255,255,0.07)] bg-[rgba(10,10,10,0.85)] px-10 py-4 backdrop-blur-xl">
      <Link
        href="/"
        className="font-[family-name:var(--font-bebas-neue)] text-[22px] tracking-[0.15em] text-[#f0ede6]"
      >
        <span className="text-[#c8392b]">FLASH</span>FOLDER
      </Link>

      <div className="flex items-center gap-8">
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
      </div>
    </nav>
  );
}
