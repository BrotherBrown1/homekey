import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/config";
import { FAQ_SECTIONS, FAQ_ITEMS } from "@/lib/faq";

export const metadata: Metadata = {
  title: "First-Time Home Buyer Grants FAQ",
  description:
    "Straight answers to the questions people ask about first-time home buyer grants: who qualifies, how much you can get, whether it's repaid, credit and income limits, and what's available in Michigan.",
  alternates: { canonical: `${BRAND.siteUrl}/faq` },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        Questions
      </p>
      <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.025em] text-zinc-950 sm:text-6xl">
        First-time home buyer grants, answered.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-zinc-600">
        The questions buyers actually ask, with plain answers. Numbers below
        come from the same data that powers your matches.
      </p>

      <nav aria-label="Sections" className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {FAQ_SECTIONS.map((s) => (
          <a key={s.title} href={`#${slug(s.title)}`} className="text-zinc-700 underline-offset-4 hover:underline">
            {s.title}
          </a>
        ))}
      </nav>

      <div className="mt-12 space-y-16">
        {FAQ_SECTIONS.map((section) => (
          <section key={section.title} id={slug(section.title)} className="scroll-mt-24">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              {section.title}
            </h2>
            <div className="mt-4 divide-y divide-zinc-200 border-y border-zinc-200">
              {section.items.map((item) => (
                <details key={item.q} id={slug(item.q)} className="group scroll-mt-24 py-5">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-medium tracking-[-0.01em] text-zinc-950 sm:text-xl">
                    <span>{item.q}</span>
                    <span
                      aria-hidden
                      className="mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full ring-1 ring-inset ring-zinc-300 text-zinc-500 transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <div className="mt-4 max-w-2xl space-y-4 text-base leading-relaxed text-zinc-700">
                    {item.a.split(/\n\s*\n/).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-20 rounded-3xl bg-zinc-950 px-8 py-10 text-white sm:px-12">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
          Still wondering what you qualify for?
        </p>
        <p className="mt-3 text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
          Three minutes. Every grant. Free.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/onboarding"
            className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#3457dc] px-8 py-3.5 text-sm font-medium uppercase tracking-[0.08em] text-white transition hover:bg-[#2742b0]"
          >
            Find my grants
          </Link>
          <a
            href={`mailto:${BRAND.realtor.email}`}
            className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-white/10 px-8 py-3.5 text-sm font-medium uppercase tracking-[0.08em] text-white ring-1 ring-inset ring-white/20 transition hover:bg-white/15"
          >
            Ask a question
          </a>
        </div>
      </div>
    </div>
  );
}
