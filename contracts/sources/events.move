/// FlashVault on-chain events.
module flashvault::events {
    use std::string::String;
    use aptos_framework::event;

    #[event]
    struct VaultRegistered has drop, store {
        nft_object_id: address,
        registrant: address,
        collection_name: String,
        teaser_enabled: bool,
    }

    #[event]
    struct VaultUpdated has drop, store {
        nft_object_id: address,
        registrant: address,
        content_commitment: String,
    }

    #[event]
    struct VaultStatusChanged has drop, store {
        nft_object_id: address,
        registrant: address,
        active: bool,
    }

    #[event]
    struct TeaserModeChanged has drop, store {
        nft_object_id: address,
        registrant: address,
        teaser_enabled: bool,
    }

    #[event]
    struct EntitlementGranted has drop, store {
        nft_object_id: address,
        grantor: address,
        holder: address,
    }

    #[event]
    struct EntitlementRevoked has drop, store {
        nft_object_id: address,
        grantor: address,
        holder: address,
    }

    // ── Public emitters ──

    public fun emit_vault_registered(
        nft_object_id: address,
        registrant: address,
        collection_name: String,
        teaser_enabled: bool,
    ) {
        event::emit(VaultRegistered {
            nft_object_id,
            registrant,
            collection_name,
            teaser_enabled,
        });
    }

    public fun emit_vault_updated(
        nft_object_id: address,
        registrant: address,
        content_commitment: String,
    ) {
        event::emit(VaultUpdated {
            nft_object_id,
            registrant,
            content_commitment,
        });
    }

    public fun emit_vault_status_changed(
        nft_object_id: address,
        registrant: address,
        active: bool,
    ) {
        event::emit(VaultStatusChanged {
            nft_object_id,
            registrant,
            active,
        });
    }

    public fun emit_teaser_mode_changed(
        nft_object_id: address,
        registrant: address,
        teaser_enabled: bool,
    ) {
        event::emit(TeaserModeChanged {
            nft_object_id,
            registrant,
            teaser_enabled,
        });
    }

    public fun emit_entitlement_granted(
        nft_object_id: address,
        grantor: address,
        holder: address,
    ) {
        event::emit(EntitlementGranted {
            nft_object_id,
            grantor,
            holder,
        });
    }

    public fun emit_entitlement_revoked(
        nft_object_id: address,
        grantor: address,
        holder: address,
    ) {
        event::emit(EntitlementRevoked {
            nft_object_id,
            grantor,
            holder,
        });
    }
}
