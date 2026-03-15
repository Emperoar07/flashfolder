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
    isDemo,
    lastError,
    walletAddress,
    wallets,
  } = useWorkspaceWallet();
  const walletError = authError ?? lastError;

  return (
    <div className="flex flex-col items-end gap-3">
      {walletError ? (
        <div className="max-w-sm rounded-2xl border border-[rgba(200,57,43,0.28)] bg-[rgba(200,57,43,0.12)] px-4 py-3 text-right text-sm text-[#ffb4ac]">
          {walletError}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="rounded-full border border-[rgba(255,255,255,0.07)] bg-[#111] px-4 py-2 text-sm text-[rgba(240,237,230,0.55)]">
        {isDemo ? "Demo workspace" : "Wallet live"}:{" "}
        <span className="font-semibold text-[#f0ede6]">
          {shortenWallet(walletAddress)}
        </span>
      </div>
      {connected ? (
        <button
          className="inline-flex items-center gap-2 rounded-full bg-[#c8392b] px-4 py-2 text-sm font-medium text-[#f0ede6]"
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
            className="inline-flex items-center gap-2 rounded-full bg-[#c8392b] px-4 py-2 text-sm font-medium text-[#f0ede6]"
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
        <div className="rounded-full border border-[rgba(184,160,106,0.2)] bg-[rgba(184,160,106,0.08)] px-4 py-2 text-sm text-[#b8a06a]">
          Install an Aptos wallet to replace demo mode.
        </div>
      ) : null}
      </div>
    </div>
  );
}
