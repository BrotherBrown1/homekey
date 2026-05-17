import Link from "next/link";
import { matchGrants } from "@/lib/matcher";
import type { BuyerCriteria } from "@/lib/schema";
import { LeadCaptureBar } from "@/components/LeadCaptureBar";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | undefined>>;

function parseBuyer(params: Record<string, string | undefined>): BuyerCriteria {
  return {
    state: (params.state ?? "MI").toUpperCase(),
    city: params.city || undefined,
    county: params.county || undefined,
    householdSize: Number(params.householdSize ?? 1),
    annualIncome: Number(params.annualIncome ?? 60000),
    targetPurchasePrice: params.targetPurchasePrice
      ? Number(params.targetPurchasePrice)
      : undefined,
    creditScore: params.creditScore ? Number(params.creditScore) : undefined,
    firstTimeBuyer: params.firstTimeBuyer !== "false",
    veteran: params.veteran === "true",
    activeMilitary: params.activeMilitary === "true",
    profession: params.profession || undefined,
    ownerOccupied: params.ownerOccupied !== "false",
  };
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const buyer = parseBuyer(params);
  const rawMatches = await matchGrants(buyer, { useAi: false, limit: 20 });

  // Sort: best matches first (Optimal > Great > Good), then within each tier
  // surface true grants before loan-shaped programs. Buyers came for grants,
  // not mortgages — keep that promise on the page order.
  const confidenceRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const programRank: Record<string, number> = {
    grant: 0,
    tax_credit: 1,
    voucher: 2,
    forgivable_loan: 3,
    deferred_loan: 4,
    low_interest_loan: 5,
  };
  const allSorted = [...rawMatches].sort((a, b) => {
    const conf = confidenceRank[a.confidence] - confidenceRank[b.confidence];
    if (conf !== 0) return conf;
    const prog = (programRank[a.grant.programType] ?? 9) - (programRank[b.grant.programType] ?? 9);
    if (prog !== 0) return prog;
    return b.finalScore - a.finalScore;
  });

  const GRANT_TYPES = new Set(["grant", "tax_credit", "voucher", "forgivable_loan"]);
  const grantMatches = allSorted.filter((m) => GRANT_TYPES.has(m.grant.programType));
  const loanMatches = allSorted.filter((m) => !GRANT_TYPES.has(m.grant.programType));

  const activeTab = (params.tab === "loans" ? "loans" : "grants") as "grants" | "loans";
  const matches = activeTab === "grants" ? grantMatches : loanMatches;

  const totalAmount = grantMatches
    .filter((m) => m.confidence !== "low")
    .reduce((sum, m) => sum + (m.grant.amountMax ?? 0), 0);

  // Preserve all other params when switching tabs
  const carryParams = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (k !== "tab" && v) carryParams.set(k, v);
  }
  const grantsHref = `/results?${carryParams.toString()}`;
  carryParams.set("tab", "loans");
  const loansHref = `/results?${carryParams.toString()}`;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-8 ring-1 ring-zinc-200">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
          Your matches
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          We found <span className="text-indigo-600">{grantMatches.length}</span> grants and{" "}
          <span className="text-zinc-700">{loanMatches.length}</span> loan programs you may qualify for in{" "}
          {buyer.city ? `${buyer.city}, ` : ""}
          {buyer.state}.
        </h1>
        {totalAmount > 0 && (
          <p className="mt-3 text-lg text-zinc-600">
            Estimated maximum stackable grant benefit:{" "}
            <span className="font-semibold text-zinc-900">
              ${totalAmount.toLocaleString()}
            </span>{" "}
            <span className="text-zinc-500">(some programs can be combined)</span>
          </p>
        )}
      </div>

      <LeadCaptureBar buyer={buyer} matchedIds={matches.map((m) => m.grant.id)} />

      <div
        role="tablist"
        aria-label="Filter by program type"
        className="mt-8 flex gap-1 rounded-full bg-zinc-100 p-1"
      >
        <Link
          href={grantsHref}
          role="tab"
          aria-selected={activeTab === "grants"}
          className={`flex-1 rounded-full px-4 py-2 text-center text-sm font-medium transition ${
            activeTab === "grants"
              ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Grants <span className="ml-1 text-xs text-zinc-500">({grantMatches.length})</span>
        </Link>
        <Link
          href={loansHref}
          role="tab"
          aria-selected={activeTab === "loans"}
          className={`flex-1 rounded-full px-4 py-2 text-center text-sm font-medium transition ${
            activeTab === "loans"
              ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Loans <span className="ml-1 text-xs text-zinc-500">({loanMatches.length})</span>
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {matches.length === 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <p className="text-zinc-600">
              {activeTab === "grants"
                ? "No grants matched your current criteria. Try widening your profile — especially income, first-time buyer status, or city/county."
                : "No loan programs matched your current criteria."}
            </p>
            <Link
              href="/onboarding"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              ← Edit my profile
            </Link>
          </div>
        )}
        {matches.map((m) => (
          <GrantCard key={m.grant.id} match={m} />
        ))}
      </div>

      <div className="mt-12 text-center text-sm text-zinc-500">
        <Link href="/onboarding" className="text-indigo-600 hover:text-indigo-700">
          ← Edit my profile
        </Link>
      </div>
    </div>
  );
}

function GrantCard({ match }: { match: Awaited<ReturnType<typeof matchGrants>>[number] }) {
  const { grant, confidence, whyQualify, whyDisqualify } = match;
  const tier = {
    high: { label: "Optimal match", classes: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
    medium: { label: "Great match", classes: "bg-amber-100 text-amber-800 ring-amber-200" },
    low: { label: "Good match", classes: "bg-zinc-100 text-zinc-700 ring-zinc-200" },
  }[confidence];

  const levelLabel = {
    federal: "Federal",
    state: grant.state ?? "State",
    county: `${grant.county ?? ""} County`,
    city: grant.city ?? "City",
  }[grant.level];

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700">
              {levelLabel}
            </span>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
              {grant.programType.replaceAll("_", " ")}
            </span>
            <span className={`rounded-full px-2 py-0.5 font-medium ring-1 ${tier.classes}`}>
              {tier.label}
            </span>
          </div>
          <h3 className="mt-3 text-xl font-semibold text-zinc-900">
            <Link href={`/grant/${grant.id}`} className="hover:text-indigo-700">
              {grant.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-zinc-500">{grant.sponsor}</p>
          <p className="mt-3 text-zinc-700">{grant.summary}</p>
          {grant.amountDescription && (
            <p className="mt-3 text-sm font-medium text-emerald-700">
              💰 {grant.amountDescription}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:w-44 sm:flex-none">
          <Link
            href={`/apply/${grant.id}`}
            className="rounded-full bg-zinc-900 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 active:bg-zinc-700"
          >
            Apply →
          </Link>
          <Link
            href={`/grant/${grant.id}`}
            className="rounded-full bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50 active:bg-zinc-100"
          >
            Details
          </Link>
        </div>
      </div>

      {(whyQualify.length > 0 || whyDisqualify.length > 0) && (
        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-zinc-100 pt-4 sm:grid-cols-2">
          {whyQualify.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                Why you qualify
              </p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {whyQualify.slice(0, 4).map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {whyDisqualify.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                Check these
              </p>
              <ul className="mt-2 space-y-1 text-sm text-zinc-700">
                {whyDisqualify.slice(0, 4).map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-amber-600">!</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
