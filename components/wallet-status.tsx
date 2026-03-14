"use client";

import { Wallet, X } from "lucide-react";

import {
  useWalletAddress,
  useWalletConnection,
  useWalletNetwork,
} from "@/lib/client/wallet";
import { shortenWallet } from "@/lib/utils";

export function useWorkspaceWallet() {
  const { connect, connected, disconnect, isLoading, wallets } = useWalletConnection();
  const { walletAddress, isDemo } = useWalletAddress();
  const { network } = useWalletNetwork();

  return {
    walletAddress,
    connected,
    connect,
    disconnect,
    isLoading,
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
    isLoading,
    isDemo,
    walletAddress,
    wallets,
  } = useWorkspaceWallet();

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
        {isDemo ? "Demo workspace" : "Wallet live"}:{" "}
        <span className="font-semibold text-slate-900">
          {shortenWallet(walletAddress)}
        </span>
      </div>
      {connected ? (
        <button
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white"
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
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white"
            disabled={isLoading}
            onClick={() => void connect(wallet.name)}
            type="button"
          >
            <Wallet className="h-4 w-4" />
            {wallet.name}
          </button>
        ))
      )}
      {!connected && wallets.length === 0 ? (
        <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Install an Aptos wallet to replace demo mode.
        </div>
      ) : null}
    </div>
  );
}
