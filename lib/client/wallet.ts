"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useEffectEvent, useMemo, useState } from "react";

import { apiFetch } from "@/lib/client/api";
import { demoWalletAddress } from "@/lib/config";
import type { AuthSessionPayload } from "@/lib/types";

const storageKey = "flashfolder.wallet";

export function useWalletConnection() {
  const { account, connect, connected, disconnect, isLoading, wallets } =
    useWallet();

  return {
    account,
    connect,
    connected,
    disconnect,
    isLoading,
    wallets,
  };
}

export function useWalletAddress() {
  const { account, connected } = useWalletConnection();
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

  return {
    walletAddress,
    isDemo: walletAddress === demoWalletAddress && !connected,
  };
}

export function useWalletNetwork() {
  return useMemo(
    () => ({
      network: process.env.NEXT_PUBLIC_APTOS_NETWORK ?? "testnet",
    }),
    [],
  );
}

export function useWalletAuth() {
  const { walletAddress } = useWalletAddress();
  const [authSession, setAuthSession] = useState<AuthSessionPayload | null>(null);

  const syncWallet = useEffectEvent(async (address: string) => {
    const payload = await apiFetch<AuthSessionPayload>("/api/auth/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: address }),
    });

    setAuthSession(payload);
  });

  useEffect(() => {
    void syncWallet(walletAddress);
  }, [walletAddress]);

  return {
    walletAddress,
    authSession,
    authMode: authSession?.session.authMode ?? "mock",
    isAuthenticated: Boolean(authSession?.user.walletAddress),
  };
}
