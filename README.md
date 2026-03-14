# FlashFolder

FlashFolder is a decentralized hot-storage workspace for instant file access, sharing, and streaming.

It is built as a Shelby-ready MVP:

- PostgreSQL + Prisma store all product metadata
- local mock storage keeps uploads demoable today
- a Shelby adapter scaffold is already isolated behind the same storage interface
- Aptos wallet login is wired in with a demo-wallet fallback for local UX

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

## Key routes

Pages:

- `/`
- `/dashboard`
- `/dashboard/folders/:id`
- `/files/:id`
- `/share/:token`
- `/settings`

API:

- `POST /api/auth/wallet`
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
- [`lib/storage/shelby-storage.ts`](/c:/FlashFolder/lib/storage/shelby-storage.ts): placeholder adapter with matching signatures and TODOs

## Database models

Prisma schema lives in [`prisma/schema.prisma`](/c:/FlashFolder/prisma/schema.prisma).

Models:

- `User`
- `Folder`
- `File`
- `Share`
- `FileView`

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

## Demo behavior

Without a real Aptos wallet installed, FlashFolder uses a demo wallet address from `.env` so you can still:

- create folders
- upload files
- preview supported file types
- create share links
- inspect analytics data

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

Minimum Vercel environment variables:

- `DATABASE_URL`
- `NEXT_PUBLIC_APTOS_NETWORK`
- `NEXT_PUBLIC_DEFAULT_WALLET`
- `FLASHFOLDER_STORAGE_MODE`
- `FLASHFOLDER_MAX_UPLOAD_MB`
- `SHELBY_API_KEY` when Shelby is enabled
- `SHELBY_RPC_URL` when Shelby is enabled
- `SHELBY_ACCOUNT_NAMESPACE` when Shelby is enabled

## Verification

The current repo passes:

- `pnpm lint`
- `pnpm build`

## Notes

- The empty `flashfolder-temp` directory is leftover from the initial scaffold workaround and can be removed safely.
- Prisma is pinned to `6.19.2` to preserve the conventional schema + `DATABASE_URL` workflow.
