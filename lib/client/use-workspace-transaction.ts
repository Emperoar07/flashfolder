"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useState } from "react";

type WorkspaceOperation =
  | "folder_create"
  | "folder_rename"
  | "folder_delete"
  | "file_upload"
  | "file_delete"
  | "file_share"
  | "file_move"
  | "vault_verify"
  | "vault_upload"
  | "vault_share";

const OPERATION_COSTS: Record<WorkspaceOperation, number> = {
  folder_create: 100,      // 0.001 APT
  folder_rename: 50,       // 0.0005 APT
  folder_delete: 75,       // 0.00075 APT
  file_upload: 500,        // 0.005 APT
  file_delete: 100,        // 0.001 APT
  file_share: 200,         // 0.002 APT
  file_move: 150,          // 0.0015 APT
  vault_verify: 100,       // 0.001 APT – on-chain ownership check
  vault_upload: 500,       // 0.005 APT – encrypted vault upload
  vault_share: 200,        // 0.002 APT – collector share creation
};

export function useWorkspaceTransaction() {
  const { signAndSubmitTransaction, connected, account } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitTransaction(operation: WorkspaceOperation) {
    if (!connected || !account) {
      throw new Error("Wallet not connected");
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const network = (process.env.NEXT_PUBLIC_APTOS_NETWORK ?? "testnet").toLowerCase();
      const networkEnum = network === "mainnet" ? Network.MAINNET :
                          network === "devnet" ? Network.DEVNET :
                          Network.TESTNET;

      const aptos = new Aptos(new AptosConfig({ network: networkEnum }));
      const cost = OPERATION_COSTS[operation];

      // Submit via wallet adapter using InputTransactionData format
      // Use string address directly instead of AccountAddress.from() to avoid mobile parsing issues
      const response = await signAndSubmitTransaction({
        data: {
          function: "0x1::coin::transfer",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [
            "0x0000000000000000000000000000000000000000000000000000000000000fee",
            cost.toString(),
          ],
        },
      });

      // Wait for transaction confirmation
      await aptos.waitForTransaction({
        transactionHash: response.hash,
      });

      setIsSubmitting(false);
      return { success: true, txHash: response.hash };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction failed";
      setError(message);
      setIsSubmitting(false);
      throw err;
    }
  }

  return {
    submitTransaction,
    isSubmitting,
    error,
  };
}
