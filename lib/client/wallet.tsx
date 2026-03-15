"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { apiFetch } from "@/lib/client/api";
import { demoWalletAddress } from "@/lib/config";
import type {
  AuthSessionPayload,
  WalletChallengePayload,
  WalletChallengeVerifyPayload,
} from "@/lib/types";

const storageKey = "flashfolder.wallet";
const walletErrorEvent = "flashfolder:wallet-error";

type WalletErrorDetail = {
  message: string;
};

type WalletRuntimeContextValue = {
  account: ReturnType<typeof useWallet>["account"];
  authError: string | null;
  authMode: AuthSessionPayload["session"]["authMode"] | "mock";
  authSession: AuthSessionPayload | null;
  connect: (walletName: string) => Promise<void>;
  connected: boolean;
  disconnect: () => Promise<void>;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  isDemo: boolean;
  isLoading: boolean;
  lastError: string | null;
  network: string;
  setLastError: (message: string | null) => void;
  signMessage: ReturnType<typeof useWallet>["signMessage"];
  walletAddress: string;
  wallets: ReturnType<typeof useWallet>["wallets"];
};

const WalletRuntimeContext = createContext<WalletRuntimeContextValue | null>(null);

function isPersistedEmailIdentity(value: string | null) {
  return Boolean(value && value.startsWith("email:"));
}

function getReadableWalletError(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Wallet connection failed. Check that your Aptos wallet is installed, unlocked, and allowed on this site.";
}

export function reportWalletError(error: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<WalletErrorDetail>(walletErrorEvent, {
      detail: { message: getReadableWalletError(error) },
    }),
  );
}

function useWalletRuntimeValue(): WalletRuntimeContextValue {
  const {
    account,
    connect: adapterConnect,
    connected,
    disconnect: adapterDisconnect,
    isLoading,
    signMessage,
    wallets,
  } = useWallet();
  const [lastError, setLastError] = useState<string | null>(null);
  const [authSession, setAuthSession] = useState<AuthSessionPayload | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [fallbackWallet] = useState(() => {
    if (typeof window === "undefined") {
      return demoWalletAddress;
    }

    const persisted = window.localStorage.getItem(storageKey);
    if (!persisted || isPersistedEmailIdentity(persisted)) {
      return demoWalletAddress;
    }

    return persisted;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleWalletError = (event: Event) => {
      const detail = (event as CustomEvent<WalletErrorDetail>).detail;
      setLastError(detail?.message ?? "Wallet connection failed.");
    };

    window.addEventListener(walletErrorEvent, handleWalletError);
    return () => window.removeEventListener(walletErrorEvent, handleWalletError);
  }, []);

  useEffect(() => {
    if (account?.address) {
      window.localStorage.setItem(storageKey, account.address.toString());
    }
  }, [account?.address]);

  const walletAddress = account?.address?.toString() ?? fallbackWallet;
  const isDemo = walletAddress === demoWalletAddress && !connected;
  const network = process.env.NEXT_PUBLIC_APTOS_NETWORK ?? "testnet";

  async function connect(walletName: string) {
    setLastError(null);

    try {
      await adapterConnect(walletName);
    } catch (error) {
      const message = getReadableWalletError(error);
      setLastError(message);
      reportWalletError(error);
      throw error;
    }
  }

  async function disconnect() {
    setLastError(null);
    setAuthError(null);
    setAuthSession(null);
    await adapterDisconnect();
  }

  useEffect(() => {
    if (!connected || !account?.address || !account.publicKey) {
      setAuthSession(null);
      setAuthError(null);
      return;
    }

    const currentWalletAddress = account.address.toString();
    const currentPublicKey = account.publicKey.toString();
    const activeSession = authSession?.session;
    const isCurrentSessionFresh =
      authSession?.user.walletAddress === currentWalletAddress &&
      activeSession &&
      new Date(activeSession.expiresAt).getTime() > Date.now();

    if (isCurrentSessionFresh) {
      return;
    }

    let cancelled = false;

    async function syncWallet() {
      setIsAuthenticating(true);
      setAuthError(null);

      try {
        const challengePayload = await apiFetch<WalletChallengePayload>(
          "/api/auth/challenge",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress: currentWalletAddress }),
          },
          currentWalletAddress,
        );

        if (challengePayload.auth.mode === "mock") {
          const payload = await apiFetch<AuthSessionPayload>("/api/auth/wallet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress: currentWalletAddress }),
          });

          if (!cancelled) {
            setAuthSession(payload);
          }
          return;
        }

        const signed = await signMessage({
          address: true,
          application: true,
          chainId: true,
          message: challengePayload.challenge.message,
          nonce: challengePayload.challenge.challengeId,
        });
        const verificationInput: WalletChallengeVerifyPayload = {
          walletAddress: currentWalletAddress,
          challengeId: challengePayload.challenge.challengeId,
          signature: signed.signature.toString(),
          publicKey: currentPublicKey,
          fullMessage: signed.fullMessage,
          signedAddress: signed.address,
        };
        const payload = await apiFetch<AuthSessionPayload>("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(verificationInput),
        });

        if (!cancelled) {
          setAuthSession(payload);
        }
      } catch (error) {
        const message = getReadableWalletError(error);
        if (!cancelled) {
          setAuthSession(null);
          setAuthError(message);
        }
        reportWalletError(error);
      } finally {
        if (!cancelled) {
          setIsAuthenticating(false);
        }
      }
    }

    void syncWallet();

    return () => {
      cancelled = true;
    };
  }, [account, authSession, connected, signMessage]);

  return {
    account,
    authError,
    authMode: authSession?.session.authMode ?? "mock",
    authSession,
    connect,
    connected,
    disconnect,
    isAuthenticated: Boolean(authSession?.user.walletAddress),
    isAuthenticating,
    isDemo,
    isLoading,
    lastError,
    network,
    setLastError,
    signMessage,
    walletAddress,
    wallets,
  };
}

export function FlashFolderWalletProvider({ children }: { children: ReactNode }) {
  const value = useWalletRuntimeValue();

  return (
    <WalletRuntimeContext.Provider value={value}>
      {children}
    </WalletRuntimeContext.Provider>
  );
}

function useWalletRuntime() {
  const context = useContext(WalletRuntimeContext);

  if (!context) {
    throw new Error("Wallet hooks must be used inside FlashFolderWalletProvider.");
  }

  return context;
}

export function useWalletConnection() {
  const {
    account,
    connect,
    connected,
    disconnect,
    isLoading,
    lastError,
    setLastError,
    signMessage,
    wallets,
  } = useWalletRuntime();

  return {
    account,
    connect,
    connected,
    disconnect,
    isLoading,
    lastError,
    setLastError,
    signMessage,
    wallets,
  };
}

export function useWalletAddress() {
  const { isDemo, walletAddress } = useWalletRuntime();

  return {
    walletAddress,
    isDemo,
  };
}

export function useWalletNetwork() {
  const { network } = useWalletRuntime();

  return { network };
}

export function useWalletAuth() {
  const {
    authError,
    authMode,
    authSession,
    isAuthenticated,
    isAuthenticating,
    walletAddress,
  } = useWalletRuntime();

  return {
    walletAddress,
    authError,
    authSession,
    authMode,
    isAuthenticated,
    isAuthenticating,
  };
}
