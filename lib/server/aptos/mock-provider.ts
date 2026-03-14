import { appConfig, demoWalletAddress } from "@/lib/config";
import type {
  NormalizedNftAsset,
  NftOwnershipVerificationResult,
} from "@/lib/aptos/types";
import type { AptosNftProvider } from "@/lib/server/aptos/provider";

function shortSeed(walletAddress: string) {
  return walletAddress.toLowerCase().replace(/[^a-z0-9]/g, "").slice(-6) || "owner";
}

function buildMockAssets(walletAddress: string): NormalizedNftAsset[] {
  if (walletAddress === demoWalletAddress) {
    return [
      {
        objectId: "0xflashvault-object-001",
        collectionName: "Afterglow Collectors Club",
        tokenName: "Collector Pass 001",
        ownerAddress: walletAddress,
        description:
          "Owner-gated media and unlockables for the Afterglow collector circle.",
        imageUrl:
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
        metadataUrl: null,
        attributes: [{ traitType: "tier", value: "collector" }],
      },
      {
        objectId: "0xflashvault-object-002",
        collectionName: "Signal Archive",
        tokenName: "Signal Key",
        ownerAddress: walletAddress,
        description:
          "A collectible used to unlock private drops and gated previews.",
        imageUrl:
          "https://images.unsplash.com/photo-1526378800651-c1a86d5c8857?auto=format&fit=crop&w=900&q=80",
        metadataUrl: null,
        attributes: [{ traitType: "access", value: "preview" }],
      },
    ];
  }

  const seed = shortSeed(walletAddress);

  return [
    {
      objectId: `0xflashvault-${seed}-001`,
      collectionName: "FlashVault Mock Collection",
      tokenName: `Vault Pass ${seed.toUpperCase()}`,
      ownerAddress: walletAddress,
      description:
        "Mock Aptos digital asset data for local ownership verification flows.",
      imageUrl:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
      metadataUrl: null,
      attributes: [{ traitType: "env", value: "mock" }],
    },
    {
      objectId: `0xflashvault-${seed}-002`,
      collectionName: "Unlockables Club",
      tokenName: `Unlock Key ${seed.toUpperCase()}`,
      ownerAddress: walletAddress,
      description:
        "Private media access for collectors using a replaceable mock chain service.",
      imageUrl:
        "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80",
      metadataUrl: null,
      attributes: [{ traitType: "mode", value: "unlockable" }],
    },
  ];
}

export const mockAptosNftProvider: AptosNftProvider = {
  status: {
    network: appConfig.aptos.network,
    integrationState: "mock",
    source: "mock",
    mockEnabled: true,
    fullnodeConfigured: Boolean(appConfig.aptos.fullnodeUrl),
    indexerConfigured: Boolean(appConfig.aptos.indexerUrl),
    authMode: appConfig.aptos.authMode,
    notes: "Mock Aptos NFT provider for local development and product demos.",
  },
  async getOwnedNfts(walletAddress) {
    return buildMockAssets(walletAddress);
  },
  async getNftByObjectId(objectId, walletAddress) {
    if (walletAddress) {
      const assets = buildMockAssets(walletAddress);
      return assets.find((asset) => asset.objectId === objectId) ?? null;
    }

    const demoAssets = buildMockAssets(demoWalletAddress);
    return demoAssets.find((asset) => asset.objectId === objectId) ?? null;
  },
  async verifyWalletOwnsNft(walletAddress, nftObjectId) {
    const assets = buildMockAssets(walletAddress);
    const verified = assets.some((asset) => asset.objectId === nftObjectId);

    return {
      verified,
      walletAddress,
      nftObjectId,
      source: "mock",
      checkedAt: new Date().toISOString(),
      reason: verified ? undefined : "NFT not present in mock ownership set.",
    } satisfies NftOwnershipVerificationResult;
  },
};
