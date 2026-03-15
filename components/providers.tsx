"use client";

import { Network } from "@aptos-labs/ts-sdk";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
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

  return (
    <AptosWalletAdapterProvider
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
