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
      <div className="border-b border-zinc-200 pb-10">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
          Your matches
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.025em] text-zinc-950 sm:text-6xl">
          {grantMatches.length} grants.{" "}
          <span className="text-zinc-500">{loanMatches.length} loan programs.</span>
          <br className="hidden sm:block" />
          <span className="text-zinc-500">
            {" "}{buyer.city ? `${buyer.city}, ` : ""}{buyer.state}.
          </span>
        </h1>
        {totalAmount > 0 && (
          <p className="mt-6 text-lg text-zinc-600 sm:text-xl">
            Up to{" "}
            <span className="font-semibold text-zinc-950">
              ${totalAmount.toLocaleString()}
            </span>{" "}
            in stackable grant benefit.
          </p>
        )}
      </div>

      <LeadCaptureBar buyer={buyer} matchedIds={matches.map((m) => m.grant.id)} />

      <div
        role="tablist"
        aria-label="Filter by program type"
        className="mt-10 flex gap-8 border-b border-zinc-200 text-sm uppercase tracking-[0.12em]"
      >
        <Link
          href={grantsHref}
          role="tab"
          aria-selected={activeTab === "grants"}
          className={`-mb-px border-b-2 py-3 transition ${
            activeTab === "grants"
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-950"
          }`}
        >
          Grants <span className="ml-1.5 text-zinc-400">{grantMatches.length}</span>
        </Link>
        <Link
          href={loansHref}
          role="tab"
          aria-selected={activeTab === "loans"}
          className={`-mb-px border-b-2 py-3 transition ${
            activeTab === "loans"
              ? "border-zinc-950 text-zinc-950"
              : "border-transparent text-zinc-500 hover:text-zinc-950"
          }`}
        >
          Loans <span className="ml-1.5 text-zinc-400">{loanMatches.length}</span>
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
    high: { label: "Optimal match", classes: "bg-emerald-100 text-emerald-800 ring-emerald-200", text: "text-emerald-700" },
    medium: { label: "Great match", classes: "bg-amber-100 text-amber-800 ring-amber-200", text: "text-amber-700" },
    low: { label: "Good match", classes: "bg-zinc-100 text-zinc-700 ring-zinc-200", text: "text-zinc-700" },
  }[confidence];

  const levelLabel = {
    federal: "Federal",
    state: grant.state ?? "State",
    county: `${grant.county ?? ""} County`,
    city: grant.city ?? "City",
  }[grant.level];

  return (
    <article className="border-b border-zinc-200 py-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.12em] text-zinc-500">
            <span>{levelLabel}</span>
            <span aria-hidden>·</span>
            <span>{grant.programType.replaceAll("_", " ")}</span>
            <span aria-hidden>·</span>
            <span className={tier.text}>{tier.label}</span>
          </div>
          <h3 className="mt-4 text-2xl font-semibold leading-[1.1] tracking-[-0.02em] text-zinc-950 sm:text-3xl">
            <Link href={`/grant/${grant.id}`} className="hover:underline underline-offset-4">
              {grant.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-zinc-500">{grant.sponsor}</p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-700">
            {grant.summary}
          </p>
          {grant.amountDescription && (
            <p className="mt-4 text-base font-medium text-zinc-950">
              {grant.amountDescription}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:w-48 sm:flex-none">
          <Link
            href={`/apply/${grant.id}`}
            className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white transition hover:bg-zinc-800"
          >
            Apply
          </Link>
          <Link
            href={`/grant/${grant.id}`}
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-xs font-medium uppercase tracking-[0.12em] text-zinc-950 ring-1 ring-inset ring-zinc-300 transition hover:bg-zinc-50"
          >
            Details
          </Link>
        </div>
      </div>

      {(whyQualify.length > 0 || whyDisqualify.length > 0) && (
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {whyQualify.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Why you qualify
              </p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-700">
                {whyQualify.slice(0, 4).map((r, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-[3px] inline-block h-[5px] w-[5px] flex-none rounded-full bg-emerald-500" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {whyDisqualify.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Things to confirm
              </p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-700">
                {whyDisqualify.slice(0, 4).map((r, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-[3px] inline-block h-[5px] w-[5px] flex-none rounded-full bg-amber-500" />
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
