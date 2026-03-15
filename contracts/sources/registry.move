/// FlashVault on-chain vault registry.
///
/// Anchors vault existence for a given Aptos NFT object ID.
/// Stores registrant, teaser mode, content commitment hash,
/// and active status. Emits events for backend sync.
module flashvault::registry {
    use std::signer;
    use std::string::String;
    use aptos_std::smart_table::{Self, SmartTable};
    use aptos_framework::timestamp;

    use flashvault::errors;
    use flashvault::events;

    // ── Vault record ──

    struct VaultRecord has store, drop, copy {
        registrant: address,
        collection_name: String,
        teaser_enabled: bool,
        content_commitment: String,
        active: bool,
        created_at_us: u64,
        updated_at_us: u64,
    }

    // ── Global registry (stored under the deployer account) ──

    struct VaultRegistry has key {
        vaults: SmartTable<address, VaultRecord>,
        vault_count: u64,
    }

    // ── Init ──

    /// Called once after publish. Creates the empty registry under the deployer.
    fun init_module(deployer: &signer) {
        move_to(deployer, VaultRegistry {
            vaults: smart_table::new(),
            vault_count: 0,
        });
    }

    // ── Entry functions ──

    /// Register a new vault for an NFT object ID.
    public entry fun register_vault(
        caller: &signer,
        nft_object_id: address,
        collection_name: String,
        teaser_enabled: bool,
        content_commitment: String,
    ) acquires VaultRegistry {
        let registry = borrow_global_mut<VaultRegistry>(@flashvault);
        assert!(
            !smart_table::contains(&registry.vaults, nft_object_id),
            errors::vault_already_exists(),
        );

        let now = timestamp::now_microseconds();
        let registrant = signer::address_of(caller);

        smart_table::add(&mut registry.vaults, nft_object_id, VaultRecord {
            registrant,
            collection_name,
            teaser_enabled,
            content_commitment,
            active: true,
            created_at_us: now,
            updated_at_us: now,
        });
        registry.vault_count = registry.vault_count + 1;

        events::emit_vault_registered(
            nft_object_id,
            registrant,
            collection_name,
            teaser_enabled,
        );
    }

    /// Update the content commitment hash (e.g. SHA-256 of the vault manifest).
    public entry fun update_content_commitment(
        caller: &signer,
        nft_object_id: address,
        new_commitment: String,
    ) acquires VaultRegistry {
        let registry = borrow_global_mut<VaultRegistry>(@flashvault);
        assert!(
            smart_table::contains(&registry.vaults, nft_object_id),
            errors::vault_not_found(),
        );

        let record = smart_table::borrow_mut(&mut registry.vaults, nft_object_id);
        let registrant = signer::address_of(caller);
        assert!(record.registrant == registrant, errors::not_registrant());
        assert!(record.active, errors::vault_inactive());

        record.content_commitment = new_commitment;
        record.updated_at_us = timestamp::now_microseconds();

        events::emit_vault_updated(nft_object_id, registrant, new_commitment);
    }

    /// Toggle teaser mode.
    public entry fun update_teaser_mode(
        caller: &signer,
        nft_object_id: address,
        teaser_enabled: bool,
    ) acquires VaultRegistry {
        let registry = borrow_global_mut<VaultRegistry>(@flashvault);
        assert!(
            smart_table::contains(&registry.vaults, nft_object_id),
            errors::vault_not_found(),
        );

        let record = smart_table::borrow_mut(&mut registry.vaults, nft_object_id);
        let registrant = signer::address_of(caller);
        assert!(record.registrant == registrant, errors::not_registrant());
        assert!(record.active, errors::vault_inactive());

        record.teaser_enabled = teaser_enabled;
        record.updated_at_us = timestamp::now_microseconds();

        events::emit_teaser_mode_changed(nft_object_id, registrant, teaser_enabled);
    }

    /// Activate or deactivate the vault.
    public entry fun set_vault_status(
        caller: &signer,
        nft_object_id: address,
        active: bool,
    ) acquires VaultRegistry {
        let registry = borrow_global_mut<VaultRegistry>(@flashvault);
        assert!(
            smart_table::contains(&registry.vaults, nft_object_id),
            errors::vault_not_found(),
        );

        let record = smart_table::borrow_mut(&mut registry.vaults, nft_object_id);
        let registrant = signer::address_of(caller);
        assert!(record.registrant == registrant, errors::not_registrant());

        record.active = active;
        record.updated_at_us = timestamp::now_microseconds();

        events::emit_vault_status_changed(nft_object_id, registrant, active);
    }

    // ── View functions ──

    #[view]
    /// Returns true if a vault is registered for the given NFT object ID.
    public fun has_vault(nft_object_id: address): bool acquires VaultRegistry {
        let registry = borrow_global<VaultRegistry>(@flashvault);
        smart_table::contains(&registry.vaults, nft_object_id)
    }

    #[view]
    /// Returns vault info as a tuple: (registrant, collection_name, teaser_enabled,
    /// content_commitment, active, created_at_us, updated_at_us).
    public fun get_vault_info(
        nft_object_id: address,
    ): (address, String, bool, String, bool, u64, u64) acquires VaultRegistry {
        let registry = borrow_global<VaultRegistry>(@flashvault);
        assert!(
            smart_table::contains(&registry.vaults, nft_object_id),
            errors::vault_not_found(),
        );

        let record = smart_table::borrow(&registry.vaults, nft_object_id);
        (
            record.registrant,
            record.collection_name,
            record.teaser_enabled,
            record.content_commitment,
            record.active,
            record.created_at_us,
            record.updated_at_us,
        )
    }

    #[view]
    /// Returns the total number of registered vaults.
    public fun vault_count(): u64 acquires VaultRegistry {
        let registry = borrow_global<VaultRegistry>(@flashvault);
        registry.vault_count
    }
}
