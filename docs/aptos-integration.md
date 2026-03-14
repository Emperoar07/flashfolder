# Aptos Integration Notes

This document explains how FlashFolder and FlashVault are prepared for real Aptos integration without rewriting business logic.

## Current separation

The app is split into three Aptos-facing concerns:

1. wallet auth
2. NFT discovery
3. NFT ownership verification

Those concerns are intentionally separate from:

- storage adapters
- file serving
- folder metadata
- vault sharing rules

## Where the integration boundaries live

Wallet auth services:

- [`lib/server/aptos/auth.ts`](/c:/FlashFolder/lib/server/aptos/auth.ts)
- [`app/api/auth/wallet/route.ts`](/c:/FlashFolder/app/api/auth/wallet/route.ts)
- [`app/api/auth/challenge/route.ts`](/c:/FlashFolder/app/api/auth/challenge/route.ts)
- [`app/api/auth/verify/route.ts`](/c:/FlashFolder/app/api/auth/verify/route.ts)

NFT discovery and ownership verification:

- [`lib/server/aptos/provider.ts`](/c:/FlashFolder/lib/server/aptos/provider.ts)
- [`lib/server/aptos/mock-provider.ts`](/c:/FlashFolder/lib/server/aptos/mock-provider.ts)
- [`lib/server/aptos/service.ts`](/c:/FlashFolder/lib/server/aptos/service.ts)
- [`lib/server/aptos-digital-assets.ts`](/c:/FlashFolder/lib/server/aptos-digital-assets.ts)

Frontend wallet hooks:

- [`lib/client/wallet.ts`](/c:/FlashFolder/lib/client/wallet.ts)

## Auth flow design

Current modes:

- `mock`
- `challenge`

Current production-safe behavior:

- mock mode works for demos right now
- challenge mode is scaffolded but does not yet verify real signatures

Planned real flow:

1. frontend requests a login challenge
2. wallet signs the challenge message
3. backend verifies the signature
4. backend creates a session/token for the wallet
5. protected requests rely on session state instead of a raw wallet header

Existing methods prepared for that:

- `createLoginChallenge`
- `verifySignedChallenge`
- `createSessionForWallet`

## NFT discovery design

UI should consume normalized NFT objects only:

- `objectId`
- `tokenName`
- `collectionName`
- `ownerAddress`
- `imageUrl`
- `metadataUrl`
- `description`
- `attributes`

Do not leak raw indexer or SDK response shapes into UI components.

The provider layer is responsible for:

- calling Aptos SDK or indexer endpoints later
- normalizing raw responses
- exposing a stable app-facing shape

## Ownership verification design

Vault routes should depend on the verification service only.

That service returns:

- `verified`
- `walletAddress`
- `nftObjectId`
- `source`
- `checkedAt`
- `reason`

This is the contract between chain verification and FlashVault protected content serving.

## Current configuration

Relevant envs:

- `NEXT_PUBLIC_APTOS_NETWORK`
- `APTOS_FULLNODE_URL`
- `APTOS_INDEXER_URL`
- `APTOS_AUTH_MODE`
- `APTOS_MOCK_ENABLED`

Recommended local defaults:

- `NEXT_PUBLIC_APTOS_NETWORK=testnet`
- `APTOS_AUTH_MODE=mock`
- `APTOS_MOCK_ENABLED=true`

## Vault persistence guidance

Vault records should store durable app metadata:

- NFT object ID
- collection name snapshot
- token name snapshot
- owner address snapshot
- lightweight metadata snapshot

But they should still verify live ownership for protected content access.

That balance avoids over-coupling to mutable chain/indexer payloads while keeping the UI useful.

## What to implement later

### 1. Real wallet signature verification

Replace the scaffold in [`lib/server/aptos/auth.ts`](/c:/FlashFolder/lib/server/aptos/auth.ts).

Implementation target:

- Aptos-compatible sign message verification
- nonce/challenge replay protection
- real session persistence

### 2. Real NFT discovery

Replace the mock provider with a real provider in [`lib/server/aptos/service.ts`](/c:/FlashFolder/lib/server/aptos/service.ts).

Implementation target:

- Aptos SDK or indexer query for owned digital assets
- normalized object mapping
- collection-level metadata support if needed

### 3. Real ownership verification

Use the same provider layer to verify owner access before serving protected vault content.

Keep this check separate from:

- share-token access
- teaser/public preview state
- storage access

## First tests once real Aptos access is wired

1. Connect wallet and create a login challenge.
2. Sign and verify the challenge.
3. Confirm the created session expires correctly.
4. Fetch owned NFTs for the connected wallet.
5. Import an owned NFT into FlashVault.
6. Verify owner-only vault access succeeds for the owner.
7. Verify owner-only vault access fails after transferring the NFT away.
8. Confirm mock mode still works when real provider settings are disabled.
