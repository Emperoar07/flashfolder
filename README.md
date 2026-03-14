# FlashFolder

FlashFolder is a decentralized hot-storage workspace for instant file access, sharing, and streaming.

It also includes FlashVault, an optional premium mode for private Aptos NFT content. FlashVault does not hide NFT ownership from the blockchain. It protects owner-gated media, unlockables, and collector access while preserving onchain ownership records.

It is built as a Shelby-ready MVP:

- PostgreSQL + Prisma store all product metadata
- local mock storage keeps uploads demoable today
- a Shelby adapter scaffold is already isolated behind the same storage interface
- Aptos wallet login is wired in with a demo-wallet fallback for local UX
- FlashVault uses a separate Aptos ownership verification layer and optional encrypted vault uploads

## Current status

- latest verified commit: `68a51ea`
- latest production deployment alias: `https://flashfolder.vercel.app`
- local Prisma commands still require a real `DATABASE_URL` in `.env`

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS 4
- Prisma + PostgreSQL
- React Query
- Aptos wallet adapter
- Local filesystem storage adapter

## Product scope

FlashFolder focuses on active files rather than archival backup. The storage layer only holds blobs. Everything users care about in the product layer stays in the database:

- virtual folders
- file metadata
- share links
- analytics
- wallet-linked ownership
- vault assets, vault files, and vault access logs

## Key routes

Pages:

- `/`
- `/dashboard`
- `/dashboard/folders/:id`
- `/files/:id`
- `/share/:token`
- `/vault`
- `/vault/:id`
- `/settings`

API:

- `POST /api/auth/wallet`
- `POST /api/auth/challenge`
- `POST /api/auth/verify`
- `GET /api/folders`
- `POST /api/folders`
- `PATCH /api/folders/:id`
- `DELETE /api/folders/:id`
- `GET /api/files`
- `POST /api/files/upload`
- `GET /api/files/:id`
- `DELETE /api/files/:id`
- `POST /api/files/:id/share`
- `POST /api/files/:id/view`
- `GET /api/files/:id/download`
- `GET /api/share/:token`
- `POST /api/share/:token/verify-password`
- `GET /api/settings`
- `GET /api/me`
- `GET /api/vault/nfts`
- `GET /api/vault/assets`
- `POST /api/vault/assets`
- `GET /api/vault/assets/:id`
- `POST /api/vault/assets/:id/upload`
- `POST /api/vault/assets/:id/verify-ownership`
- `GET /api/vault/assets/:id/content`
- `POST /api/vault/assets/:id/share`
- `GET /api/vault/assets/:id/access-logs`

## Storage architecture

The app uses a storage interface in [`lib/storage/types.ts`](/c:/FlashFolder/lib/storage/types.ts):

- `uploadFile`
- `downloadFile`
- `getFileStream`
- `getFileRange`
- `deleteFile`
- `listFiles`

Current adapters:

- [`lib/storage/local-storage.ts`](/c:/FlashFolder/lib/storage/local-storage.ts): working mock adapter that writes to `.flashfolder/storage`
- [`lib/storage/shelby-storage.ts`](/c:/FlashFolder/lib/storage/shelby-storage.ts): scaffolded Shelby adapter entrypoint
- [`lib/storage/shelby/adapter.ts`](/c:/FlashFolder/lib/storage/shelby/adapter.ts): provider-specific Shelby implementation boundary
- [`docs/shelby-integration.md`](/c:/FlashFolder/docs/shelby-integration.md): implementation handoff notes for real Shelby work

## Aptos architecture

Real Aptos integration is prepared behind service boundaries instead of being embedded directly in routes or UI:

- [`lib/server/aptos/auth.ts`](/c:/FlashFolder/lib/server/aptos/auth.ts): wallet auth and challenge scaffolding
- [`lib/server/aptos/service.ts`](/c:/FlashFolder/lib/server/aptos/service.ts): NFT discovery and ownership verification provider selection
- [`lib/server/aptos/mock-provider.ts`](/c:/FlashFolder/lib/server/aptos/mock-provider.ts): mock NFT provider for development
- [`docs/aptos-integration.md`](/c:/FlashFolder/docs/aptos-integration.md): implementation handoff notes for real Aptos wiring
- [`docs/flashvault-onchain-architecture.md`](/c:/FlashFolder/docs/flashvault-onchain-architecture.md): optional phase-2/3 onchain architecture proposal

## Database models

Prisma schema lives in [`prisma/schema.prisma`](/c:/FlashFolder/prisma/schema.prisma).

Models:

- `User`
- `Folder`
- `File`
- `Share`
- `FileView`
- `VaultAsset`
- `VaultFile`
- `VaultAccessLog`

Important file storage fields:

- `blobKey`
- `storageProvider`
- `storageMetadata`
- `mimeType`
- `size`
- `isEncrypted`

Important vault metadata fields:

- `nftObjectId`
- `nftOwnerAddress`
- `nftMetadataSnapshot`

## Local setup

1. Install dependencies:

```bash
pnpm install
```

2. Copy envs:

```bash
cp .env.example .env
```

3. Start PostgreSQL and update `DATABASE_URL` in `.env`.

   Important:
   A Vercel-generated `.env.local` is not enough for Prisma commands unless it also includes `DATABASE_URL`.

4. Generate Prisma client:

```bash
pnpm prisma:generate
```

5. Push the schema:

```bash
pnpm db:push
```

6. Seed a demo workspace:

```bash
pnpm db:seed
```

7. Run the app:

```bash
pnpm dev
```

If you want Shelby-prep diagnostics without activating Shelby, keep:

```bash
FLASHFOLDER_STORAGE_MODE=local
```

If you want to test fallback behavior while Shelby is still scaffolded, you can set:

```bash
FLASHFOLDER_STORAGE_MODE=shelby
FLASHFOLDER_FAIL_ON_STORAGE_MISCONFIG=false
```

The app will report Shelby readiness in settings while safely falling back to local storage.

If you want to keep FlashVault fully demoable without real chain access, keep:

```bash
APTOS_AUTH_MODE=mock
APTOS_MOCK_ENABLED=true
```

## Demo behavior

Without a real Aptos wallet installed, FlashFolder uses a demo wallet address from `.env` so you can still:

- create folders
- upload files
- preview supported file types
- create share links
- inspect analytics data
- import mock NFTs into FlashVault
- upload teaser or owner-only vault content

## FlashVault behavior

FlashVault is intentionally precise about privacy:

- good framing: "private vault for Aptos NFT content"
- good framing: "owner-gated media and unlockables"
- good framing: "vault the content, not the chain record"
- avoid claiming the NFT itself becomes invisible onchain

In the current MVP:

- NFT ownership reads are normalized through `lib/server/aptos/service.ts`
- mock ownership is enabled by default with `APTOS_MOCK_ENABLED=true`
- vault uploads can be encrypted with `FLASHVAULT_ENCRYPTION_SECRET`
- protected vault content is served through verified backend routes, not public static URLs

## Aptos later

When you are ready to wire real Aptos integration:

1. Set `APTOS_AUTH_MODE="challenge"`
2. Add `APTOS_FULLNODE_URL` and/or `APTOS_INDEXER_URL`
3. Replace the scaffolded logic in [`lib/server/aptos/auth.ts`](/c:/FlashFolder/lib/server/aptos/auth.ts)
4. Replace the mock provider selection in [`lib/server/aptos/service.ts`](/c:/FlashFolder/lib/server/aptos/service.ts)
5. Keep the UI and business logic unchanged so only the provider layer changes

## Shelby later

Once Shelby early access is approved:

1. Add real Shelby env values:
   - `SHELBY_API_KEY`
   - `SHELBY_RPC_URL`
   - `SHELBY_ACCOUNT_NAMESPACE`
2. Set `FLASHFOLDER_STORAGE_MODE="shelby"`
3. Replace the TODOs in [`lib/storage/shelby-storage.ts`](/c:/FlashFolder/lib/storage/shelby-storage.ts) with real SDK calls
4. Ask in Shelby Discord for test tokens if you still need them to continue real storage tests

## Vercel notes

FlashFolder can be deployed to Vercel for preview environments, but there is one important constraint:

- `FLASHFOLDER_STORAGE_MODE=local` is only suitable for local development
- Vercel filesystem writes are ephemeral, so uploaded files will not persist between deployments or invocations

For a meaningful hosted deployment you should use:

- a managed Postgres database for `DATABASE_URL`
- Shelby storage once access is approved, or another persistent remote blob store temporarily

Current Vercel state:

- production alias is active at `https://flashfolder.vercel.app`
- the latest production deployment was ready after the most recent push to `main`
- local `pnpm db:push` and `pnpm db:seed` remain blocked in this workspace until `DATABASE_URL` is configured

Minimum Vercel environment variables:

- `DATABASE_URL`
- `NEXT_PUBLIC_APTOS_NETWORK`
- `NEXT_PUBLIC_DEFAULT_WALLET`
- `APTOS_FULLNODE_URL`
- `APTOS_INDEXER_URL`
- `APTOS_AUTH_MODE`
- `APTOS_MOCK_ENABLED`
- `FLASHFOLDER_STORAGE_MODE`
- `FLASHFOLDER_MAX_UPLOAD_MB`
- `FLASHFOLDER_FAIL_ON_STORAGE_MISCONFIG`
- `FLASHVAULT_USE_MOCK_NFTS`
- `FLASHVAULT_ENCRYPTION_SECRET`
- `SHELBY_API_KEY` when Shelby is enabled
- `SHELBY_NETWORK` when Shelby is enabled
- `SHELBY_ACCOUNT` when Shelby is enabled
- `SHELBY_RPC_URL` when Shelby is enabled
- `SHELBY_ACCOUNT_NAMESPACE` when Shelby is enabled
- `SHELBY_PRIVATE_KEY` when Shelby signer-based access is enabled

## Verification

The current repo passes:

- `pnpm lint`
- `pnpm build`

## Notes

- The empty `flashfolder-temp` directory is leftover from the initial scaffold workaround and can be removed safely.
- Prisma is pinned to `6.19.2` to preserve the conventional schema + `DATABASE_URL` workflow.
