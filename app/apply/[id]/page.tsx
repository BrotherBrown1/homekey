import { notFound } from "next/navigation";
import { getGrantById } from "@/lib/matcher";
import { ApplyLeadForm } from "@/components/ApplyLeadForm";
import { BRAND } from "@/lib/config";

export const dynamic = "force-dynamic";

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
    <div className="mx-auto max-w-3xl px-6 py-10">
      <a
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← Back to {BRAND.name}
      </a>

      <div className="mt-4 rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-8 ring-1 ring-zinc-200">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
          Applying for
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          {grant.name}
        </h1>
        <p className="mt-2 text-zinc-600">{grant.sponsor}</p>

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Amount</dt>
            <dd className="mt-1 text-lg font-semibold text-zinc-900">{dollar}</dd>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Type</dt>
            <dd className="mt-1 text-sm font-medium text-zinc-900">
              {programTypeLabel(grant.programType)}
            </dd>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200">
            <dt className="text-xs uppercase tracking-wide text-zinc-500">Covers</dt>
            <dd className="mt-1 text-sm font-medium text-zinc-900">
              {grant.level === "federal"
                ? "All 50 states"
                : `${grant.city ? grant.city + ", " : ""}${grant.state ?? ""}`}
            </dd>
          </div>
        </dl>
      </div>

      <section className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-zinc-200">
        <h2 className="text-lg font-semibold text-zinc-900">
          What this program is
        </h2>
        <p className="mt-2 text-zinc-700">{grant.summary}</p>

        <h3 className="mt-6 text-sm font-semibold text-zinc-900">
          How it normally gets applied for
        </h3>
        <p className="mt-2 text-sm text-zinc-600">
          Programs like this run through a participating mortgage lender — not
          a direct buyer application. Your loan officer files it as part of
          your mortgage paperwork. That's why most buyers don't know they
          exist: there's no "Apply" button on the buyer side.
        </p>
        <p className="mt-3 text-sm text-zinc-600">
          That's where {BRAND.name} comes in. Fill in the form below and{" "}
          <span className="font-medium text-zinc-900">{BRAND.realtor.name}</span>{" "}
          (or his partner loan officer for your state) will reach out within
          24 hours, walk you through eligibility, and submit the application
          alongside your mortgage.
        </p>
      </section>

      <section
        id="apply"
        className="mt-8 rounded-3xl bg-zinc-900 p-6 text-white ring-1 ring-zinc-800"
      >
        <h2 className="text-xl font-semibold">
          Have a specialist apply with me
        </h2>
        <p className="mt-2 text-sm text-zinc-300">
          Free. No credit pull. {BRAND.realtor.name} responds within 24
          hours. You can step away anytime.
        </p>
        <div className="mt-6">
          <ApplyLeadForm grantId={grant.id} grantName={grant.name} />
        </div>
      </section>

      <section className="mt-8 text-center text-sm text-zinc-500">
        <p>
          Prefer to apply yourself?{" "}
          <a
            href={`/apply/${grant.id}/direct`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Open the official program page →
          </a>
        </p>
      </section>
    </div>
  );
}
