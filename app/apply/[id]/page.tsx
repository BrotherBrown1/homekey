import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGrantById } from "@/lib/matcher";
import { ApplyLeadForm } from "@/components/ApplyLeadForm";
import { BackLink } from "@/components/BackLink";
import { BRAND } from "@/lib/config";

export const dynamic = "force-dynamic";

type ApplyParams = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: ApplyParams }): Promise<Metadata> {
  const { id } = await params;
  const grant = await getGrantById(id);
  if (!grant) return {};
  const title = `Apply for ${grant.name}`;
  const description = `Start your ${grant.name} application — free, no credit pull. A ${BRAND.name} grant specialist will walk you through eligibility within 24 hours.`;
  return {
    title,
    description,
    alternates: { canonical: `https://homekey-psi.vercel.app/apply/${grant.id}` },
    openGraph: { title, description },
  };
}

function programTypeLabel(t: string) {
  return (
    {
      grant: "Grant (you don't pay it back)",
      forgivable_loan: "Forgivable loan (forgiven over time)",
      deferred_loan: "Deferred loan (paid back later)",
      low_interest_loan: "Low-interest loan",
      tax_credit: "Tax credit",
      voucher: "Voucher",
    } as Record<string, string>
  )[t] ?? t;
}

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const grant = await getGrantById(id);
  if (!grant) notFound();

  const dollar = grant.amountDescription || grant.amountMax
    ? grant.amountDescription || `Up to $${grant.amountMax?.toLocaleString()}`
    : "Amount varies by income and area";

  return (
    <div>
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 pb-16 pt-12 sm:pb-20 sm:pt-16">
          <BackLink fallbackHref="/">← Back to my matches</BackLink>
          <p className="mt-10 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Applying for
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-[1.03] tracking-[-0.025em] text-zinc-950 sm:text-7xl">
            {grant.name}
          </h1>
          <p className="mt-4 text-lg text-zinc-600 sm:text-xl">{grant.sponsor}</p>

          <dl className="mt-12 grid grid-cols-1 gap-y-8 border-t border-zinc-200 pt-8 sm:grid-cols-3 sm:gap-x-12">
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Amount
              </dt>
              <dd className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-zinc-950">
                {dollar}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Type
              </dt>
              <dd className="mt-2 text-base font-medium text-zinc-950">
                {programTypeLabel(grant.programType)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Covers
              </dt>
              <dd className="mt-2 text-base font-medium text-zinc-950">
                {grant.level === "federal"
                  ? "All 50 states"
                  : `${grant.city ? grant.city + ", " : ""}${grant.state ?? ""}`}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-20">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            About this grant
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.025em] text-zinc-950 sm:text-4xl">
            What it is, and why most people miss it.
          </h2>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-700">
            {grant.summary}
          </p>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-zinc-600">
            Grant programs change quarterly. Funding windows open and close.
            Eligibility shifts. Most buyers never hear they exist — that's
            the problem {BRAND.name} solves. We track every active federal,
            state, county, and city program so you can claim what's yours.
          </p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-600">
            A {BRAND.name} grant specialist helps you actually file this one.
            They confirm your eligibility, gather what you need, and walk
            you through the official application step-by-step. Free.
          </p>
        </div>
      </section>

      <section id="apply" className="bg-zinc-950 text-white">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
            Start your application
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.025em] sm:text-5xl">
            Apply for this grant.
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-zinc-300">
            Tell us how to reach you. A {BRAND.name} grant specialist will
            contact you within 24 hours to begin your application for{" "}
            {grant.name}. Free. No credit pull. No obligation.
          </p>
          <div className="mt-10">
            <ApplyLeadForm grantId={grant.id} grantName={grant.name} />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-6 py-12 text-center text-sm text-zinc-500">
          <p>
            Want to see the official program page first?{" "}
            <a
              href={`/apply/${grant.id}/direct`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-950 underline underline-offset-4"
            >
              Open it on the sponsor&apos;s site →
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
