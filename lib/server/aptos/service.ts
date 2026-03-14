import type {
  AptosRuntimeStatus,
  NormalizedNftAsset,
  NftOwnershipVerificationResult,
} from "@/lib/aptos/types";
import { appConfig } from "@/lib/config";
import { AptosIntegrationError } from "@/lib/server/aptos/errors";
import { mockAptosNftProvider } from "@/lib/server/aptos/mock-provider";
import type { AptosNftProvider } from "@/lib/server/aptos/provider";

const scaffoldedProvider: AptosNftProvider = {
  status: {
    network: appConfig.aptos.network,
    integrationState:
      appConfig.aptos.fullnodeUrl || appConfig.aptos.indexerUrl
        ? "ready_for_real_provider"
        : "scaffolded",
    source: "aptos_indexer",
    mockEnabled: false,
    fullnodeConfigured: Boolean(appConfig.aptos.fullnodeUrl),
    indexerConfigured: Boolean(appConfig.aptos.indexerUrl),
    authMode: appConfig.aptos.authMode,
    notes:
      "Real Aptos provider wiring is not implemented yet. Plug SDK or indexer reads into this provider.",
  },
  async getOwnedNfts() {
    throw new AptosIntegrationError(
      "NOT_IMPLEMENTED",
      "Real Aptos NFT discovery is scaffolded but not implemented yet.",
      { status: 503 },
    );
  },
  async getNftByObjectId() {
    throw new AptosIntegrationError(
      "NOT_IMPLEMENTED",
      "Real Aptos NFT lookup is scaffolded but not implemented yet.",
      { status: 503 },
    );
  },
  async verifyWalletOwnsNft(walletAddress, nftObjectId) {
    return {
      verified: false,
      walletAddress,
      nftObjectId,
      source: "aptos_indexer",
      checkedAt: new Date().toISOString(),
      reason: "Real Aptos ownership verification is scaffolded but not implemented yet.",
    };
  },
};

export function getAptosNftProvider(): AptosNftProvider {
  if (appConfig.aptos.mockEnabled) {
    return mockAptosNftProvider;
  }

  if (appConfig.aptos.fullnodeUrl || appConfig.aptos.indexerUrl) {
    return scaffoldedProvider;
  }

  throw new AptosIntegrationError(
    "NOT_CONFIGURED",
    "Aptos mock mode is disabled but no real fullnode or indexer configuration is available.",
    { status: 503 },
  );
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
