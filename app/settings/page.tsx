import Link from "next/link";

import { getSettingsSnapshot } from "@/lib/server/workspace";

export default async function SettingsPage() {
  const settings = getSettingsSnapshot();

  return (
    <main className="mx-auto max-w-5xl px-6 pb-16 sm:px-8" style={{ paddingTop: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            color: "var(--text-muted)",
          }}
        >
          Settings
        </p>
        <h1
          style={{
            fontFamily: "var(--font-bebas-neue)",
            fontSize: 42,
            letterSpacing: "0.06em",
            color: "var(--foreground)",
            marginTop: 12,
          }}
        >
          WORKSPACE SETTINGS
        </h1>
      </div>

      {/* Account Section */}
      <section
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 32,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "var(--accent-red)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: "var(--foreground)",
            }}
          >
            &#x1F464;
          </div>
          <div>
            <h2
              style={{
                fontFamily: "var(--font-bebas-neue)",
                fontSize: 22,
                letterSpacing: "0.08em",
                color: "var(--foreground)",
              }}
            >
              ACCOUNT
            </h2>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Network
            </p>
            <p style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)", marginTop: 8 }}>
              {settings.aptosNetwork}
            </p>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Auth Mode
            </p>
            <p style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)", marginTop: 8 }}>
              {settings.walletAuth.mode === "mock" ? "Wallet + Email" : "Challenge-Response"}
            </p>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Upload Limit
            </p>
            <p style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)", marginTop: 8 }}>
              {settings.maxUploadMb} MB
            </p>
          </div>
        </div>
      </section>

      {/* Storage Section */}
      <section
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 32,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "var(--accent-gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            &#x1F4BE;
          </div>
          <div>
            <h2
              style={{
                fontFamily: "var(--font-bebas-neue)",
                fontSize: 22,
                letterSpacing: "0.08em",
                color: "var(--foreground)",
              }}
            >
              STORAGE
            </h2>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Active Storage
            </p>
            <p style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)", marginTop: 8 }}>
              {settings.activeStorageMode === "local" ? "Local" : settings.activeStorageMode === "blob" ? "Cloud (Blob)" : settings.activeStorageMode}
            </p>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Status
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: settings.storageState === "active" ? "#34d399" : "var(--accent-gold)",
                  display: "inline-block",
                }}
              />
              <p style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)" }}>
                {settings.storageState === "active" ? "Active" : "Pending"}
              </p>
            </div>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 16,
              padding: 20,
            }}
          >
            <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Cloud Backup
            </p>
            <p style={{ fontSize: 20, fontWeight: 600, color: "var(--foreground)", marginTop: 8 }}>
              {settings.blobConfigured ? "Enabled" : "Not configured"}
            </p>
          </div>
        </div>

        {settings.storageFallbackReason ? (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              background: "rgba(184,160,106,0.08)",
              border: "1px solid rgba(184,160,106,0.2)",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--accent-gold)",
            }}
          >
            {settings.storageFallbackReason}
          </div>
        ) : null}
      </section>

      {/* FlashVault Section */}
      <section
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 20,
          padding: 32,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "linear-gradient(135deg, var(--accent-red), var(--accent-gold))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            &#x1F512;
          </div>
          <div>
            <h2
              style={{
                fontFamily: "var(--font-bebas-neue)",
                fontSize: 22,
                letterSpacing: "0.08em",
                color: "var(--foreground)",
              }}
            >
              FLASHVAULT
            </h2>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 24,
            }}
          >
            <p style={{ fontSize: 11, color: "var(--accent-gold)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
              NFT Verification
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, color: "var(--foreground)", fontFamily: "var(--font-bebas-neue)", letterSpacing: "0.06em" }}>
              {settings.aptos.mockEnabled ? "Demo Mode" : "Live On-Chain"}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.6 }}>
              {settings.aptos.mockEnabled
                ? "Using sample NFT data for preview. Connect a wallet with real NFTs to switch to live verification."
                : "Verifying NFT ownership directly on the Aptos blockchain."}
            </p>
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: 24,
            }}
          >
            <p style={{ fontSize: 11, color: "var(--accent-gold)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
              Content Protection
            </p>
            <p style={{ fontSize: 18, fontWeight: 600, color: "var(--foreground)", fontFamily: "var(--font-bebas-neue)", letterSpacing: "0.06em" }}>
              Owner-Gated Access
            </p>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.6 }}>
              Vault content is protected behind NFT ownership checks. Only verified token holders can access gated media and unlockables.
            </p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 28px",
            background: "var(--accent-red)",
            color: "var(--foreground)",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            textDecoration: "none",
          }}
        >
          Back to Dashboard
        </Link>
        <Link
          href="/vault"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 28px",
            background: "rgba(255,255,255,0.05)",
            color: "var(--text-secondary)",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            textDecoration: "none",
            border: "1px solid var(--border)",
          }}
        >
          Open Vault
        </Link>
      </div>
    </main>
  );
}
