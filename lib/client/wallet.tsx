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
import type {
  AuthSessionPayload,
  WalletChallengePayload,
  WalletChallengeVerifyPayload,
} from "@/lib/types";

const walletErrorEvent = "flashfolder:wallet-error";

type WalletErrorDetail = {
  message: string;
};

type WalletRuntimeContextValue = {
  account: ReturnType<typeof useWallet>["account"];
  authError: string | null;
  authMode: AuthSessionPayload["session"]["authMode"];
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
  
  // Debug logging
  console.debug("[Wallet Provider] useWallet hook state:", {
    walletCount: wallets.length,
    connected,
    isLoading,
    accountAddress: account?.address?.toString(),
  });
  
  const [lastError, setLastError] = useState<string | null>(null);
  const [authSession, setAuthSession] = useState<AuthSessionPayload | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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

  const walletAddress = account?.address?.toString() ?? authSession?.user.walletAddress ?? "";
  const isDemo = false;
  const network = process.env.NEXT_PUBLIC_APTOS_NETWORK ?? "testnet";

  async function connect(walletName: string) {
    console.debug("[Wallet Provider] Connect called with wallet:", walletName);
    setLastError(null);

    try {
      await adapterConnect(walletName);
      console.debug("[Wallet Provider] Connect successful");
    } catch (error) {
      const message = getReadableWalletError(error);
      console.debug("[Wallet Provider] Connect failed:", message);
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
    const publicKeyStr = account.publicKey.toString();
    const currentPublicKey = publicKeyStr.startsWith("0x") ? publicKeyStr : `0x${publicKeyStr}`;
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

        const signed = await signMessage({
          address: true,
          application: true,
          chainId: true,
          message: challengePayload.challenge.message,
          nonce: challengePayload.challenge.challengeId,
        });

        // Format signature as hex string (handle multiple formats)
        let signatureHex = "";
        const sig = signed.signature as unknown;
        if (typeof sig === "string") {
          signatureHex = sig.startsWith("0x") ? sig : `0x${sig}`;
        } else if (sig instanceof Uint8Array) {
          signatureHex = `0x${Array.from(sig).map(b => b.toString(16).padStart(2, "0")).join("")}`;
        } else if (sig && typeof (sig as any).toString === "function") {
          const str = (sig as any).toString();
          signatureHex = str.startsWith("0x") ? str : `0x${str}`;
        } else {
          signatureHex = `0x${String(sig)}`;
        }

        // Format fullMessage as string (handle both string and Uint8Array)
        let fullMessageStr = "";
        const fullMsg = signed.fullMessage as unknown;
        if (typeof fullMsg === "string") {
          fullMessageStr = fullMsg;
        } else if (fullMsg instanceof Uint8Array) {
          fullMessageStr = new TextDecoder().decode(fullMsg);
        } else {
          fullMessageStr = String(fullMsg);
        }

        const verificationInput: WalletChallengeVerifyPayload = {
          walletAddress: currentWalletAddress,
          challengeId: challengePayload.challenge.challengeId,
          signature: signatureHex,
          publicKey: currentPublicKey,
          fullMessage: fullMessageStr,
          signedAddress: signed.address,
        };

        // Debug log
        console.debug("[Wallet] Verification payload prepared", {
          signature_length: signatureHex.length,
          publicKey_length: currentPublicKey.length,
          fullMessage_length: fullMessageStr.length,
          signedAddress: signed.address,
        });

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
    authMode: authSession?.session.authMode ?? "challenge",
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
