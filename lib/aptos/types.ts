export type AptosIntegrationState =
  | "mock"
  | "scaffolded"
  | "ready_for_real_provider"
  | "active";

export type WalletAuthMode = "mock" | "challenge";
export type AptosProviderSource = "mock" | "aptos_sdk" | "aptos_indexer";

export type NormalizedNftAttribute = {
  traitType: string;
  value: string;
};

export type NormalizedNftAsset = {
  objectId: string;
  tokenName: string;
  collectionName: string;
  ownerAddress: string;
  imageUrl: string | null;
  metadataUrl: string | null;
  description: string | null;
  attributes?: NormalizedNftAttribute[];
};

export type NftOwnershipVerificationResult = {
  verified: boolean;
  walletAddress: string;
  nftObjectId: string;
  source: AptosProviderSource;
  checkedAt: string;
  reason?: string;
};

export type WalletLoginChallenge = {
  challengeId: string;
  /** Short alphanumeric nonce for use with wallet signMessage (mobile-safe). */
  nonce: string;
  message: string;
  walletAddress: string;
  network: string;
  expiresAt: string;
  authMode: WalletAuthMode;
};

export type WalletSignedChallenge = {
  walletAddress: string;
  challengeId: string;
  signature?: string;
  publicKey?: string;
  fullMessage?: string;
  signedAddress?: string;
};

export type WalletSessionRecord = {
  walletAddress: string;
  sessionToken: string;
  authMode: WalletAuthMode;
  network: string;
  expiresAt: string;
  isMock: boolean;
};

export type WalletAuthStatus = {
  mode: WalletAuthMode;
  integrationState: AptosIntegrationState;
  challengeFlowReady: boolean;
  mockEnabled: boolean;
  network: string;
};

export type AptosRuntimeStatus = {
  network: string;
  integrationState: AptosIntegrationState;
  source: AptosProviderSource;
  mockEnabled: boolean;
  fullnodeConfigured: boolean;
  indexerConfigured: boolean;
  authMode: WalletAuthMode;
  notes?: string;
};
