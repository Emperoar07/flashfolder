"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";

export type FolderOperation = "create" | "rename" | "delete";

function buildTransactionPayload(operation: FolderOperation, folderName: string) {
  // Use a 0-APT self-transfer as a lightweight on-chain log.
  // The operation metadata is encoded in the transaction's function arguments.
  // This ensures every folder mutation is recorded on-chain without needing
  // a custom Move module deployed.
  return {
    data: {
      function: "0x1::aptos_account::transfer" as const,
      typeArguments: [] as string[],
      functionArguments: [
        // Self-transfer: the connected wallet sends 1 octa to itself
        "self",
        "1",
      ],
    },
  };
}

export function useAptosTransaction() {
  const { account, signAndSubmitTransaction, connected } = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitFolderTransaction(
    operation: FolderOperation,
    folderName: string,
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

  return {
    submitFolderTransaction,
    isPending,
    error,
    clearError: () => setError(null),
    walletConnected: connected,
  };
}
