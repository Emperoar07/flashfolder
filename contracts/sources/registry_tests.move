/// Unit tests for the FlashVault registry + entitlements modules.
#[test_only]
module flashvault::registry_tests {
    use std::string;
    use aptos_framework::account;
    use aptos_framework::timestamp;

    use flashvault::registry;
    use flashvault::entitlements;
    use flashvault::errors;

    // ── Helpers ──

    fun setup(deployer: &signer, framework: &signer) {
        // Initialize the Aptos timestamp (required by the modules).
        timestamp::set_time_has_started_for_testing(framework);

        // Publish the modules' init_module logic by creating the deployer account.
        account::create_account_for_test(std::signer::address_of(deployer));

        // Manually initialize modules for testing.
        registry::init_module(deployer);
        entitlements::init_module(deployer);
    }

    // ── Registry tests ──

    #[test(deployer = @flashvault, framework = @0x1)]
    fun test_register_vault(deployer: &signer, framework: &signer) {
        setup(deployer, framework);

        let nft_id = @0xCAFE;
        registry::register_vault(
            deployer,
            nft_id,
            string::utf8(b"TestCollection"),
            true,
            string::utf8(b"sha256:abc123"),
        );

        assert!(registry::has_vault(nft_id), 100);
        assert!(registry::vault_count() == 1, 101);

        let (registrant, collection, teaser, commitment, active, _, _) =
            registry::get_vault_info(nft_id);
        assert!(registrant == @flashvault, 102);
        assert!(collection == string::utf8(b"TestCollection"), 103);
        assert!(teaser == true, 104);
        assert!(commitment == string::utf8(b"sha256:abc123"), 105);
        assert!(active == true, 106);
    }

    #[test(deployer = @flashvault, framework = @0x1)]
    #[expected_failure(abort_code = 2)] // E_VAULT_ALREADY_EXISTS
    fun test_register_vault_duplicate(deployer: &signer, framework: &signer) {
        setup(deployer, framework);

        let nft_id = @0xCAFE;
        registry::register_vault(
            deployer, nft_id,
            string::utf8(b"Col"), true, string::utf8(b""),
        );
        // Second registration should abort.
        registry::register_vault(
            deployer, nft_id,
            string::utf8(b"Col"), true, string::utf8(b""),
        );
    }

    #[test(deployer = @flashvault, framework = @0x1)]
    fun test_update_content_commitment(deployer: &signer, framework: &signer) {
        setup(deployer, framework);

        let nft_id = @0xBEEF;
        registry::register_vault(
            deployer, nft_id,
            string::utf8(b"Col"), false, string::utf8(b"v1"),
        );

        registry::update_content_commitment(
            deployer, nft_id, string::utf8(b"v2"),
        );

        let (_, _, _, commitment, _, _, _) = registry::get_vault_info(nft_id);
        assert!(commitment == string::utf8(b"v2"), 200);
    }

    #[test(deployer = @flashvault, framework = @0x1)]
    fun test_toggle_teaser_mode(deployer: &signer, framework: &signer) {
        setup(deployer, framework);

        let nft_id = @0xFACE;
        registry::register_vault(
            deployer, nft_id,
            string::utf8(b"Col"), true, string::utf8(b""),
        );

        registry::update_teaser_mode(deployer, nft_id, false);
        let (_, _, teaser, _, _, _, _) = registry::get_vault_info(nft_id);
        assert!(teaser == false, 300);

        registry::update_teaser_mode(deployer, nft_id, true);
        let (_, _, teaser2, _, _, _, _) = registry::get_vault_info(nft_id);
        assert!(teaser2 == true, 301);
    }

    #[test(deployer = @flashvault, framework = @0x1)]
    fun test_set_vault_status(deployer: &signer, framework: &signer) {
        setup(deployer, framework);

        let nft_id = @0xDEAD;
        registry::register_vault(
            deployer, nft_id,
            string::utf8(b"Col"), false, string::utf8(b""),
        );

        registry::set_vault_status(deployer, nft_id, false);
        let (_, _, _, _, active, _, _) = registry::get_vault_info(nft_id);
        assert!(active == false, 400);

        registry::set_vault_status(deployer, nft_id, true);
        let (_, _, _, _, active2, _, _) = registry::get_vault_info(nft_id);
        assert!(active2 == true, 401);
    }

    #[test(deployer = @flashvault, framework = @0x1)]
    #[expected_failure(abort_code = 4)] // E_VAULT_INACTIVE
    fun test_update_inactive_vault_aborts(deployer: &signer, framework: &signer) {
        setup(deployer, framework);

        let nft_id = @0xF00D;
        registry::register_vault(
            deployer, nft_id,
            string::utf8(b"Col"), false, string::utf8(b"v1"),
        );
        registry::set_vault_status(deployer, nft_id, false);

        // Should abort — vault is inactive.
        registry::update_content_commitment(deployer, nft_id, string::utf8(b"v2"));
    }

    #[test(deployer = @flashvault, framework = @0x1)]
    #[expected_failure(abort_code = 3)] // E_VAULT_NOT_FOUND
    fun test_get_nonexistent_vault(deployer: &signer, framework: &signer) {
        setup(deployer, framework);
        registry::get_vault_info(@0x9999);
    }

    // ── Entitlement tests ──

    #[test(deployer = @flashvault, framework = @0x1)]
    fun test_grant_and_check_entitlement(deployer: &signer, framework: &signer) {
        setup(deployer, framework);

        let nft_id = @0xABCD;
        let holder = @0x42;

        registry::register_vault(
            deployer, nft_id,
            string::utf8(b"Col"), false, string::utf8(b""),
        );

        assert!(!entitlements::has_entitlement(nft_id, holder), 500);

        entitlements::grant_entitlement(deployer, nft_id, holder);
        assert!(entitlements::has_entitlement(nft_id, holder), 501);
    }

    #[test(deployer = @flashvault, framework = @0x1)]
    fun test_revoke_entitlement(deployer: &signer, framework: &signer) {
        setup(deployer, framework);

        let nft_id = @0xABCD;
        let holder = @0x42;

        registry::register_vault(
            deployer, nft_id,
            string::utf8(b"Col"), false, string::utf8(b""),
        );
        entitlements::grant_entitlement(deployer, nft_id, holder);
        entitlements::revoke_entitlement(deployer, nft_id, holder);

        assert!(!entitlements::has_entitlement(nft_id, holder), 600);
    }

    #[test(deployer = @flashvault, framework = @0x1)]
    #[expected_failure(abort_code = 5)] // E_ENTITLEMENT_EXISTS
    fun test_double_grant_aborts(deployer: &signer, framework: &signer) {
        setup(deployer, framework);

        let nft_id = @0xABCD;
        let holder = @0x42;

        registry::register_vault(
            deployer, nft_id,
            string::utf8(b"Col"), false, string::utf8(b""),
        );
        entitlements::grant_entitlement(deployer, nft_id, holder);
        entitlements::grant_entitlement(deployer, nft_id, holder);
    }

    #[test(deployer = @flashvault, framework = @0x1)]
    #[expected_failure(abort_code = 6)] // E_ENTITLEMENT_NOT_FOUND
    fun test_revoke_nonexistent_aborts(deployer: &signer, framework: &signer) {
        setup(deployer, framework);

        let nft_id = @0xABCD;
        registry::register_vault(
            deployer, nft_id,
            string::utf8(b"Col"), false, string::utf8(b""),
        );
        entitlements::revoke_entitlement(deployer, nft_id, @0x42);
    }
}
