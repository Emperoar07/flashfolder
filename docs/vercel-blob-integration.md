# Vercel Blob Integration Notes

This document describes the temporary production-safe storage path for FlashFolder before Shelby access is live.

## Why this exists

FlashFolder metadata now lives in Neon, but `local` storage is still ephemeral on Vercel. The Blob adapter keeps uploads durable without changing the core business logic.

## Integration boundary

The Blob adapter is isolated in [`lib/storage/blob-storage.ts`](/c:/FlashFolder/lib/storage/blob-storage.ts).

Runtime selection still lives in [`lib/storage/index.ts`](/c:/FlashFolder/lib/storage/index.ts), so the app layer continues to call the provider-neutral storage interface in [`lib/storage/types.ts`](/c:/FlashFolder/lib/storage/types.ts).

## Required env

- `FLASHFOLDER_STORAGE_MODE=blob`
- `BLOB_READ_WRITE_TOKEN=...`

The connected Blob store itself must be configured as `private`.

## Current behavior

- uploads use private Vercel Blob objects
- normal downloads and previews still flow through backend routes
- byte-range requests are forwarded through authenticated Blob fetches
- FlashVault encrypted files are still decrypted in the backend before response
- file records store `storageProvider=BLOB`, so Blob and local files can coexist

## Important limitation

Server-side uploads on Vercel are effectively capped around `4.5 MB`.

That makes Blob a good temporary production-safe adapter for:

- docs
- images
- small audio/video assets
- teaser content
- collector unlockables

It is not the final answer for larger Shelby-style hot-storage workloads.

## Recommended rollout

1. Connect a Vercel Blob store to the project.
2. Set `FLASHFOLDER_STORAGE_MODE=blob`.
3. Redeploy the app.
4. Rerun `pnpm db:seed` so the demo files are uploaded into Blob instead of local disk.
5. Confirm `/api/share/flash-demo-share` and `/share/flash-demo-share` still resolve.
6. Keep Shelby as the next storage step for larger active files and streaming-heavy workloads.
