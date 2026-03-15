"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { useState } from "react";

export function useSharePurchase() {
  const { signAndSubmitTransaction, connected, account } = useWallet();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function purchaseDownload(params: {
    shareToken: string;
    sharerWallet: string;
    priceApt: number;
  }) {
    if (!connected || !account) {
      throw new Error("Wallet not connected");
    }

    setIsPurchasing(true);
    setError(null);

    try {
      const network = (process.env.NEXT_PUBLIC_APTOS_NETWORK ?? "testnet").toLowerCase();
      const networkEnum = network === "mainnet" ? Network.MAINNET :
                          network === "devnet" ? Network.DEVNET :
                          Network.TESTNET;

      const aptos = new Aptos(new AptosConfig({ network: networkEnum }));

      // Convert APT to octas (1 APT = 100,000,000 octas)
      const octasAmount = Math.floor(params.priceApt * 100_000_000);

      // Submit payment transaction
      const response = await signAndSubmitTransaction({
        data: {
          function: "0x1::coin::transfer",
          typeArguments: ["0x1::aptos_coin::AptosCoin"],
          functionArguments: [
            params.sharerWallet,
            octasAmount.toString(),
          ],
        },
      });

      // Wait for transaction confirmation
      await aptos.waitForTransaction({
        transactionHash: response.hash,
      });

      // Call purchase API to record the payment
      const purchaseResponse = await fetch(`/api/share/${params.shareToken}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash: response.hash,
          buyerWallet: String(account.address),
        }),
      });

      if (!purchaseResponse.ok) {
        const errData = await purchaseResponse.json() as { error?: string };
        throw new Error(errData.error ?? "Purchase failed");
      }

      const purchaseData = await purchaseResponse.json() as {
        success: boolean;
        downloadId: string;
      };

      setIsPurchasing(false);
      return {
        success: true,
        txHash: response.hash,
        downloadId: purchaseData.downloadId,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Purchase failed";
      setError(message);
      setIsPurchasing(false);
      throw err;
    }
  }

  return {
    purchaseDownload,
    isPurchasing,
    error,
  };
}
