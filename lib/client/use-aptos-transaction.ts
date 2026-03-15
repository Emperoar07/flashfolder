"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";

export type WorkspaceOperation =
  | "folder_create"
  | "folder_rename"
  | "folder_delete"
  | "file_upload"
  | "file_delete"
  | "file_share";

export function useAptosTransaction() {
  const { account, signAndSubmitTransaction, connected } = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitTransaction(
    operation: WorkspaceOperation,
    label: string,
  ): Promise<string | null> {
    if (!connected || !account?.address) {
      setError("Wallet not connected. Connect your wallet to perform this action.");
      return null;
    }

    setIsPending(true);
    setError(null);

    try {
      const response = await signAndSubmitTransaction({
        data: {
          function: "0x1::aptos_account::transfer",
          typeArguments: [],
          functionArguments: [account.address.toString(), 1],
        },
      });

      setIsPending(false);
      // The response contains the transaction hash
      return (response as { hash?: string }).hash ?? JSON.stringify(response);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Transaction rejected or failed.";
      setError(message);
      setIsPending(false);
      return null;
    }
  }

  // Backward-compatible alias
  const submitFolderTransaction = submitTransaction;

  return {
    submitTransaction,
    submitFolderTransaction,
    isPending,
    error,
    clearError: () => setError(null),
    walletConnected: connected,
  };
}
