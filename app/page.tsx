import Link from "next/link";

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
          <div className="preview-card">
            <div className="preview-card-header">
              <span>My Workspace</span>
              <div className="preview-card-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="preview-card-body">
              <div className="file-row">
                <div className="file-icon img">&#x1F5BC;</div>
                <div className="file-info">
                  <div className="file-name">cover-art-final.png</div>
                  <div className="file-meta">PNG Image</div>
                </div>
                <div className="file-size">4.2 MB</div>
              </div>
              <div className="file-row">
                <div className="file-icon vid">&#x25B6;</div>
                <div className="file-info">
                  <div className="file-name">teaser-clip.mp4</div>
                  <div className="file-meta">MP4 Video</div>
                </div>
                <div className="file-size">28 MB</div>
              </div>
              <div className="file-row">
                <div className="file-icon doc">&#x1F4C4;</div>
                <div className="file-info">
                  <div className="file-name">whitepaper-v3.pdf</div>
                  <div className="file-meta">PDF Document</div>
                </div>
                <div className="file-size">1.8 MB</div>
              </div>
              <div className="file-row">
                <div className="file-icon zip">&#x1F4E6;</div>
                <div className="file-info">
                  <div className="file-name">source-assets.zip</div>
                  <div className="file-meta">ZIP Archive</div>
                </div>
                <div className="file-size">156 MB</div>
              </div>
            </div>
          </div>
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
