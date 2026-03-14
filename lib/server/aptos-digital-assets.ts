import type {
  NormalizedNftAsset,
  NftOwnershipVerificationResult,
} from "@/lib/aptos/types";
import {
  getNftByObjectId,
  getOwnedNfts,
  verifyWalletOwnsNft,
} from "@/lib/server/aptos";

export type OwnedDigitalAsset = NormalizedNftAsset;

export async function listOwnedDigitalAssets(
  walletAddress: string,
): Promise<OwnedDigitalAsset[]> {
  return getOwnedNfts(walletAddress);
}

export async function verifyDigitalAssetOwnership(
  walletAddress: string,
  objectId: string,
) {
  const result = await verifyWalletOwnsNft(walletAddress, objectId);
  return result.verified;
}

export async function verifyDigitalAssetOwnershipDetailed(
  walletAddress: string,
  objectId: string,
): Promise<NftOwnershipVerificationResult> {
  return verifyWalletOwnsNft(walletAddress, objectId);
}

export async function getOwnedDigitalAsset(
  walletAddress: string,
  objectId: string,
) {
  return getNftByObjectId(objectId, walletAddress);
}
