# FlashVault Onchain Architecture Proposal

This is a phase-2/phase-3 design note for Aptos-side FlashVault support.

## Product truth

FlashVault is a private vault for Aptos NFT content.

It does:

- protect owner-gated media and unlockables
- optionally anchor vault existence onchain
- optionally emit access or entitlement signals

It does not:

- hide NFT ownership from the blockchain
- hide the NFT itself from indexers
- store large or sensitive media onchain

## Onchain vs offchain split

Onchain:

- vault registry anchor for NFT object IDs
- optional teaser/public state anchor
- optional content version or manifest commitment hash
- optional entitlement or receipt events

Postgres/app layer:

- folder structure
- share tokens and password hashes
- audit logs
- vault access rules
- session/auth state
- vault metadata snapshots

Shelby/offchain storage:

- media files
- teaser assets
- encrypted unlockables
- attachments
- decryption material references

## Minimal phase-2 module idea

Suggested Move package layout:

- `sources/flashvault_registry.move`
- `sources/events.move`
- `sources/errors.move`

Registry resource responsibilities:

- anchor that a vault exists for a given NFT object ID
- store registrant address
- store teaser enabled flag
- optionally store content commitment hash
- emit update events

Suggested registry fields:

- `nft_object_id`
- `registrant`
- `vault_status`
- `public_teaser_enabled`
- `content_commitment`
- `created_at`
- `updated_at`

## Optional phase-3 entitlement layer

Suggested module:

- `sources/flashvault_entitlements.move`

Purpose:

- creator grants a lightweight entitlement for special unlockables
- backend can read entitlement state before serving extra content

Keep it lightweight:

- event-driven or small resource entries
- no secrets onchain
- no large metadata onchain

## Suggested entry functions

Registry:

- `register_vault`
- `update_teaser_mode`
- `update_content_commitment`
- `set_vault_status`
- `has_vault`
- `get_vault_info`

Entitlements:

- `grant_entitlement`
- `revoke_entitlement`
- `has_entitlement`

## Event strategy

Useful events:

- `VaultRegistered`
- `VaultUpdated`
- `TeaserModeChanged`
- `EntitlementGranted`
- `EntitlementRevoked`

Backend usage:

- sync registry state
- verify a vault anchor exists
- track teaser/public changes
- read entitlement state for premium collector flows

## Security notes

- only the registrant or current NFT owner should be allowed to update the registry
- ownership should still be re-checked offchain for content access
- do not put encrypted file keys or raw secret material onchain
- avoid locking user NFTs unless that is an intentional separate product

## Recommended rollout

Phase 1:

- keep FlashFolder and FlashVault mostly offchain
- use Aptos ownership verification only

Phase 2:

- add minimal onchain vault registry

Phase 3:

- add optional entitlement receipts if there is a clear product need

This keeps gas costs low, avoids privacy leaks, and matches the actual product boundary: vault the content, not the chain record.
