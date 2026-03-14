import type {
  AptosRuntimeStatus,
  NormalizedNftAsset,
  NftOwnershipVerificationResult,
} from "@/lib/aptos/types";

export interface AptosNftProvider {
  readonly status: AptosRuntimeStatus;
  getOwnedNfts(walletAddress: string): Promise<NormalizedNftAsset[]>;
  getNftByObjectId(objectId: string, walletAddress?: string): Promise<NormalizedNftAsset | null>;
  verifyWalletOwnsNft(
    walletAddress: string,
    nftObjectId: string,
  ): Promise<NftOwnershipVerificationResult>;
}
