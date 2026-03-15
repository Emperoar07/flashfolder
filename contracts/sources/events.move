/// FlashVault on-chain events.
module flashvault::events {
    use std::string::String;

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

    // ── Public constructors ──

    public fun vault_registered(
        nft_object_id: address,
        registrant: address,
        collection_name: String,
        teaser_enabled: bool,
    ): VaultRegistered {
        VaultRegistered { nft_object_id, registrant, collection_name, teaser_enabled }
    }

    public fun vault_updated(
        nft_object_id: address,
        registrant: address,
        content_commitment: String,
    ): VaultUpdated {
        VaultUpdated { nft_object_id, registrant, content_commitment }
    }

    public fun vault_status_changed(
        nft_object_id: address,
        registrant: address,
        active: bool,
    ): VaultStatusChanged {
        VaultStatusChanged { nft_object_id, registrant, active }
    }

    public fun teaser_mode_changed(
        nft_object_id: address,
        registrant: address,
        teaser_enabled: bool,
    ): TeaserModeChanged {
        TeaserModeChanged { nft_object_id, registrant, teaser_enabled }
    }

    public fun entitlement_granted(
        nft_object_id: address,
        grantor: address,
        holder: address,
    ): EntitlementGranted {
        EntitlementGranted { nft_object_id, grantor, holder }
    }

    public fun entitlement_revoked(
        nft_object_id: address,
        grantor: address,
        holder: address,
    ): EntitlementRevoked {
        EntitlementRevoked { nft_object_id, grantor, holder }
    }
}
