import { BRAND } from "@/lib/config";

// Shared shell for /privacy and /terms so the two pages stay visually
// identical to the rest of the site (same eyebrow / headline rhythm).

export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        {eyebrow}
      </p>
      <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.025em] text-zinc-950 sm:text-6xl">
        {title}
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-zinc-600">{intro}</p>
      <p className="mt-3 text-sm text-zinc-500">
        Last updated {BRAND.legal.lastUpdated}
      </p>
      <div className="mt-12 space-y-10 border-t border-zinc-200 pt-10">
        {children}
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-zinc-700">
        {children}
      </div>
    </section>
  );
}
