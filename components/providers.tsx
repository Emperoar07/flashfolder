"use client";

import { Network } from "@aptos-labs/ts-sdk";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { MartianWallet } from "@martianwallet/aptos-wallet-adapter";
import { OKXWallet } from "okx-wallet-adapter";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { PontemWallet } from "@pontem/wallet-adapter-plugin";
import { RiseWallet } from "@rise-wallet/wallet-adapter";
import { TrustWallet } from "@trustwallet/aptos-wallet-adapter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { FlashFolderWalletProvider, reportWalletError } from "@/lib/client/wallet";

type ProvidersProps = {
  children: React.ReactNode;
};

function resolveNetwork() {
  const network = process.env.NEXT_PUBLIC_APTOS_NETWORK?.toUpperCase();

  switch (network) {
    case "MAINNET":
      return Network.MAINNET;
    case "DEVNET":
      return Network.DEVNET;
    default:
      return Network.TESTNET;
  }
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [wallets] = useState(() => [
    new PetraWallet(),
    new MartianWallet(),
    new OKXWallet(),
    new PontemWallet(),
    new RiseWallet(),
    new TrustWallet(),
  ]);

  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={false}
      disableTelemetry
      dappConfig={{ network: resolveNetwork() }}
      onError={(error) => {
        console.debug("FlashFolder wallet provider error", error);
        reportWalletError(error);
      }}
    >
      <FlashFolderWalletProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </FlashFolderWalletProvider>
    </AptosWalletAdapterProvider>
  );
}
