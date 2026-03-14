import { nanoid } from "nanoid";

import type {
  WalletAuthStatus,
  WalletLoginChallenge,
  WalletSessionRecord,
} from "@/lib/aptos/types";
import { appConfig } from "@/lib/config";
import { AptosIntegrationError } from "@/lib/server/aptos/errors";

const challengeTtlMs = 5 * 60 * 1000;
const sessionTtlMs = 24 * 60 * 60 * 1000;
const challengeStore = new Map<string, WalletLoginChallenge>();

export function getWalletAuthStatus(): WalletAuthStatus {
  if (appConfig.aptos.authMode === "mock") {
    return {
      mode: "mock",
      integrationState: "mock",
      challengeFlowReady: false,
      mockEnabled: true,
      network: appConfig.aptos.network,
    };
  }

  return {
    mode: "challenge",
    integrationState:
      appConfig.aptos.fullnodeUrl || appConfig.aptos.indexerUrl
        ? "ready_for_real_provider"
        : "scaffolded",
    challengeFlowReady: true,
    mockEnabled: appConfig.aptos.mockEnabled,
    network: appConfig.aptos.network,
  };
}

export async function createLoginChallenge(walletAddress: string) {
  const challengeId = nanoid(18);
  const expiresAt = new Date(Date.now() + challengeTtlMs).toISOString();
  const challenge: WalletLoginChallenge = {
    challengeId,
    walletAddress,
    network: appConfig.aptos.network,
    expiresAt,
    authMode: appConfig.aptos.authMode,
    message: `FlashFolder login challenge\nwallet:${walletAddress}\nnetwork:${appConfig.aptos.network}\nchallenge:${challengeId}\nexpires:${expiresAt}`,
  };

  challengeStore.set(challengeId, challenge);
  return challenge;
}

export async function verifySignedChallenge(input: {
  walletAddress: string;
  challengeId: string;
  signature?: string;
  publicKey?: string;
}) {
  const challenge = challengeStore.get(input.challengeId);

  if (!challenge || challenge.walletAddress !== input.walletAddress) {
    throw new AptosIntegrationError("INVALID_SIGNATURE", "Login challenge is invalid or expired.", {
      status: 400,
    });
  }

  if (new Date(challenge.expiresAt).getTime() < Date.now()) {
    challengeStore.delete(input.challengeId);
    throw new AptosIntegrationError("SESSION_EXPIRED", "Login challenge expired.", {
      status: 400,
    });
  }

  if (appConfig.aptos.authMode === "mock") {
    challengeStore.delete(input.challengeId);
    return {
      verified: true,
      reason: undefined,
      session: await createSessionForWallet(input.walletAddress),
    };
  }

  void input.signature;
  void input.publicKey;

  throw new AptosIntegrationError(
    "NOT_IMPLEMENTED",
    "Signature verification is scaffolded but not implemented yet.",
    { status: 503 },
  );
}

export async function createSessionForWallet(
  walletAddress: string,
): Promise<WalletSessionRecord> {
  return {
    walletAddress,
    sessionToken: nanoid(24),
    authMode: appConfig.aptos.authMode,
    network: appConfig.aptos.network,
    expiresAt: new Date(Date.now() + sessionTtlMs).toISOString(),
    isMock: appConfig.aptos.authMode === "mock",
  };
}
