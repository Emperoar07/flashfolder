# FlashFolder

Decentralized hot-storage workspace for instant file access, sharing, and streaming — built on Aptos with Shelby protocol as the blob layer.

**Live:** [flashfolder.vercel.app](https://flashfolder.vercel.app)

---

## What it does

- **File workspace** — Upload, organize into folders, preview (images, video, audio, PDF), and share with expiring or password-protected links
- **FlashVault** — NFT-gated content vaults. Import an Aptos NFT, attach owner-only media and unlockables, and generate collector share links. Ownership verification controls access; transfer the NFT to transfer access
- **Wallet-first auth** — Aptos wallet login with demo-wallet fallback for local dev

> FlashVault protects *content access*, not chain visibility. NFT ownership and transfers remain fully public on Aptos.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 (dark theme, DM Mono + Bebas Neue + Playfair Display) |
| Database | PostgreSQL via Prisma ORM (Neon on Vercel) |
| State | TanStack React Query |
| Wallet | `@aptos-labs/wallet-adapter-react` + `@aptos-labs/ts-sdk` |
| Storage | Pluggable adapter — local / Vercel Blob / Shelby protocol |
| Icons | Lucide React |
| Upload | react-dropzone |

---

## Project structure

```
app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout + font providers
├── globals.css                 # Dark theme tokens + grain overlay
├── dashboard/                  # File workspace
│   ├── page.tsx
│   └── folders/[id]/page.tsx
├── vault/                      # FlashVault
│   ├── page.tsx
│   └── [id]/page.tsx
├── files/[id]/page.tsx         # File detail
├── share/[token]/page.tsx      # Public share viewer
├── settings/page.tsx           # Runtime config display
└── api/                        # API routes
    ├── auth/                   #   Wallet auth + challenge
    ├── files/                  #   CRUD, upload, download, share, view
    ├── folders/                #   CRUD
    ├── vault/                  #   Assets, upload, content, shares, logs
    ├── share/                  #   Public share + password verify
    ├── me/                     #   Current user profile
    └── settings/               #   Runtime settings

components/
├── dashboard-client.tsx        # Main workspace (files, folders, metrics, upload)
├── vault-dashboard-client.tsx  # Vault overview (NFT imports, asset cards)
├── vault-asset-client.tsx      # Individual vault (preview, upload, share)
├── share-client.tsx            # Public share viewer
├── file-detail-client.tsx      # Single file page
├── file-preview.tsx            # Image/video/audio/PDF renderer
├── upload-dropzone.tsx         # Drag-and-drop file input
├── wallet-status.tsx           # Connect/disconnect + address display
├── workspace-nav.tsx           # Sidebar navigation
└── providers.tsx               # Aptos wallet + React Query

lib/
├── storage/                    # Pluggable storage layer
│   ├── types.ts                #   StorageAdapter interface
│   ├── index.ts                #   Adapter resolution
│   ├── local-storage.ts        #   Filesystem adapter (dev)
│   ├── blob-storage.ts         #   Vercel Blob adapter (staging)
│   ├── shelby-storage.ts       #   Shelby adapter entrypoint
│   └── shelby/                 #   Shelby SDK boundary
│       ├── adapter.ts
│       └── client.ts
├── server/
│   ├── aptos/                  # Aptos integration boundary
│   │   ├── auth.ts             #   Wallet auth + challenge
│   │   ├── service.ts          #   NFT discovery + ownership verification
│   │   └── mock-provider.ts    #   Mock data for local dev
│   ├── flashvault.ts           # Vault business logic
│   ├── workspace.ts            # Settings + workspace helpers
│   └── crypto.ts               # Encryption for vault uploads
├── client/
│   ├── api.ts                  # Fetch wrapper
│   ├── hooks.ts                # React Query hooks
│   └── wallet.ts               # Wallet adapter helpers
├── file-kinds.ts               # MIME → preview type mapping
├── types.ts                    # Shared TypeScript types
├── utils.ts                    # Formatting helpers
├── validation.ts               # Zod schemas
├── config.ts                   # Env config
└── prisma.ts                   # Prisma client singleton

docs/
├── developer-handoff.md        # Onboarding, blockers, next steps
├── shelby-integration.md       # Shelby adapter implementation notes
├── aptos-integration.md        # Real Aptos wiring guide
├── flashvault-onchain-architecture.md  # Phase 2/3 on-chain proposal
└── vercel-blob-integration.md  # Blob bridge documentation

prisma/
├── schema.prisma               # Database schema
└── seed.ts                     # Demo data seeder
```

---

## Database models

| Model | Purpose |
|---|---|
| `User` | Wallet-linked identity |
| `Folder` | Virtual folder tree |
| `File` | Upload metadata + blob pointer |
| `Share` | Public/private/password links |
| `FileView` | Download + preview analytics |
| `VaultAsset` | NFT-linked vault container |
| `VaultFile` | Gated file (primary, unlockable, teaser, attachment) |
| `VaultAccessLog` | Ownership checks + access events |

---

## Storage architecture

All file I/O goes through a `StorageAdapter` interface (`lib/storage/types.ts`):

```
uploadFile · downloadFile · getFileStream · getFileRange · deleteFile · listFiles
```

Three adapters exist behind one config switch:

| Mode | Adapter | Use case |
|---|---|---|
| `local` | `local-storage.ts` | Local dev (filesystem) |
| `blob` | `blob-storage.ts` | Vercel staging (durable, ~4.5 MB cap) |
| `shelby` | `shelby-storage.ts` | Production target (Shelby protocol) |

Set `FLASHFOLDER_STORAGE_MODE` to switch. The app falls back to `local` if the requested adapter isn't configured.

---

## Quick start

```bash
# 1. Install
pnpm install

# 2. Environment
cp .env.example .env
# Set DATABASE_URL to a PostgreSQL instance

# 3. Database
pnpm prisma:generate
pnpm db:push
pnpm db:seed

# 4. Run
pnpm dev
```

Open [localhost:3000](http://localhost:3000).

---

## Environment variables

### Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_APTOS_NETWORK` | `testnet` / `devnet` / `mainnet` |
| `NEXT_PUBLIC_DEFAULT_WALLET` | Demo wallet address for fallback |
| `FLASHFOLDER_STORAGE_MODE` | `local` / `blob` / `shelby` |

### Storage (Blob)

| Variable | Description |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob store token (must be private store) |

### Storage (Shelby)

| Variable | Description |
|---|---|
| `SHELBY_API_KEY` | Shelby API key |
| `SHELBY_RPC_URL` | Shelby RPC endpoint |
| `SHELBY_NETWORK` | `shelbynet` / `localhost` |
| `SHELBY_ACCOUNT` | Shelby account address |
| `SHELBY_ACCOUNT_NAMESPACE` | Storage namespace |
| `SHELBY_PRIVATE_KEY` | Signer key (when needed) |

### Aptos

| Variable | Description |
|---|---|
| `APTOS_AUTH_MODE` | `mock` / `challenge` |
| `APTOS_MOCK_ENABLED` | `true` for demo NFT data |
| `APTOS_FULLNODE_URL` | Aptos fullnode RPC |
| `APTOS_INDEXER_URL` | Aptos indexer GraphQL |
| `FLASHVAULT_USE_MOCK_NFTS` | `true` for mock NFT imports |
| `FLASHVAULT_ENCRYPTION_SECRET` | AES key for vault file encryption |

### Other

| Variable | Description |
|---|---|
| `FLASHFOLDER_MAX_UPLOAD_MB` | Upload size limit (default 50) |
| `FLASHFOLDER_FAIL_ON_STORAGE_MISCONFIG` | `true` to hard-fail instead of fallback |

---

## Demo mode

Without a real Aptos wallet extension, the app uses a demo wallet address from env and mock NFT data. You can:

- Create folders and upload files
- Preview images, video, audio, PDFs
- Create share links (public, private, password)
- Import mock NFTs into FlashVault
- Upload teaser/owner-only vault content
- Verify mock ownership and view access logs

---

## Deployment (Vercel)

The app auto-deploys from `main` to [flashfolder.vercel.app](https://flashfolder.vercel.app).

**Important:** `local` storage mode is ephemeral on Vercel. Use `blob` for durable uploads until Shelby access is approved.

Minimum Vercel env vars: `DATABASE_URL`, `NEXT_PUBLIC_APTOS_NETWORK`, `NEXT_PUBLIC_DEFAULT_WALLET`, `FLASHFOLDER_STORAGE_MODE`, `APTOS_AUTH_MODE`, `APTOS_MOCK_ENABLED`.

---

## Roadmap

- [ ] Shelby SDK integration (blocked on early access approval)
- [ ] Real Aptos wallet auth (challenge-response signing)
- [ ] Real NFT ownership via Aptos Indexer
- [ ] Micropayment-gated content via Shelby paid reads
- [ ] Cross-chain identity (Ethereum/Solana via Shelby kits)
- [ ] On-chain vault registry (Move contract)

---

## Verification

```bash
pnpm lint     # ESLint
pnpm build    # Production build
pnpm db:push  # Schema sync
pnpm db:seed  # Demo data
```

---

## License

MIT
