import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGrantById } from "@/lib/matcher";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const grant = await getGrantById(id);
  if (!grant) return {};
  const where = grant.level === "federal" ? "Federal" : grant.state ?? "";
  const title = `${grant.name} — ${where} Grant Eligibility & How to Apply`;
  const description = `${grant.summary} See if you qualify in 3 minutes — free, no credit pull.`;
  return {
    title,
    description,
    alternates: { canonical: `https://homekey-psi.vercel.app/grant/${grant.id}` },
    openGraph: { title, description },
  };
}

export default async function GrantDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const grant = await getGrantById(id);
  if (!grant) notFound();

  const e = grant.eligibility;
  const eligibilityRows: Array<[string, string | undefined]> = [
    ["First-time buyer required", e.firstTimeBuyerOnly ? "Yes" : undefined],
    ["Veterans/military only", e.veteranOnly ? "Yes" : undefined],
    ["Professions limited to", e.professions?.join(", ")],
    ["Max household income", e.maxIncome ? `$${e.maxIncome.toLocaleString()}` : undefined],
    ["Max income (% AMI)", e.maxIncomeAmiPct ? `${e.maxIncomeAmiPct}%` : undefined],
    ["Min credit score", e.minCreditScore ? e.minCreditScore.toString() : undefined],
    ["Max purchase price", e.maxPurchasePrice ? `$${e.maxPurchasePrice.toLocaleString()}` : undefined],
    ["Owner-occupied required", e.ownerOccupiedRequired ? "Yes" : undefined],
    ["Homebuyer education required", e.homebuyerEducationRequired ? "Yes" : undefined],
    ["Property types", e.propertyTypes?.join(", ")],
    ["Limited to targeted areas", e.targetAreasOnly ? "Yes" : undefined],
  ];

  const locationLabel =
    grant.level === "federal"
      ? "Federal"
      : grant.level === "state"
      ? grant.state
      : grant.level === "county"
      ? `${grant.county} County, ${grant.state}`
      : `${grant.city}, ${grant.state}`;

  return (
    <div>
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 pb-16 pt-12 sm:pb-20 sm:pt-16">
          <Link
            href="/results"
            className="text-xs uppercase tracking-[0.12em] text-zinc-500 hover:text-zinc-950"
          >
            ← Back to results
          </Link>
          <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs uppercase tracking-[0.12em] text-zinc-500">
            <span>{locationLabel}</span>
            <span aria-hidden>·</span>
            <span>{grant.programType.replaceAll("_", " ")}</span>
            <span aria-hidden>·</span>
            <span
              className={grant.status === "active" ? "text-emerald-700" : "text-zinc-500"}
            >
              {grant.status}
            </span>
          </div>
          <h1 className="mt-4 text-5xl font-semibold leading-[1.03] tracking-[-0.025em] text-zinc-950 sm:text-7xl">
            {grant.name}
          </h1>
          <p className="mt-4 text-lg text-zinc-600 sm:text-xl">{grant.sponsor}</p>
          {grant.amountDescription && (
            <p className="mt-8 text-2xl font-semibold tracking-[-0.02em] text-zinc-950 sm:text-3xl">
              {grant.amountDescription}
            </p>
          )}
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Overview
          </p>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-zinc-700">
            {grant.summary}
          </p>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Detailed requirements
          </p>
          <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-relaxed text-zinc-700">
            {grant.detailedRequirements}
          </p>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Eligibility at a glance
          </p>
          <dl className="mt-8 grid grid-cols-1 gap-x-12 sm:grid-cols-2">
            {eligibilityRows
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} className="border-b border-zinc-200 py-4">
                  <dt className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                    {k}
                  </dt>
                  <dd className="mt-2 text-base font-medium text-zinc-950">{v}</dd>
                </div>
              ))}
          </dl>
          {e.notes && (
            <p className="mt-8 max-w-3xl border-l-2 border-amber-400 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              <strong>Note:</strong> {e.notes}
            </p>
          )}
        </div>
      </section>

      <section className="bg-zinc-950 text-white">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
          <h2 className="text-3xl font-semibold leading-tight tracking-[-0.025em] sm:text-5xl">
            Ready to apply?
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-zinc-300">
            A free grant specialist walks you through eligibility and the
            official application in one short call.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href={`/apply/${grant.id}`}
              className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-white px-8 py-3.5 text-xs font-medium uppercase tracking-[0.12em] text-zinc-950 transition hover:bg-zinc-100"
            >
              Apply with help
            </a>
            <a
              href={grant.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-white/10 px-8 py-3.5 text-xs font-medium uppercase tracking-[0.12em] text-white ring-1 ring-inset ring-white/20 transition hover:bg-white/15"
            >
              Program homepage
            </a>
          </div>
          <p className="mt-10 text-xs text-zinc-500">
            Last verified {grant.lastVerified}. Updated weekly. Always confirm
            details on the official program page before applying.
          </p>
        </div>
      </section>
    </div>
  );
}
