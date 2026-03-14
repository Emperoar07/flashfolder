import Link from "next/link";
import { ArrowRight, FolderOpen, RadioTower, Share2 } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl px-6 pb-20 pt-10 sm:px-8">
      <div className="rounded-[2.5rem] bg-[radial-gradient(circle_at_top_left,#38bdf8,transparent_34%),linear-gradient(135deg,#0f172a_0%,#111827_45%,#0ea5e9_140%)] p-10 text-white shadow-[0_40px_120px_rgba(15,23,42,0.25)] sm:p-14">
        <p className="text-sm uppercase tracking-[0.35em] text-white/60">
          FlashFolder
        </p>
        <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight sm:text-7xl">
          A decentralized file workspace built for fast reads, previews, and shareable links.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-white/70">
          FlashFolder treats Shelby as the blob layer and keeps folders, shares,
          previews, and permissions in the app layer where product UX belongs.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950"
            href="/dashboard"
          >
            Open dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white"
            href="/settings"
          >
            Storage settings
          </Link>
        </div>
      </div>

      <section className="mt-10 grid gap-6 md:grid-cols-3">
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
    </main>
  );
}
