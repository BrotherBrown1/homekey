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

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/results" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Back to results
      </Link>

      <header className="mt-4 rounded-3xl bg-gradient-to-br from-indigo-50 to-emerald-50 p-8 ring-1 ring-zinc-200">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-white px-2 py-0.5 font-medium text-zinc-700 ring-1 ring-zinc-200">
            {grant.level === "federal"
              ? "Federal"
              : grant.level === "state"
              ? grant.state
              : grant.level === "county"
              ? `${grant.county} County, ${grant.state}`
              : `${grant.city}, ${grant.state}`}
          </span>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 ring-1 ring-indigo-200">
            {grant.programType.replaceAll("_", " ")}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-medium ring-1 ${
              grant.status === "active"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-zinc-100 text-zinc-700 ring-zinc-200"
            }`}
          >
            {grant.status}
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">
          {grant.name}
        </h1>
        <p className="mt-1 text-zinc-600">{grant.sponsor}</p>
        {grant.amountDescription && (
          <p className="mt-4 text-lg font-medium text-emerald-700">💰 {grant.amountDescription}</p>
        )}
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Overview</h2>
        <p className="mt-2 text-zinc-700">{grant.summary}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Detailed requirements</h2>
        <p className="mt-2 whitespace-pre-line text-zinc-700">{grant.detailedRequirements}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Eligibility at a glance</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-2">
          {eligibilityRows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wide text-zinc-500">{k}</dt>
                <dd className="mt-0.5 text-sm font-medium text-zinc-900">{v}</dd>
              </div>
            ))}
        </dl>
        {e.notes && (
          <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
            <strong>Note:</strong> {e.notes}
          </p>
        )}
      </section>

      <section className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href={`/apply/${grant.id}`}
          className="rounded-full bg-zinc-900 px-6 py-3 font-medium text-white hover:bg-zinc-800"
        >
          Apply with help →
        </a>
        <a
          href={grant.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          Program homepage
        </a>
      </section>

      <p className="mt-8 text-xs text-zinc-400">
        Last verified: {grant.lastVerified}. We update programs weekly using a watsonx Orchestrate agent.
        Always confirm details on the official program page before applying.
      </p>
    </div>
  );
}
