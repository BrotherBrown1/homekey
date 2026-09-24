// Turns a captured lead into the categorized row the Google Sheet stores.
//
// Everything here is derived server-side from data the app already has —
// the buyer's answers, the program database, and the HUD area-median-income
// table — so the sheet can sort and group leads the way a realtor thinks
// about them: where they are, how their income compares to the local limits
// most grants use, and how ready they are to talk.

import { listActiveGrants } from "./matcher";
import { resolveLocation } from "./geo/locations";
import { lookupAmi, householdFactor } from "./geo/ami";
import type { Grant } from "./schema";

export type CapturedLead = {
  id: string;
  receivedAt: string; // ISO timestamp
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  zip: string | null;
  state: string | null;
  criteria: Record<string, unknown>;
  matchedGrantIds: string[];
  wantsRealtor: boolean;
};

export type SheetLeadRow = {
  leadId: string;
  receivedAt: string;
  priority: "Hot" | "Warm" | "Cold";
  name: string;
  email: string;
  phone: string;
  wantsCallback: "Yes" | "No";
  source: string;
  state: string;
  county: string;
  city: string;
  householdSize: number | "";
  annualIncome: number | "";
  incomeBand: string;
  amiPercent: number | "";
  amiTier: string;
  targetPrice: number | "";
  creditScore: number | "";
  creditBand: string;
  firstTimeBuyer: "Yes" | "No" | "";
  military: string;
  profession: string;
  grantsMatched: number;
  loansMatched: number;
  /** Largest single grant-type award among the matches (they rarely all stack). */
  biggestGrant: number;
  topPrograms: string;
};

// Program types a buyer does not repay (or that pay them back as a credit).
const GRANT_TYPES = new Set(["grant", "forgivable_loan", "tax_credit", "voucher"]);

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined;
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const bool = (v: unknown): boolean | undefined =>
  typeof v === "boolean" ? v : v === "true" ? true : v === "false" ? false : undefined;

export function incomeBand(income?: number): string {
  if (income === undefined) return "";
  if (income < 50_000) return "Under $50k";
  if (income < 75_000) return "$50k–75k";
  if (income < 100_000) return "$75k–100k";
  if (income < 150_000) return "$100k–150k";
  return "$150k+";
}

export function creditBand(score?: number): string {
  if (score === undefined || score === 0) return "Not given";
  if (score < 580) return "Under 580";
  if (score < 620) return "580–619";
  if (score < 680) return "620–679";
  if (score < 740) return "680–739";
  return "740+";
}

/**
 * Where income sits against the area median for this household size. Most
 * down-payment grants cap eligibility at 80% or 120% of AMI, so this is the
 * single most useful column for guessing which programs a lead can use.
 */
export function amiTier(pct?: number): string {
  if (pct === undefined) return "";
  if (pct <= 50) return "Very low (≤50% AMI)";
  if (pct <= 80) return "Low (51–80% AMI)";
  if (pct <= 120) return "Moderate (81–120% AMI)";
  return "Above 120% AMI";
}

/**
 * Hot: asked for a callback and has grant money on the table (or applied to
 * a specific program). Warm: asked for a callback, or has grants and credit
 * that clears the usual 620 floor. Cold: everything else.
 */
export function priority(args: {
  wantsCallback: boolean;
  grantsMatched: number;
  fromApplyButton: boolean;
  creditScore?: number;
}): SheetLeadRow["priority"] {
  const { wantsCallback, grantsMatched, fromApplyButton, creditScore } = args;
  if (wantsCallback && (grantsMatched > 0 || fromApplyButton)) return "Hot";
  const creditOk = creditScore === undefined || creditScore === 0 || creditScore >= 620;
  if (wantsCallback || (grantsMatched > 0 && creditOk)) return "Warm";
  return "Cold";
}

export async function enrichLead(lead: CapturedLead): Promise<SheetLeadRow> {
  const c = lead.criteria ?? {};
  const fromApplyButton = c.source === "apply-page";

  // Resolve matched program IDs to names, types, and amounts.
  let grants: Grant[] = [];
  try {
    const all = await listActiveGrants();
    const byId = new Map(all.map((g) => [g.id, g]));
    grants = lead.matchedGrantIds.map((id) => byId.get(id)).filter((g): g is Grant => Boolean(g));
  } catch (e) {
    console.error("[lead-enrich] could not load programs", e);
  }

  // Apply-button leads carry no location of their own, but the program they
  // applied to does (e.g. an Oakland County program → Oakland County, MI).
  const applied = fromApplyButton ? grants[0] : undefined;
  const stateRaw = str(c.state) || lead.state || applied?.state || "";
  const loc = stateRaw
    ? resolveLocation({
        state: stateRaw,
        city: str(c.city) || applied?.city || "",
        county: str(c.county) || applied?.county || "",
      })
    : undefined;

  const householdSize = num(c.householdSize);
  const income = num(c.annualIncome);
  const credit = num(c.creditScore);

  let amiPercent: number | undefined;
  if (loc && income !== undefined && householdSize) {
    const ami = lookupAmi(loc.state, loc.county);
    if (ami) {
      amiPercent = Math.round((income / (ami.mfi4 * householdFactor(householdSize))) * 100);
    }
  }

  const grantMatches = grants.filter((g) => GRANT_TYPES.has(g.programType));
  const loanMatches = grants.filter((g) => !GRANT_TYPES.has(g.programType));
  // Not a sum: many programs can't be combined (same funder, specific
  // homes only), so the total would overstate what a buyer can get.
  const biggestGrant = grantMatches.reduce((max, g) => Math.max(max, g.amountMax ?? 0), 0);
  const topPrograms = [...grantMatches]
    .sort((a, b) => (b.amountMax ?? 0) - (a.amountMax ?? 0))
    .slice(0, 3)
    .map((g) => g.name)
    .join("; ");

  const veteran = bool(c.veteran);
  const active = bool(c.activeMilitary);
  const military = active ? "Active duty" : veteran ? "Veteran" : veteran === false ? "No" : "";
  const firstTime = bool(c.firstTimeBuyer);

  return {
    leadId: lead.id,
    receivedAt: lead.receivedAt,
    priority: priority({
      wantsCallback: lead.wantsRealtor,
      grantsMatched: grantMatches.length,
      fromApplyButton,
      creditScore: credit,
    }),
    name: `${lead.firstName} ${lead.lastName}`.trim(),
    email: lead.email,
    phone: lead.phone,
    wantsCallback: lead.wantsRealtor ? "Yes" : "No",
    source: fromApplyButton
      ? `Apply button: ${str(c.grantName) || str(c.grantId) || "program"}`
      : income !== undefined
        ? "Grant quiz"
        : "Other",
    state: loc?.state ?? "",
    county: loc?.county ?? "",
    city: loc?.city ?? "",
    householdSize: householdSize ?? "",
    annualIncome: income ?? "",
    incomeBand: incomeBand(income),
    amiPercent: amiPercent ?? "",
    amiTier: amiTier(amiPercent),
    targetPrice: num(c.targetPurchasePrice) ?? "",
    creditScore: credit ?? "",
    creditBand: income !== undefined || credit !== undefined ? creditBand(credit) : "",
    firstTimeBuyer: firstTime === undefined ? "" : firstTime ? "Yes" : "No",
    military,
    profession: str(c.profession),
    grantsMatched: grantMatches.length,
    loansMatched: loanMatches.length,
    biggestGrant,
    topPrograms,
  };
}
