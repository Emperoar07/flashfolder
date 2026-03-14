"use client";

import { Wallet, X } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";

import { apiFetch } from "@/lib/client/api";
import { demoWalletAddress } from "@/lib/config";
import { shortenWallet } from "@/lib/utils";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const storageKey = "flashfolder.wallet";

export function useWorkspaceWallet() {
  const { account, connect, connected, disconnect, isLoading, wallets } =
    useWallet();
  const [fallbackWallet] = useState(() => {
    if (typeof window === "undefined") {
      return demoWalletAddress;
    }

    return window.localStorage.getItem(storageKey) ?? demoWalletAddress;
  });

  useEffect(() => {
    if (account?.address) {
      window.localStorage.setItem(storageKey, account.address.toString());
    }
  }, [account?.address]);

  const walletAddress = account?.address?.toString() ?? fallbackWallet;

  const syncWallet = useEffectEvent(async (address: string) => {
    await apiFetch("/api/auth/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: address }),
    });
  });

  useEffect(() => {
    void syncWallet(walletAddress);
  }, [walletAddress]);

  return {
    walletAddress,
    connected,
    connect,
    disconnect,
    isLoading,
    wallets,
    isDemo: walletAddress === demoWalletAddress && !connected,
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
