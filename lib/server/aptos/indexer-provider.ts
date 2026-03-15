import type {
  NormalizedNftAsset,
  NftOwnershipVerificationResult,
} from "@/lib/aptos/types";
import { appConfig } from "@/lib/config";
import type { AptosNftProvider } from "@/lib/server/aptos/provider";

/**
 * Default Aptos Indexer GraphQL endpoints by network.
 */
const INDEXER_URLS: Record<string, string> = {
  testnet: "https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql",
  mainnet: "https://indexer.mainnet.aptoslabs.com/v1/graphql",
  devnet: "https://indexer-devnet.staging.gcp.aptosdev.com/v1/graphql",
};

function getIndexerUrl() {
  if (appConfig.aptos.indexerUrl) return appConfig.aptos.indexerUrl;
  return INDEXER_URLS[appConfig.aptos.network] ?? INDEXER_URLS.testnet;
}

/**
 * GraphQL query for fetching current_token_ownerships_v2 from the Aptos Indexer.
 */
const OWNED_NFTS_QUERY = `
  query GetOwnedNfts($owner: String!, $offset: Int!, $limit: Int!) {
    current_token_ownerships_v2(
      where: {
        owner_address: { _eq: $owner }
        amount: { _gt: "0" }
      }
      offset: $offset
      limit: $limit
      order_by: { last_transaction_version: desc }
    ) {
      token_data_id
      owner_address
      amount
      current_token_data {
        token_name
        token_uri
        description
        collection_id
        current_collection {
          collection_name
          uri
        }
      }
    }
  }
`;

const NFT_BY_ID_QUERY = `
  query GetNftById($tokenDataId: String!) {
    current_token_ownerships_v2(
      where: {
        token_data_id: { _eq: $tokenDataId }
        amount: { _gt: "0" }
      }
      limit: 1
    ) {
      token_data_id
      owner_address
      amount
      current_token_data {
        token_name
        token_uri
        description
        collection_id
        current_collection {
          collection_name
          uri
        }
      }
    }
  }
`;

type IndexerTokenOwnership = {
  token_data_id: string;
  owner_address: string;
  amount: number;
  current_token_data: {
    token_name: string;
    token_uri: string | null;
    description: string | null;
    collection_id: string;
    current_collection: {
      collection_name: string;
      uri: string | null;
    } | null;
  } | null;
};

async function queryIndexer<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const url = getIndexerUrl();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Aptos Indexer returned ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };

  if (json.errors?.length) {
    throw new Error(`Aptos Indexer error: ${json.errors[0].message}`);
  }

  if (!json.data) {
    throw new Error("Aptos Indexer returned no data.");
  }

  return json.data;
}

function normalizeToken(token: IndexerTokenOwnership): NormalizedNftAsset {
  const tokenData = token.current_token_data;
  // Try to resolve image from token_uri (often points to JSON metadata or direct image)
  let imageUrl = tokenData?.token_uri ?? null;
  // If the URI looks like an IPFS hash without protocol, prefix it
  if (imageUrl && !imageUrl.startsWith("http") && !imageUrl.startsWith("data:")) {
    if (imageUrl.startsWith("ipfs://")) {
      imageUrl = imageUrl.replace("ipfs://", "https://ipfs.io/ipfs/");
    } else {
      imageUrl = `https://ipfs.io/ipfs/${imageUrl}`;
    }
  }

  return {
    objectId: token.token_data_id,
    tokenName: tokenData?.token_name ?? "Unknown Token",
    collectionName: tokenData?.current_collection?.collection_name ?? "Unknown Collection",
    ownerAddress: token.owner_address,
    imageUrl,
    metadataUrl: tokenData?.token_uri ?? null,
    description: tokenData?.description ?? null,
    attributes: [],
  };
}

export const indexerAptosNftProvider: AptosNftProvider = {
  status: {
    network: appConfig.aptos.network,
    integrationState: "active",
    source: "aptos_indexer",
    mockEnabled: false,
    fullnodeConfigured: Boolean(appConfig.aptos.fullnodeUrl),
    indexerConfigured: true,
    authMode: appConfig.aptos.authMode,
    notes: `Real Aptos Indexer provider querying ${appConfig.aptos.network}.`,
  },

  async getOwnedNfts(walletAddress: string): Promise<NormalizedNftAsset[]> {
    const data = await queryIndexer<{
      current_token_ownerships_v2: IndexerTokenOwnership[];
    }>(OWNED_NFTS_QUERY, {
      owner: walletAddress,
      offset: 0,
      limit: 50,
    });

    return data.current_token_ownerships_v2.map(normalizeToken);
  },

  async getNftByObjectId(
    objectId: string,
    walletAddress?: string,
  ): Promise<NormalizedNftAsset | null> {
    const data = await queryIndexer<{
      current_token_ownerships_v2: IndexerTokenOwnership[];
    }>(NFT_BY_ID_QUERY, { tokenDataId: objectId });

    const token = data.current_token_ownerships_v2[0];
    if (!token) return null;

    // If walletAddress provided, verify it matches
    if (walletAddress && token.owner_address !== walletAddress) {
      return null;
    }

    return normalizeToken(token);
  },

  async verifyWalletOwnsNft(
    walletAddress: string,
    nftObjectId: string,
  ): Promise<NftOwnershipVerificationResult> {
    const nft = await this.getNftByObjectId(nftObjectId, walletAddress);
    const verified = nft !== null && nft.ownerAddress === walletAddress;

    return {
      verified,
      walletAddress,
      nftObjectId,
      source: "aptos_indexer",
      checkedAt: new Date().toISOString(),
      reason: verified ? undefined : "NFT not owned by this wallet on-chain.",
    };
  },
};
