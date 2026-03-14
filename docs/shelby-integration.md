# Shelby Integration Notes

This document describes where Shelby plugs into FlashFolder without changing app-level business logic.

## Current boundary

FlashFolder and FlashVault only talk to storage through the adapter layer in [`lib/storage/types.ts`](/c:/FlashFolder/lib/storage/types.ts).

Active adapter selection lives in [`lib/storage/index.ts`](/c:/FlashFolder/lib/storage/index.ts).

Shelby-specific code is isolated under:

- [`lib/storage/shelby/client.ts`](/c:/FlashFolder/lib/storage/shelby/client.ts)
- [`lib/storage/shelby/adapter.ts`](/c:/FlashFolder/lib/storage/shelby/adapter.ts)

## Services that already depend on the storage abstraction

- Core file uploads: [`lib/server/workspace.ts`](/c:/FlashFolder/lib/server/workspace.ts)
- Vault uploads and protected reads: [`lib/server/flashvault.ts`](/c:/FlashFolder/lib/server/flashvault.ts)
- File streaming route: [`app/api/files/[id]/download/route.ts`](/c:/FlashFolder/app/api/files/[id]/download/route.ts)
- Vault protected content route: [`app/api/vault/assets/[id]/content/route.ts`](/c:/FlashFolder/app/api/vault/assets/[id]/content/route.ts)

## What the adapter must support

The storage interface is intentionally provider-neutral:

- `uploadFile`
- `downloadFile`
- `getFileStream`
- `getFileRange`
- `deleteFile`
- `listFiles`
- `getMetadata`

That covers:

- standard workspace uploads
- vault uploads with optional encryption before storage
- preview and download flows
- media range requests
- future provider metadata like etags or blob IDs

## Real Shelby implementation points

### 1. Client initialization

Implement real SDK bootstrapping in [`lib/storage/shelby/client.ts`](/c:/FlashFolder/lib/storage/shelby/client.ts).

Expected env inputs:

- `SHELBY_API_KEY`
- `SHELBY_RPC_URL`
- `SHELBY_ACCOUNT_NAMESPACE`
- `SHELBY_NETWORK`
- `SHELBY_ACCOUNT`
- `SHELBY_PRIVATE_KEY`

If the final Shelby auth model uses a different signer flow, replace only this config/client layer.

### 2. Upload flow

Implement `uploadFile` in [`lib/storage/shelby/adapter.ts`](/c:/FlashFolder/lib/storage/shelby/adapter.ts).

Required behavior:

- accept the app-generated `blobKey`
- upload the raw or encrypted bytes
- return provider metadata that can be persisted in `File.storageMetadata`
- preserve `blobKey` as the app-level lookup key unless Shelby requires a returned canonical object key

### 3. Download and streaming

Implement these methods in the same Shelby adapter:

- `downloadFile`
- `getFileStream`
- `getFileRange`
- `getMetadata`

The file route already supports byte ranges through the adapter. The vault route supports:

- direct range streaming for unencrypted stored objects
- full-buffer decrypt-and-return flow for encrypted vault content

That split is intentional. Encrypted vault files need a transform step before response.

### 4. Error mapping

Normalize provider failures with [`lib/storage/errors.ts`](/c:/FlashFolder/lib/storage/errors.ts).

Map Shelby failures into:

- `NOT_CONFIGURED`
- `NOT_IMPLEMENTED`
- `NOT_FOUND`
- `INVALID_RANGE`
- `UNAUTHORIZED`
- `UNAVAILABLE`
- `UPLOAD_FAILED`
- `DOWNLOAD_FAILED`
- `DELETE_FAILED`

Do not leak raw SDK or RPC errors directly to API callers.

## File persistence model

`File` records now store:

- `blobKey`
- `storageProvider`
- `storageMetadata`
- `mimeType`
- `size`
- `isEncrypted`

This matters because old local files and future Shelby files can coexist. Reads resolve the adapter from each file's stored provider instead of assuming the current global mode.

## FlashVault compatibility

FlashVault keeps encryption storage-agnostic:

1. raw file input
2. optional encryption transform
3. adapter upload
4. metadata persistence
5. verified backend access

Protected vault content must continue to flow through backend verification even after Shelby is active. Do not replace protected routes with direct public object URLs.

## First real tests once access is granted

1. Upload a normal workspace file and confirm `storageProvider=SHELBY`.
2. Preview image and video files through `/api/files/:id/download`.
3. Verify byte-range playback for large media files.
4. Create a public and password share and confirm both still work.
5. Upload an unencrypted teaser file to FlashVault and confirm preview works through the vault route.
6. Upload an encrypted owner-only vault file and confirm the decrypting route still returns correct content.
7. Confirm missing Shelby config fails early with a clear message.
8. Confirm old local files still read correctly after Shelby becomes active.

## Safe rollout suggestion

1. Keep `FLASHFOLDER_STORAGE_MODE=local` while implementing the real Shelby adapter.
2. Add the real SDK logic behind the existing Shelby adapter only.
3. Test uploads and reads in a non-production environment.
4. Switch `FLASHFOLDER_STORAGE_MODE=shelby` only after end-to-end validation.
