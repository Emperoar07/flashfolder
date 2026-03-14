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
        <div className="rounded-[2.5rem] bg-[radial-gradient(circle_at_top_left,#38bdf8,transparent_34%),linear-gradient(135deg,#020617_0%,#111827_45%,#0ea5e9_140%)] p-10 text-white shadow-[0_40px_120px_rgba(15,23,42,0.25)] sm:p-14">
          <p className="text-sm uppercase tracking-[0.35em] text-white/60">
            FlashFolder
          </p>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight sm:text-7xl">
            Hot storage for the files you actually use.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/70">
            Upload, organize, preview, stream, and share active files through a
            clean workspace that treats Shelby as the blob layer and keeps the
            product UX where it belongs.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950"
              href="/dashboard"
            >
              Launch app
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white"
              href="/vault"
            >
              Explore vault
            </Link>
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-white/60 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            FlashVault
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-950">
            Private vault for Aptos NFT content
          </h2>
          <p className="mt-4 text-slate-600">
            Owner-gated media and unlockables live inside FlashFolder as an
            optional premium mode. Vault the content, not the chain record.
          </p>
          <div className="mt-6 space-y-3">
            <div className="rounded-3xl bg-slate-950 p-4 text-white">
              <p className="text-sm font-semibold">What stays public</p>
              <p className="mt-2 text-sm text-white/70">
                Aptos ownership and transfer state remain onchain and queryable.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">
                What FlashVault protects
              </p>
              <p className="mt-2 text-sm text-slate-600">
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
            className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <item.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-950">
              {item.title}
            </h2>
            <p className="mt-3 text-slate-600">{item.copy}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-[2rem] border border-white/60 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            How it works
          </p>
          <h2 className="mt-4 text-4xl font-semibold text-slate-950">
            Built for active files first, Shelby later.
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">1. Organize</p>
              <p className="mt-2 text-sm text-slate-600">
                Keep folder trees, tags, permissions, and analytics in Postgres.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">2. Deliver</p>
              <p className="mt-2 text-sm text-slate-600">
                Preview and stream files through adapter-backed download routes.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">3. Gate</p>
              <p className="mt-2 text-sm text-slate-600">
                Add FlashVault when collectors need owner-gated media and unlockables.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80">
            <Sparkles className="h-4 w-4" />
            Shelby-ready architecture
          </div>
          <h2 className="mt-5 text-3xl font-semibold">
            Ship now with Blob storage. Swap to Shelby later.
          </h2>
          <p className="mt-4 text-white/70">
            FlashFolder stays production-safe before Shelby early access by
            isolating temporary Blob storage and mock Aptos reads behind clean
            service boundaries.
          </p>
          <Link
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
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
