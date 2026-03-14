import Link from "next/link";

import { WorkspacePreviewCard } from "@/components/workspace-preview-card";

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-left">
          <div className="section-label">Decentralized Hot Storage</div>
          <h1>
            YOUR FILES.
            <br />
            YOUR <em>CHAIN.</em>
            <br />
            YOUR VAULT.
          </h1>
          <p className="hero-sub">
            Upload, gate, and share files on-chain with FlashFolder. Built on
            Aptos and the Shelby Protocol for speed, sovereignty, and
            erasure-coded durability.
          </p>
          <div className="cta-row">
            <Link href="/dashboard" className="btn-primary">
              Launch App
            </Link>
            <Link href="/settings" className="btn-secondary">
              View Docs
            </Link>
          </div>
        </div>
        <div className="hero-right">
          <WorkspacePreviewCard />
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker-wrap">
        <div className="ticker">
          <span>DECENTRALIZED</span>
          <span>
            <em>Storage</em>
          </span>
          <span>APTOS</span>
          <span>NFT GATED</span>
          <span>SHELBY PROTOCOL</span>
          <span>
            <em>FlashVault</em>
          </span>
          <span>HOT STORAGE</span>
          <span>ERASURE CODED</span>
          <span>DECENTRALIZED</span>
          <span>
            <em>Storage</em>
          </span>
          <span>APTOS</span>
          <span>NFT GATED</span>
          <span>SHELBY PROTOCOL</span>
          <span>
            <em>FlashVault</em>
          </span>
          <span>HOT STORAGE</span>
          <span>ERASURE CODED</span>
        </div>
      </div>

      {/* FEATURES */}
      <section className="features">
        <div className="features-header">
          <div className="section-label">Core Capabilities</div>
          <h2>
            BUILT FOR <em>SPEED</em> &amp; SOVEREIGNTY
          </h2>
        </div>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-number">01</div>
            <h3>HOT STORAGE</h3>
            <p>
              Instant-access file storage optimized for speed. No cold retrieval
              delays, no waiting. Your files are always hot and ready.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-number">02</div>
            <h3>FLASHVAULT</h3>
            <p>
              NFT-gated private vaults. Lock content behind token ownership and
              control who sees what, powered by on-chain verification.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-number">03</div>
            <h3>SHARE LINKS</h3>
            <p>
              Generate password-protected, expiring share links for any file.
              Full control over access, duration, and permissions.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-number">04</div>
            <h3>APTOS NATIVE</h3>
            <p>
              Built on Aptos for sub-second finality and parallel execution.
              On-chain metadata, off-chain storage, full sovereignty.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-number">05</div>
            <h3>ERASURE CODED</h3>
            <p>
              Files are split, encoded, and distributed across nodes with
              redundancy. Lose nodes, keep data. Resilience by default.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-number">06</div>
            <h3>OPEN SOURCE</h3>
            <p>
              Fully open-source and auditable. No black boxes, no vendor
              lock-in. Fork it, extend it, own it.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
