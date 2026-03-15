/**
 * TypeScript bindings for the FlashVault on-chain registry (Move contract).
 *
 * These helpers build entry-function payloads that the wallet adapter can
 * sign and submit, and wrap the view functions for reading on-chain state.
 */

import { Aptos, AptosConfig, Network, type InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { appConfig } from "@/lib/config";

// ── Contract address ──

const FLASHVAULT_ADDRESS = process.env.NEXT_PUBLIC_FLASHVAULT_ADDRESS ?? "";

function moduleAddress(): string {
  if (!FLASHVAULT_ADDRESS) {
    throw new Error(
      "NEXT_PUBLIC_FLASHVAULT_ADDRESS is not set. Deploy the FlashVault Move package first.",
    );
  }
  return FLASHVAULT_ADDRESS;
}

// ── Aptos client ──

function getAptosClient(): Aptos {
  const networkMap: Record<string, Network> = {
    mainnet: Network.MAINNET,
    testnet: Network.TESTNET,
    devnet: Network.DEVNET,
  };
  const network = networkMap[appConfig.aptos.network] ?? Network.TESTNET;
  return new Aptos(new AptosConfig({ network }));
}

// ── Registry entry-function payloads ──

export function registerVaultPayload(
  nftObjectId: string,
  collectionName: string,
  teaserEnabled: boolean,
  contentCommitment: string,
): InputEntryFunctionData {
  return {
    function: `${moduleAddress()}::registry::register_vault`,
    typeArguments: [],
    functionArguments: [nftObjectId, collectionName, teaserEnabled, contentCommitment],
  };
}

export function updateContentCommitmentPayload(
  nftObjectId: string,
  newCommitment: string,
): InputEntryFunctionData {
  return {
    function: `${moduleAddress()}::registry::update_content_commitment`,
    typeArguments: [],
    functionArguments: [nftObjectId, newCommitment],
  };
}

export function updateTeaserModePayload(
  nftObjectId: string,
  teaserEnabled: boolean,
): InputEntryFunctionData {
  return {
    function: `${moduleAddress()}::registry::update_teaser_mode`,
    typeArguments: [],
    functionArguments: [nftObjectId, teaserEnabled],
  };
}

export function setVaultStatusPayload(
  nftObjectId: string,
  active: boolean,
): InputEntryFunctionData {
  return {
    function: `${moduleAddress()}::registry::set_vault_status`,
    typeArguments: [],
    functionArguments: [nftObjectId, active],
  };
}

// ── Entitlement entry-function payloads ──

export function grantEntitlementPayload(
  nftObjectId: string,
  holder: string,
): InputEntryFunctionData {
  return {
    function: `${moduleAddress()}::entitlements::grant_entitlement`,
    typeArguments: [],
    functionArguments: [nftObjectId, holder],
  };
}

export function revokeEntitlementPayload(
  nftObjectId: string,
  holder: string,
): InputEntryFunctionData {
  return {
    function: `${moduleAddress()}::entitlements::revoke_entitlement`,
    typeArguments: [],
    functionArguments: [nftObjectId, holder],
  };
}

// ── View function wrappers ──

export type VaultInfo = {
  registrant: string;
  collectionName: string;
  teaserEnabled: boolean;
  contentCommitment: string;
  active: boolean;
  createdAtUs: string;
  updatedAtUs: string;
};

export async function hasVaultOnChain(nftObjectId: string): Promise<boolean> {
  const aptos = getAptosClient();
  const [result] = await aptos.view({
    payload: {
      function: `${moduleAddress()}::registry::has_vault`,
      typeArguments: [],
      functionArguments: [nftObjectId],
    },
  });
  return result as boolean;
}

export async function getVaultInfoOnChain(nftObjectId: string): Promise<VaultInfo> {
  const aptos = getAptosClient();
  const result = await aptos.view({
    payload: {
      function: `${moduleAddress()}::registry::get_vault_info`,
      typeArguments: [],
      functionArguments: [nftObjectId],
    },
  });

  const [registrant, collectionName, teaserEnabled, contentCommitment, active, createdAtUs, updatedAtUs] =
    result as [string, string, boolean, string, boolean, string, string];

  return {
    registrant,
    collectionName,
    teaserEnabled,
    contentCommitment,
    active,
    createdAtUs,
    updatedAtUs,
  };
}

export async function getVaultCount(): Promise<number> {
  const aptos = getAptosClient();
  const [result] = await aptos.view({
    payload: {
      function: `${moduleAddress()}::registry::vault_count`,
      typeArguments: [],
      functionArguments: [],
    },
  });
  return Number(result);
}

export async function hasEntitlementOnChain(
  nftObjectId: string,
  holder: string,
): Promise<boolean> {
  const aptos = getAptosClient();
  const [result] = await aptos.view({
    payload: {
      function: `${moduleAddress()}::entitlements::has_entitlement`,
      typeArguments: [],
      functionArguments: [nftObjectId, holder],
    },
  });
  return result as boolean;
}
