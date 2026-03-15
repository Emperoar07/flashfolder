import { Ed25519PublicKey, Ed25519Signature } from "@aptos-labs/ts-sdk";
import { createHmac, timingSafeEqual } from "node:crypto";
import { nanoid } from "nanoid";

import type {
  WalletSignedChallenge,
  WalletAuthStatus,
  WalletLoginChallenge,
  WalletSessionRecord,
} from "@/lib/aptos/types";
import { appConfig } from "@/lib/config";
import { AptosIntegrationError } from "@/lib/server/aptos/errors";

const challengeTtlMs = 5 * 60 * 1000;
const sessionTtlMs = 24 * 60 * 60 * 1000;

let _authSecret: string | null = null;
function getAuthSecret() {
  if (_authSecret !== null) return _authSecret;
  const secret = (process.env.FLASHFOLDER_AUTH_SECRET ?? process.env.FLASHVAULT_ENCRYPTION_SECRET ?? "").trim();
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("FLASHFOLDER_AUTH_SECRET or FLASHVAULT_ENCRYPTION_SECRET must be set in production.");
  }
  _authSecret = secret || "dev-auth-secret-local-only";
  return _authSecret;
}

type SignedChallengePayload = {
  kind: "challenge";
  walletAddress: string;
  network: string;
  expiresAt: string;
  nonce: string;
};

type SignedSessionPayload = {
  kind: "session";
  walletAddress: string;
  authMode: WalletSessionRecord["authMode"];
  network: string;
  expiresAt: string;
};

function normalizeHex(value: string) {
  return value.startsWith("0x") ? value : `0x${value}`;
}

function normalizeWalletAddress(value: string) {
  return value.trim().toLowerCase();
}

function signPayload(payload: object) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getAuthSecret()).update(body).digest("base64url");

  return `${body}.${signature}`;
}

function verifySignedPayload<T extends { kind: string }>(token: string, kind: T["kind"]) {
  const [body, signature] = token.split(".");

  if (!body || !signature) {
    throw new AptosIntegrationError("INVALID_SIGNATURE", "Signed token is malformed.", {
      status: 400,
    });
  }

  const expectedSignature = createHmac("sha256", getAuthSecret()).update(body).digest("base64url");
  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    throw new AptosIntegrationError("INVALID_SIGNATURE", "Signed token is invalid.", {
      status: 401,
    });
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;

  if (payload.kind !== kind) {
    throw new AptosIntegrationError("INVALID_SIGNATURE", "Signed token type mismatch.", {
      status: 400,
    });
  }

  return payload;
}

function parsePublicKey(publicKey: string) {
  return new Ed25519PublicKey(normalizeHex(publicKey.trim()));
}

function parseSignature(signature: string) {
  return new Ed25519Signature(normalizeHex(signature.trim()));
}

function assertSignedChallengeInput(
  input: WalletSignedChallenge,
): asserts input is WalletSignedChallenge & {
  signature: string;
  publicKey: string;
  fullMessage: string;
  signedAddress: string;
} {
  if (!input.signature || !input.publicKey || !input.fullMessage || !input.signedAddress) {
    throw new AptosIntegrationError(
      "INVALID_SIGNATURE",
      "Wallet signature payload is incomplete.",
      { status: 400 },
    );
  }
}

function verifySignedMessageMatchesChallenge(
  challenge: WalletLoginChallenge,
  input: WalletSignedChallenge & {
    fullMessage: string;
    signedAddress: string;
  },
) {
  const expectedWallet = normalizeWalletAddress(challenge.walletAddress);
  const signedWallet = normalizeWalletAddress(input.signedAddress);

  if (signedWallet !== expectedWallet) {
    throw new AptosIntegrationError(
      "INVALID_SIGNATURE",
      "Signed wallet address did not match the requested account.",
      { status: 400 },
    );
  }

  if (!input.fullMessage.includes(challenge.message)) {
    throw new AptosIntegrationError(
      "INVALID_SIGNATURE",
      "Signed message did not include the active FlashFolder challenge.",
      { status: 400 },
    );
  }
}

export function getWalletAuthStatus(): WalletAuthStatus {
  return {
    mode: "challenge",
    integrationState: "active",
    challengeFlowReady: true,
    mockEnabled: false,
    network: appConfig.aptos.network,
  };
}

export async function createLoginChallenge(walletAddress: string) {
  const expiresAt = new Date(Date.now() + challengeTtlMs).toISOString();
  const challengeId = signPayload({
    kind: "challenge",
    walletAddress,
    network: appConfig.aptos.network,
    expiresAt,
    nonce: nanoid(18),
  } satisfies SignedChallengePayload);
  const challenge: WalletLoginChallenge = {
    challengeId,
    walletAddress,
    network: appConfig.aptos.network,
    expiresAt,
    authMode: appConfig.aptos.authMode,
    message: `FlashFolder login challenge\nwallet:${walletAddress}\nnetwork:${appConfig.aptos.network}\nchallenge:${challengeId}\nexpires:${expiresAt}`,
  };

  return challenge;
}

export async function verifySignedChallenge(input: WalletSignedChallenge) {
  const challengeToken = verifySignedPayload<SignedChallengePayload>(
    input.challengeId,
    "challenge",
  );
  const challenge: WalletLoginChallenge = {
    challengeId: input.challengeId,
    walletAddress: challengeToken.walletAddress,
    network: challengeToken.network,
    expiresAt: challengeToken.expiresAt,
    authMode: appConfig.aptos.authMode,
    message: `FlashFolder login challenge\nwallet:${challengeToken.walletAddress}\nnetwork:${challengeToken.network}\nchallenge:${input.challengeId}\nexpires:${challengeToken.expiresAt}`,
  };

  if (!challenge || challenge.walletAddress !== input.walletAddress) {
    throw new AptosIntegrationError("INVALID_SIGNATURE", "Login challenge is invalid or expired.", {
      status: 400,
    });
  }

  if (new Date(challenge.expiresAt).getTime() < Date.now()) {
    throw new AptosIntegrationError("SESSION_EXPIRED", "Login challenge expired.", {
      status: 400,
    });
  }

  assertSignedChallengeInput(input);
  verifySignedMessageMatchesChallenge(challenge, input);

  const publicKey = parsePublicKey(input.publicKey);
  const signature = parseSignature(input.signature);
  const verified = publicKey.verifySignature({
    message: new TextEncoder().encode(input.fullMessage),
    signature,
  });

  if (!verified) {
    throw new AptosIntegrationError(
      "INVALID_SIGNATURE",
      "Wallet signature verification failed.",
      { status: 401 },
    );
  }

  return {
    verified: true,
    reason: undefined,
    session: await createSessionForWallet(input.walletAddress),
  };
}

export async function createSessionForWallet(
  walletAddress: string,
): Promise<WalletSessionRecord> {
  const expiresAt = new Date(Date.now() + sessionTtlMs).toISOString();
  const session = {
    walletAddress,
    sessionToken: signPayload({
      kind: "session",
      walletAddress,
      authMode: appConfig.aptos.authMode,
      network: appConfig.aptos.network,
      expiresAt,
    } satisfies SignedSessionPayload),
    authMode: appConfig.aptos.authMode,
    network: appConfig.aptos.network,
    expiresAt,
    isMock: false,
  };
  return session;
}

export function getSessionForToken(sessionToken?: string | null) {
  if (!sessionToken) {
    return null;
  }

  let session: SignedSessionPayload;
  try {
    session = verifySignedPayload<SignedSessionPayload>(sessionToken, "session");
  } catch {
    return null;
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return null;
  }

  return session;
}
