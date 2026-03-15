import type {
  AptosRuntimeStatus,
  NormalizedNftAsset,
  NftOwnershipVerificationResult,
} from "@/lib/aptos/types";
import { appConfig } from "@/lib/config";
import { AptosIntegrationError } from "@/lib/server/aptos/errors";
import { indexerAptosNftProvider } from "@/lib/server/aptos/indexer-provider";
import type { AptosNftProvider } from "@/lib/server/aptos/provider";

export function getAptosNftProvider(): AptosNftProvider {
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
        mockEnabled: false,
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
