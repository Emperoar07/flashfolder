export const demoWalletAddress =
  process.env.NEXT_PUBLIC_DEFAULT_WALLET ??
  "0x4c617368466f6c64657244656d6f57616c6c6574";

const maxUploadMb = Number.parseInt(
  process.env.FLASHFOLDER_MAX_UPLOAD_MB ?? "100",
  10,
);

export const appConfig = {
  appName: "FlashFolder",
  storageMode:
    process.env.FLASHFOLDER_STORAGE_MODE === "shelby" ? "shelby" : "local",
  maxUploadBytes: Number.isNaN(maxUploadMb)
    ? 100 * 1024 * 1024
    : maxUploadMb * 1024 * 1024,
  storageRoot: process.env.FLASHFOLDER_STORAGE_ROOT ?? ".flashfolder/storage",
  aptosNetwork: process.env.NEXT_PUBLIC_APTOS_NETWORK ?? "testnet",
  shelbyApiKey: process.env.SHELBY_API_KEY ?? "",
  shelbyRpcUrl: process.env.SHELBY_RPC_URL ?? "",
  shelbyNamespace: process.env.SHELBY_ACCOUNT_NAMESPACE ?? "",
};
