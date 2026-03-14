# FlashFolder Developer Handoff

This note is the fastest way for the next developer to get oriented and continue work without re-discovering the current state.

## Product summary

FlashFolder is a decentralized file workspace built around:

- PostgreSQL + Prisma for product metadata
- pluggable blob storage behind a provider-neutral adapter
- Aptos wallet and NFT ownership abstraction
- FlashVault as an optional private vault for Aptos NFT content

Important product truth:

- FlashVault does not hide NFT ownership onchain
- it protects private media, unlockables, and gated access
- preferred language:
  - private vault for Aptos NFT content
  - owner-gated media and unlockables
  - vault the content, not the chain record

## Core links

- GitHub repo: `https://github.com/Emperoar07/flashfolder`
- Production app: `https://flashfolder.vercel.app`
- Latest verified deployment during handoff: `https://flashfolder-4pocztgnx-emperoar007s-projects.vercel.app`
- Vercel project: `emperoar007s-projects/flashfolder`
- Shelby docs: `https://docs.shelby.xyz/`
- Shelby protocol docs: `https://docs.shelby.xyz/protocol`
- Shelby early access: `https://developers.shelby.xyz/dashboard`

## Current architecture

### App layer

- Next.js 16 app router
- React Query for data fetching
- Prisma for metadata and relations
- API routes under `app/api/*`

### Storage layer

Storage is intentionally abstracted:

- interface: [lib/storage/types.ts](/c:/FlashFolder/lib/storage/types.ts)
- runtime selector: [lib/storage/index.ts](/c:/FlashFolder/lib/storage/index.ts)

Available adapters:

- local: [lib/storage/local-storage.ts](/c:/FlashFolder/lib/storage/local-storage.ts)
- Vercel Blob bridge: [lib/storage/blob-storage.ts](/c:/FlashFolder/lib/storage/blob-storage.ts)
- Shelby scaffold: [lib/storage/shelby-storage.ts](/c:/FlashFolder/lib/storage/shelby-storage.ts)

### Aptos layer

- auth scaffold: [lib/server/aptos/auth.ts](/c:/FlashFolder/lib/server/aptos/auth.ts)
- provider runtime: [lib/server/aptos/service.ts](/c:/FlashFolder/lib/server/aptos/service.ts)
- mock provider: [lib/server/aptos/mock-provider.ts](/c:/FlashFolder/lib/server/aptos/mock-provider.ts)

### Product services

- workspace logic: [lib/server/workspace.ts](/c:/FlashFolder/lib/server/workspace.ts)
- flashvault logic: [lib/server/flashvault.ts](/c:/FlashFolder/lib/server/flashvault.ts)

## Database status

Neon is connected and working.

Confirmed locally:

- `pnpm db:push` succeeds
- `pnpm db:seed` succeeds

Seeded baseline at the time of handoff:

- 1 user
- 2 folders
- 2 files
- 1 vault asset

Relevant schema:

- [prisma/schema.prisma](/c:/FlashFolder/prisma/schema.prisma)
- [prisma/seed.ts](/c:/FlashFolder/prisma/seed.ts)

## Environment variables

Important variables:

- `DATABASE_URL`
- `FLASHFOLDER_STORAGE_MODE`
- `BLOB_READ_WRITE_TOKEN`
- `FLASHFOLDER_MAX_UPLOAD_MB`
- `FLASHFOLDER_FAIL_ON_STORAGE_MISCONFIG`
- `NEXT_PUBLIC_APTOS_NETWORK`
- `APTOS_AUTH_MODE`
- `APTOS_MOCK_ENABLED`
- `FLASHVAULT_USE_MOCK_NFTS`
- `FLASHVAULT_ENCRYPTION_SECRET`
- `SHELBY_API_KEY`
- `SHELBY_RPC_URL`
- `SHELBY_ACCOUNT_NAMESPACE`

Template:

- [.env.example](/c:/FlashFolder/.env.example)

## What is working

- landing page, dashboard, folder view, file detail, shared page, vault pages, settings
- Neon-backed metadata persistence
- file metadata, folders, shares, analytics, vault records
- mock Aptos discovery and ownership flow
- FlashVault protected backend route structure
- production deployment on Vercel
- Blob-ready code path for temporary storage

## What is not finished

### 1. Production-safe file uploads are not switched on yet

Reason:

- the connected Vercel Blob store was created as `public`
- FlashFolder needs a `private` store because FlashVault content must remain backend-gated
- because of that, Vercel envs were set back to:
  - `FLASHFOLDER_STORAGE_MODE=local`

Impact:

- Neon metadata is persistent
- production file writes are still ephemeral on Vercel

### 2. Shelby is still scaffolded

- adapter exists
- runtime selection exists
- docs and boundaries are ready
- real SDK calls are not implemented yet

### 3. Real Aptos auth and ownership are still scaffolded

- mock mode is active
- UI and service boundaries are ready
- challenge-response and real NFT ownership reads still need implementation

## Best next step

### If the goal is the fastest stable hosted demo

Use a `private` Vercel Blob store temporarily.

Why:

- minimal code change left
- existing Blob adapter is already implemented
- works well for small files, docs, images, teaser assets, and collector unlockables

But:

- Vercel server uploads are effectively capped around `4.5 MB`
- this is not the final storage path for large active files or streaming-heavy usage

### If the goal is the real product direction

Move to Shelby as soon as access is granted.

Why:

- FlashFolder's value is active-file access, previews, and streaming
- FlashVault will eventually benefit from a storage system that better fits larger protected media
- Shelby is the intended long-term hot-storage layer

### Practical recommendation

1. Keep Neon for metadata.
2. Use private Vercel Blob only as a temporary bridge.
3. Keep Aptos in mock mode until storage is stable.
4. Implement real Shelby next.
5. After Shelby works, replace mock Aptos auth/ownership.

## Exact next steps for the next developer

### Option A: finish temporary Blob mode

1. In Vercel Storage, create a `private` Blob store or recreate the current one as private.
2. Link it to the `flashfolder` project for Development, Preview, and Production.
3. Pull envs locally:

```powershell
vercel env pull .env --yes
```

4. Confirm `BLOB_READ_WRITE_TOKEN` exists in `.env`.
5. Set project envs so `FLASHFOLDER_STORAGE_MODE=blob`.
6. Run:

```powershell
pnpm db:seed
pnpm lint
pnpm build
vercel --prod -y
```

7. Verify:
  - `/api/settings`
  - `/api/share/flash-demo-share`
  - `/share/flash-demo-share`

### Option B: move into Shelby implementation

1. Get Shelby early access and credentials.
2. Implement real client setup in [lib/storage/shelby/client.ts](/c:/FlashFolder/lib/storage/shelby/client.ts).
3. Implement upload/download/range logic in [lib/storage/shelby/adapter.ts](/c:/FlashFolder/lib/storage/shelby/adapter.ts).
4. Switch `FLASHFOLDER_STORAGE_MODE=shelby` only after integration tests pass.
5. Keep Blob or local as fallback until Shelby is proven stable.

## Current runtime truth

At handoff time:

- production alias is live
- database is real and persistent on Neon
- blob integration code is present
- blob store token exists in Vercel
- production is intentionally still running `local` storage mode because the currently linked Blob store is public

## Important docs

- main project readme: [README.md](/c:/FlashFolder/README.md)
- Blob bridge notes: [docs/vercel-blob-integration.md](/c:/FlashFolder/docs/vercel-blob-integration.md)
- Shelby notes: [docs/shelby-integration.md](/c:/FlashFolder/docs/shelby-integration.md)
- Aptos notes: [docs/aptos-integration.md](/c:/FlashFolder/docs/aptos-integration.md)
- FlashVault onchain proposal: [docs/flashvault-onchain-architecture.md](/c:/FlashFolder/docs/flashvault-onchain-architecture.md)

## Last verified commands

```powershell
pnpm lint
pnpm build
pnpm db:push
pnpm db:seed
vercel --prod -y
```

## Last verified commit

- `31f9020` - `Add Vercel Blob storage bridge`

## Notes for onboarding

- Do not remove the storage abstraction to "speed up" integration work.
- Do not make FlashVault depend on direct public file URLs.
- Keep storage logic, Aptos logic, and product logic separated.
- Treat Blob as a bridge and Shelby as the intended long-term storage layer.
