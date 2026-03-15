"use client";

import { Wallet, X } from "lucide-react";

import {
  useWalletAddress,
  useWalletAuth,
  useWalletConnection,
  useWalletNetwork,
} from "@/lib/client/wallet";
import { shortenWallet } from "@/lib/utils";

export function useWorkspaceWallet() {
  const {
    connect,
    connected,
    disconnect,
    isLoading,
    lastError,
    wallets,
  } = useWalletConnection();
  const { walletAddress, isDemo } = useWalletAddress();
  const { network } = useWalletNetwork();
  const { authError, authMode, authSession, isAuthenticated, isAuthenticating } =
    useWalletAuth();

  return {
    authError,
    authMode,
    authSession,
    walletAddress,
    connected,
    connect,
    disconnect,
    isAuthenticated,
    isAuthenticating,
    isLoading,
    lastError,
    wallets,
    isDemo,
    network,
  };
}

export function WalletStatus() {
  const {
    connected,
    connect,
    disconnect,
    authError,
    isAuthenticating,
    isLoading,
    lastError,
    walletAddress,
    wallets,
  } = useWorkspaceWallet();
  const walletError = authError ?? lastError;

  return (
    <div className="flex flex-col items-end gap-3">
      {walletError ? (
        <div className="max-w-sm rounded-2xl border border-[var(--border-hover)] bg-[var(--accent-red-subtle)] px-4 py-3 text-right text-sm text-[var(--error-text)]">
          {walletError}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--text-secondary)]">
        Wallet:{" "}
        <span className="font-semibold text-[var(--foreground)]">
          {walletAddress ? shortenWallet(walletAddress) : "Not connected"}
        </span>
      </div>
      {connected ? (
        <button
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-red)] px-4 py-2 text-sm font-medium text-[var(--foreground)]"
          onClick={() => void disconnect()}
          type="button"
        >
          <X className="h-4 w-4" />
          Disconnect
        </button>
      ) : (
        wallets.slice(0, 2).map((wallet) => (
          <button
            key={wallet.name}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-red)] px-4 py-2 text-sm font-medium text-[var(--foreground)]"
            disabled={isLoading || isAuthenticating}
            onClick={() => void connect(wallet.name)}
            type="button"
          >
            <Wallet className="h-4 w-4" />
            {isAuthenticating ? "Verifying..." : wallet.name}
          </button>
        ))
      )}
      {!connected && wallets.length === 0 ? (
        <div className="rounded-full border border-[var(--border-gold)] bg-[var(--accent-gold-subtle)] px-4 py-2 text-sm text-[var(--accent-gold)]">
          Install an Aptos wallet to connect on testnet.
        </div>
      ) : null}
      </div>
    </div>
  );
}
