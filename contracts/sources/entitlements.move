/// FlashVault entitlements — lightweight access grants.
///
/// Allows the vault registrant to grant/revoke access entitlements
/// to specific holder addresses. The backend reads entitlement state
/// before serving premium content.
module flashvault::entitlements {
    use std::signer;
    use aptos_std::smart_table::{Self, SmartTable};
    use aptos_framework::timestamp;

    use flashvault::errors;
    use flashvault::events;
    use flashvault::registry;

    // ── Entitlement record ──

    struct Entitlement has store, drop, copy {
        grantor: address,
        granted_at_us: u64,
    }

    // ── Per-vault entitlement table (stored under the deployer) ──

    struct EntitlementStore has key {
        /// Key: (nft_object_id, holder) packed as a SmartTable composite.
        /// We use a nested table: nft_object_id → (holder → Entitlement).
        tables: SmartTable<address, SmartTable<address, Entitlement>>,
    }

    // ── Init ──

    fun init_module(deployer: &signer) {
        move_to(deployer, EntitlementStore {
            tables: smart_table::new(),
        });
    }

    // ── Entry functions ──

    /// Grant an entitlement for `holder` to access the vault content
    /// anchored to `nft_object_id`. Only the vault registrant may call.
    public entry fun grant_entitlement(
        caller: &signer,
        nft_object_id: address,
        holder: address,
    ) acquires EntitlementStore {
        let grantor = signer::address_of(caller);
        assert_is_vault_registrant(nft_object_id, grantor);

        let store = borrow_global_mut<EntitlementStore>(@flashvault);

        // Ensure per-vault table exists.
        if (!smart_table::contains(&store.tables, nft_object_id)) {
            smart_table::add(&mut store.tables, nft_object_id, smart_table::new());
        };

        let vault_table = smart_table::borrow_mut(&mut store.tables, nft_object_id);
        assert!(
            !smart_table::contains(vault_table, holder),
            errors::entitlement_exists(),
        );

        smart_table::add(vault_table, holder, Entitlement {
            grantor,
            granted_at_us: timestamp::now_microseconds(),
        });

        events::emit_entitlement_granted(nft_object_id, grantor, holder);
    }

    /// Revoke a previously granted entitlement.
    public entry fun revoke_entitlement(
        caller: &signer,
        nft_object_id: address,
        holder: address,
    ) acquires EntitlementStore {
        let grantor = signer::address_of(caller);
        assert_is_vault_registrant(nft_object_id, grantor);

        let store = borrow_global_mut<EntitlementStore>(@flashvault);
        assert!(
            smart_table::contains(&store.tables, nft_object_id),
            errors::entitlement_not_found(),
        );

        let vault_table = smart_table::borrow_mut(&mut store.tables, nft_object_id);
        assert!(
            smart_table::contains(vault_table, holder),
            errors::entitlement_not_found(),
        );

        smart_table::remove(vault_table, holder);

        events::emit_entitlement_revoked(nft_object_id, grantor, holder);
    }

    // ── View functions ──

    #[view]
    /// Returns true if `holder` has an active entitlement for the vault
    /// anchored to `nft_object_id`.
    public fun has_entitlement(
        nft_object_id: address,
        holder: address,
    ): bool acquires EntitlementStore {
        let store = borrow_global<EntitlementStore>(@flashvault);
        if (!smart_table::contains(&store.tables, nft_object_id)) {
            return false
        };
        let vault_table = smart_table::borrow(&store.tables, nft_object_id);
        smart_table::contains(vault_table, holder)
    }

    // ── Internal helpers ──

    /// Aborts if `caller_addr` is not the registrant of the vault for `nft_object_id`.
    fun assert_is_vault_registrant(nft_object_id: address, caller_addr: address) {
        assert!(registry::has_vault(nft_object_id), errors::vault_not_found());
        let (registrant, _, _, _, _, _, _) = registry::get_vault_info(nft_object_id);
        assert!(registrant == caller_addr, errors::not_registrant());
    }
}
