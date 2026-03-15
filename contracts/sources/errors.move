/// FlashVault error codes.
module flashvault::errors {

    /// Caller is not the registrant of the vault.
    const E_NOT_REGISTRANT: u64 = 1;

    /// A vault already exists for this NFT object ID.
    const E_VAULT_ALREADY_EXISTS: u64 = 2;

    /// No vault found for the given NFT object ID.
    const E_VAULT_NOT_FOUND: u64 = 3;

    /// The vault has been deactivated.
    const E_VAULT_INACTIVE: u64 = 4;

    /// Entitlement already exists for this holder + vault.
    const E_ENTITLEMENT_EXISTS: u64 = 5;

    /// No entitlement found for this holder + vault.
    const E_ENTITLEMENT_NOT_FOUND: u64 = 6;

    public fun not_registrant(): u64 { E_NOT_REGISTRANT }
    public fun vault_already_exists(): u64 { E_VAULT_ALREADY_EXISTS }
    public fun vault_not_found(): u64 { E_VAULT_NOT_FOUND }
    public fun vault_inactive(): u64 { E_VAULT_INACTIVE }
    public fun entitlement_exists(): u64 { E_ENTITLEMENT_EXISTS }
    public fun entitlement_not_found(): u64 { E_ENTITLEMENT_NOT_FOUND }
}
