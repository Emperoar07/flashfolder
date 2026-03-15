import type {
  AptosRuntimeStatus,
  NormalizedNftAsset,
  NftOwnershipVerificationResult,
} from "@/lib/aptos/types";
import { appConfig } from "@/lib/config";
import { AptosIntegrationError } from "@/lib/server/aptos/errors";
import { indexerAptosNftProvider } from "@/lib/server/aptos/indexer-provider";
import { mockAptosNftProvider } from "@/lib/server/aptos/mock-provider";
import type { AptosNftProvider } from "@/lib/server/aptos/provider";

export function getAptosNftProvider(): AptosNftProvider {
  if (appConfig.aptos.mockEnabled) {
    return mockAptosNftProvider;
  }

  // Use real Aptos Indexer provider — works with default public indexer URLs
  // even without explicit APTOS_INDEXER_URL configured
  return indexerAptosNftProvider;
}

export function getAptosRuntimeStatus(): AptosRuntimeStatus {
  try {
    return getAptosNftProvider().status;
  } catch (error) {
    if (error instanceof AptosIntegrationError) {
      return {
        network: appConfig.aptos.network,
        integrationState: "scaffolded",
        source: "aptos_indexer",
        mockEnabled: appConfig.aptos.mockEnabled,
        fullnodeConfigured: Boolean(appConfig.aptos.fullnodeUrl),
        indexerConfigured: Boolean(appConfig.aptos.indexerUrl),
        authMode: appConfig.aptos.authMode,
        notes: error.message,
      };
    }

    throw error;
  }
}

export async function getOwnedNfts(walletAddress: string): Promise<NormalizedNftAsset[]> {
  return getAptosNftProvider().getOwnedNfts(walletAddress);
}

export async function getNftByObjectId(
  objectId: string,
  walletAddress?: string,
): Promise<NormalizedNftAsset | null> {
  return getAptosNftProvider().getNftByObjectId(objectId, walletAddress);
}

export async function verifyWalletOwnsNft(
  walletAddress: string,
  nftObjectId: string,
): Promise<NftOwnershipVerificationResult> {
  return getAptosNftProvider().verifyWalletOwnsNft(walletAddress, nftObjectId);
}
