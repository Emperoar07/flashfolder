import Link from "next/link";
import {
  ArrowRight,
  FolderOpen,
  RadioTower,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 sm:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_380px]">
        <div className="rounded-[2.5rem] bg-[linear-gradient(135deg,#111_0%,#1a1a1a_60%,rgba(200,57,43,0.15)_100%)] border border-[rgba(255,255,255,0.07)] p-10 text-white sm:p-14">
          <p className="text-sm uppercase tracking-[0.35em] text-[rgba(240,237,230,0.35)]">
            FlashFolder
          </p>
          <h1 className="mt-6 max-w-4xl font-[family-name:var(--font-bebas-neue)] text-6xl tracking-[0.06em] sm:text-8xl">
            Hot storage for the files you actually use.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[rgba(240,237,230,0.55)]">
            Upload, organize, preview, stream, and share active files through a
            clean workspace that treats Shelby as the blob layer and keeps the
            product UX where it belongs.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-[#c8392b] px-6 py-3 text-sm font-semibold text-[#f0ede6] hover:bg-[#a82d22]"
              href="/dashboard"
            >
              Launch app
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.07)] px-6 py-3 text-sm font-semibold text-[rgba(240,237,230,0.55)] hover:border-[#b8a06a]"
              href="/vault"
            >
              Explore vault
            </Link>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-[rgba(255,255,255,0.07)] bg-[#111] p-8 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.25em] text-[rgba(240,237,230,0.35)]">
            FlashVault
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-[#f0ede6]">
            Private vault for Aptos NFT content
          </h2>
          <p className="mt-4 text-[rgba(240,237,230,0.55)]">
            Owner-gated media and unlockables live inside FlashFolder as an
            optional premium mode. Vault the content, not the chain record.
          </p>
          <div className="mt-6 space-y-3">
            <div className="rounded-3xl bg-[rgba(255,255,255,0.05)] p-4 text-white">
              <p className="text-sm font-semibold text-[#f0ede6]">What stays public</p>
              <p className="mt-2 text-sm text-[rgba(240,237,230,0.55)]">
                Aptos ownership and transfer state remain onchain and queryable.
              </p>
            </div>
            <div className="rounded-3xl bg-[rgba(255,255,255,0.05)] p-4">
              <p className="text-sm font-semibold text-[#f0ede6]">
                What FlashVault protects
              </p>
              <p className="mt-2 text-sm text-[rgba(240,237,230,0.55)]">
                Private media access, unlockable files, teaser settings, and
                collector sharing through verified backend routes.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-4">
        {[
          {
            icon: FolderOpen,
            title: "Virtual folders",
            copy: "Nested folders live in Postgres, not in the storage layer, so the UX can evolve without fighting blob constraints.",
          },
          {
            icon: RadioTower,
            title: "Hot previews",
            copy: "Images, videos, audio, PDFs, and text can be opened instantly through range-friendly download routes.",
          },
          {
            icon: Share2,
            title: "Web2-ready sharing",
            copy: "Create public, private, and password-protected links that feel familiar outside crypto-native surfaces.",
          },
          {
            icon: ShieldCheck,
            title: "Collector privacy",
            copy: "FlashVault adds premium owner checks, teaser previews, and unlockables for Aptos collectibles without misrepresenting onchain visibility.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-[2rem] border border-[rgba(255,255,255,0.07)] bg-[#111] p-6 transition hover:border-[rgba(200,57,43,0.3)] hover:bg-[#161616]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c8392b] text-[#f0ede6]">
              <item.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-2xl font-[family-name:var(--font-bebas-neue)] tracking-[0.1em] text-[#f0ede6]">
              {item.title}
            </h2>
            <p className="mt-3 text-[rgba(240,237,230,0.55)]">{item.copy}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-[2rem] border border-[rgba(255,255,255,0.07)] bg-[#111] p-8">
          <p className="text-xs uppercase tracking-[0.25em] text-[rgba(240,237,230,0.35)]">
            How it works
          </p>
          <h2 className="mt-4 text-4xl font-semibold text-[#f0ede6]">
            Built for active files first, Shelby later.
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-[rgba(255,255,255,0.05)] p-5">
              <p className="text-sm font-semibold text-[#f0ede6]">1. Organize</p>
              <p className="mt-2 text-sm text-[rgba(240,237,230,0.55)]">
                Keep folder trees, tags, permissions, and analytics in Postgres.
              </p>
            </div>
            <div className="rounded-3xl bg-[rgba(255,255,255,0.05)] p-5">
              <p className="text-sm font-semibold text-[#f0ede6]">2. Deliver</p>
              <p className="mt-2 text-sm text-[rgba(240,237,230,0.55)]">
                Preview and stream files through adapter-backed download routes.
              </p>
            </div>
            <div className="rounded-3xl bg-[rgba(255,255,255,0.05)] p-5">
              <p className="text-sm font-semibold text-[#f0ede6]">3. Gate</p>
              <p className="mt-2 text-sm text-[rgba(240,237,230,0.55)]">
                Add FlashVault when collectors need owner-gated media and unlockables.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.07)] p-8 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(255,255,255,0.06)] px-4 py-2 text-sm text-[rgba(240,237,230,0.55)]">
            <Sparkles className="h-4 w-4" />
            Shelby-ready architecture
          </div>
          <h2 className="mt-5 text-3xl font-semibold text-[#f0ede6]">
            Ship now with Blob storage. Swap to Shelby later.
          </h2>
          <p className="mt-4 text-[rgba(240,237,230,0.55)]">
            FlashFolder stays production-safe before Shelby early access by
            isolating temporary Blob storage and mock Aptos reads behind clean
            service boundaries.
          </p>
          <Link
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#c8392b] px-5 py-3 text-sm font-semibold text-[#f0ede6] hover:bg-[#a82d22]"
            href="/settings"
          >
            View setup
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
