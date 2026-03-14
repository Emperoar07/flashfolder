import type { WalletAuthMode } from "@/lib/aptos/types";

export const demoWalletAddress =
  process.env.NEXT_PUBLIC_DEFAULT_WALLET ??
  "0x4c617368466f6c64657244656d6f57616c6c6574";

const rawStorageMode = (process.env.FLASHFOLDER_STORAGE_MODE ?? "local").trim().toLowerCase();
const rawAptosAuthMode = (process.env.APTOS_AUTH_MODE ?? "mock").trim().toLowerCase();
const maxUploadMb = Number.parseInt(
  process.env.FLASHFOLDER_MAX_UPLOAD_MB ?? "100",
  10,
);

export const appConfig = {
  appName: "FlashFolder",
  vaultName: "FlashVault",
  storageMode:
    rawStorageMode === "shelby"
      ? "shelby"
      : rawStorageMode === "blob"
        ? "blob"
      : rawStorageMode === "mock"
        ? "mock"
        : "local",
  maxUploadBytes: Number.isNaN(maxUploadMb)
    ? 100 * 1024 * 1024
    : maxUploadMb * 1024 * 1024,
  storageRoot: process.env.FLASHFOLDER_STORAGE_ROOT ?? ".flashfolder/storage",
  failOnStorageMisconfig:
    process.env.FLASHFOLDER_FAIL_ON_STORAGE_MISCONFIG === "true",
  blob: {
    readWriteToken: process.env.BLOB_READ_WRITE_TOKEN ?? "",
  },
  aptosNetwork: process.env.NEXT_PUBLIC_APTOS_NETWORK ?? "testnet",
  aptos: {
    network: process.env.NEXT_PUBLIC_APTOS_NETWORK ?? "testnet",
    fullnodeUrl: process.env.APTOS_FULLNODE_URL ?? "",
    indexerUrl: process.env.APTOS_INDEXER_URL ?? "",
    authMode: (rawAptosAuthMode === "challenge" ? "challenge" : "mock") as WalletAuthMode,
    mockEnabled:
      process.env.APTOS_MOCK_ENABLED === "false"
        ? false
        : process.env.FLASHVAULT_USE_MOCK_NFTS !== "false",
  },
  useMockNfts:
    process.env.APTOS_MOCK_ENABLED === "false"
      ? false
      : process.env.FLASHVAULT_USE_MOCK_NFTS !== "false",
  vaultEncryptionSecret:
    process.env.FLASHVAULT_ENCRYPTION_SECRET ?? "flashvault-demo-secret",
  shelby: {
    apiKey: process.env.SHELBY_API_KEY ?? "",
    rpcUrl: process.env.SHELBY_RPC_URL ?? "",
    namespace: process.env.SHELBY_ACCOUNT_NAMESPACE ?? "",
    network: process.env.SHELBY_NETWORK ?? "shelbynet",
    account: process.env.SHELBY_ACCOUNT ?? "",
    signerPrivateKey: process.env.SHELBY_PRIVATE_KEY ?? "",
  },
};
