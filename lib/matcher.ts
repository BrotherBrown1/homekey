import { eq, or, and, inArray, isNull } from "drizzle-orm";
import { db, schema, ensureSeeded } from "./db";
import type { BuyerCriteria, Grant } from "./schema";
import { chatJson, isConfigured as llmConfigured } from "./llm";
import { resolveLocation, normalizeCounty, normalizeCity } from "./geo/locations";
import { lookupAmi, amiIncomeLimit, AMI_DATA_YEAR, type AmiLookup } from "./geo/ami";

export type MatchedGrant = {
  grant: Grant;
  ruleScore: number;          // 0-100 from rule-based pre-filter
  aiScore?: number;           // 0-100 from watsonx.ai
  finalScore: number;         // combined
  whyQualify: string[];       // bullet points
  whyDisqualify: string[];    // potential blockers
  confidence: "high" | "medium" | "low";
};

// Generous national upper bound for AMI-based programs, used only when we
// have no AMI figure for the buyer's state at all.
const AMI_PROGRAM_INCOME_CEILING = 300_000;

// Our AMI table is transcribed from HUD and accurate to roughly ±10%, so a
// buyer is only hard-excluded when clearly over the limit, and anyone near
// the line is told to confirm with the program.
const AMI_HARD_EXCLUDE_FACTOR = 1.15; // income > 115% of the limit → out
const AMI_COMFORT_FACTOR = 0.9; // income < 90% of the limit → clearly under

type Geo = {
  county?: string;
  city?: string;
  countyInferred: boolean;
  ami: AmiLookup | null;
};

function amiLimitFor(g: Grant, buyer: BuyerCriteria, geo: Geo): number | null {
  const e = g.eligibility;
  if (typeof e.maxIncomeAmiPct !== "number" || !geo.ami) return null;
  return amiIncomeLimit(geo.ami, e.maxIncomeAmiPct, buyer.householdSize);
}

/**
 * Pre-filter grants by hard geographic + eligibility rules.
 * Definitive disqualifiers exclude the grant entirely — there's no value
 * in showing someone a program they categorically cannot get.
 */
function prefilter(grants: Grant[], buyer: BuyerCriteria, geo: Geo): Grant[] {
  return grants.filter((g) => {
    // Geography
    if (g.level === "state" && g.state !== buyer.state) return false;
    if (g.level === "county" && g.state !== buyer.state) return false;
    if (
      g.level === "county" &&
      g.county &&
      geo.county &&
      normalizeCounty(g.county)?.toLowerCase() !== geo.county.toLowerCase()
    ) {
      return false;
    }
    if (g.level === "city" && g.state !== buyer.state) return false;
    if (
      g.level === "city" &&
      g.city &&
      geo.city &&
      normalizeCity(g.city)?.toLowerCase() !== geo.city.toLowerCase()
    ) {
      return false;
    }

    // Status
    if (g.status === "ended") return false;

    const e = g.eligibility;

    // Definitive eligibility disqualifiers
    if (e.firstTimeBuyerOnly && !buyer.firstTimeBuyer) return false;
    if (e.veteranOnly && !buyer.veteran && !buyer.activeMilitary) return false;
    if (e.ownerOccupiedRequired && !buyer.ownerOccupied) return false;
    if (
      e.professions &&
      e.professions.length > 0 &&
      (!buyer.profession || !e.professions.includes(buyer.profession))
    ) {
      return false;
    }
    if (typeof e.maxIncome === "number" && buyer.annualIncome > e.maxIncome) {
      return false;
    }
    // AMI-gated programs: compute the real limit for the buyer's county and
    // household size, and exclude buyers who are clearly over it.
    if (typeof e.maxIncomeAmiPct === "number" && typeof e.maxIncome !== "number") {
      const limit = amiLimitFor(g, buyer, geo);
      if (limit !== null) {
        if (buyer.annualIncome > limit * AMI_HARD_EXCLUDE_FACTOR) return false;
      } else if (buyer.annualIncome > AMI_PROGRAM_INCOME_CEILING) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Score a single grant against buyer criteria using deterministic rules.
 * Returns 0-100 and lists of qualifying + disqualifying reasons.
 */
function ruleScore(grant: Grant, buyer: BuyerCriteria, geo: Geo): {
  score: number;
  qualify: string[];
  disqualify: string[];
} {
  // By the time we reach here, prefilter has already removed any grant where
  // the buyer fails a hard disqualifier (income cap, veteran-only, profession,
  // first-time-only, owner-occupied). So this scorer only handles soft signals
  // and positive-fit boosts.
  const e = grant.eligibility;
  const qualify: string[] = [];
  const disqualify: string[] = [];
  let score = 60; // start slightly above neutral — passing prefilter is itself a positive signal

  if (e.firstTimeBuyerOnly && buyer.firstTimeBuyer) {
    qualify.push("First-time buyer requirement met.");
    score += 10;
  } else if (!e.firstTimeBuyerOnly && buyer.firstTimeBuyer) {
    qualify.push("Open to first-time and repeat buyers.");
  }

  if (e.veteranOnly && (buyer.veteran || buyer.activeMilitary)) {
    qualify.push("Veteran/military service confirmed.");
    score += 20;
  }

  if (
    e.professions &&
    e.professions.length > 0 &&
    buyer.profession &&
    e.professions.includes(buyer.profession)
  ) {
    qualify.push(`Targeted at ${buyer.profession}s — your profession qualifies.`);
    score += 25;
  }

  if (typeof e.maxIncome === "number") {
    qualify.push(`Income under $${e.maxIncome.toLocaleString()} cap.`);
    score += 10;
  } else if (typeof e.maxIncomeAmiPct === "number") {
    // AMI-gated. Prefilter already removed buyers clearly over the limit.
    const limit = amiLimitFor(grant, buyer, geo);
    if (limit === null) {
      qualify.push(
        `Income limit is ${e.maxIncomeAmiPct}% of Area Median Income for your county.`
      );
    } else {
      const where = geo.ami!.precision === "metro"
        ? `${geo.county} County`
        : `${buyer.state} (statewide estimate)`;
      const limitText = `$${limit.toLocaleString()} (${e.maxIncomeAmiPct}% of area median income, ${where}, household of ${buyer.householdSize})`;
      if (buyer.annualIncome <= limit * AMI_COMFORT_FACTOR) {
        qualify.push(`Income of $${buyer.annualIncome.toLocaleString()} is under the ~${limitText} limit.`);
        score += 10;
      } else {
        disqualify.push(
          `Income of $${buyer.annualIncome.toLocaleString()} is close to the ~${limitText} limit. Confirm the exact ${AMI_DATA_YEAR} figure with the program.`
        );
        score -= 15;
      }
    }
  }

  // Credit score — soft. Many buyers don't know their exact score, so this
  // is a warning, not a disqualifier.
  if (typeof e.minCreditScore === "number" && typeof buyer.creditScore === "number") {
    if (buyer.creditScore >= e.minCreditScore) {
      qualify.push(`Credit score (${buyer.creditScore}) meets ${e.minCreditScore} minimum.`);
      score += 5;
    } else {
      disqualify.push(
        `Requires ${e.minCreditScore}+ credit; you reported ${buyer.creditScore}.`
      );
      score -= 25;
    }
  }

  // Purchase price — soft. Target price is aspirational and often shifts.
  if (typeof e.maxPurchasePrice === "number" && typeof buyer.targetPurchasePrice === "number") {
    if (buyer.targetPurchasePrice <= e.maxPurchasePrice) {
      qualify.push(`Target price under $${e.maxPurchasePrice.toLocaleString()} cap.`);
    } else {
      disqualify.push(
        `Purchase price cap is $${e.maxPurchasePrice.toLocaleString()}; target is $${buyer.targetPurchasePrice.toLocaleString()}.`
      );
      score -= 20;
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    qualify,
    disqualify,
  };
}

/**
 * AI scoring pass via watsonx.ai. Considers ambiguous fields (AMI, notes,
 * tag overlap) the rule engine can't reason about.
 */
async function aiScore(
  grants: Grant[],
  buyer: BuyerCriteria
): Promise<Map<string, { score: number; reasoning: string }>> {
  if (!llmConfigured() || grants.length === 0) {
    return new Map();
  }

  const items = grants.map((g) => ({
    id: g.id,
    name: g.name,
    summary: g.summary,
    eligibility: g.eligibility,
    tags: g.tags,
    level: g.level,
    state: g.state,
  }));

  const prompt = `You are an expert on US first-time homebuyer and down payment assistance programs.

A buyer's profile:
${JSON.stringify(buyer, null, 2)}

Given these candidate programs (pre-filtered for geographic match), score each from 0 to 100 based on how well the buyer would qualify, considering:
- Stated eligibility rules
- Free-text notes that hint at additional requirements (e.g., "targeted areas")
- Tag overlap with buyer profile
- Practical likelihood of qualifying

Return JSON only, no prose:
{
  "scores": [
    { "id": "...", "score": 85, "reasoning": "one sentence on the strongest match factor or biggest concern" }
  ]
}

Programs:
${JSON.stringify(items, null, 2)}`;

  try {
    const result = await chatJson<{
      scores: Array<{ id: string; score: number; reasoning: string }>;
    }>(
      [{ role: "user", content: prompt }],
      { temperature: 0.2, maxTokens: 2500 }
    );

    const map = new Map<string, { score: number; reasoning: string }>();
    for (const s of result.scores ?? []) {
      map.set(s.id, { score: s.score, reasoning: s.reasoning });
    }
    return map;
  } catch (err) {
    console.error("watsonx.ai scoring failed, falling back to rules only:", err);
    return new Map();
  }
}

export async function matchGrants(
  buyer: BuyerCriteria,
  options: { useAi?: boolean; limit?: number; validate?: boolean } = {}
): Promise<MatchedGrant[]> {
  await ensureSeeded();
  const useAi = options.useAi !== false; // default true
  const validate = options.validate !== false; // default true
  const limit = options.limit ?? 30;

  // 0. Recognize the buyer's location: normalize what they typed, infer the
  //    county from the city if it was left blank, and look up the area
  //    median income for that county.
  const loc = resolveLocation(buyer);
  const geo: Geo = {
    county: loc.county,
    city: loc.city,
    countyInferred: loc.countyInferred,
    ami: lookupAmi(loc.state, loc.county),
  };

  // 1. Load all candidate grants (federal + buyer's state + their county + their city)
  const candidates = await db
    .select()
    .from(schema.grants)
    .where(
      or(
        eq(schema.grants.level, "federal"),
        and(eq(schema.grants.level, "state"), eq(schema.grants.state, buyer.state)),
        and(eq(schema.grants.level, "county"), eq(schema.grants.state, buyer.state)),
        and(eq(schema.grants.level, "city"), eq(schema.grants.state, buyer.state))
      )
    );

  // 2. Pre-filter
  const filtered = prefilter(candidates, buyer, geo);

  // 3. Rule score
  const ruleScored = filtered.map((g) => {
    const { score, qualify, disqualify } = ruleScore(g, buyer, geo);
    return { grant: g, ruleScore: score, whyQualify: qualify, whyDisqualify: disqualify };
  });

  // 4. AI score (top candidates only, to save tokens)
  const topForAi = [...ruleScored]
    .sort((a, b) => b.ruleScore - a.ruleScore)
    .slice(0, Math.max(limit, 15));

  const aiScores = useAi ? await aiScore(topForAi.map((r) => r.grant), buyer) : new Map();

  // 5. Combine scores
  const matched: MatchedGrant[] = topForAi.map((r) => {
    const ai = aiScores.get(r.grant.id);
    const finalScore = ai
      ? Math.round(r.ruleScore * 0.55 + ai.score * 0.45)
      : r.ruleScore;

    let confidence: MatchedGrant["confidence"] = "medium";
    if (r.whyDisqualify.length === 0 && finalScore >= 75) confidence = "high";
    if (r.whyDisqualify.length > 1 || finalScore < 40) confidence = "low";

    return {
      grant: r.grant,
      ruleScore: r.ruleScore,
      aiScore: ai?.score,
      finalScore,
      whyQualify: r.whyQualify,
      whyDisqualify: r.whyDisqualify,
      confidence,
    };
  });

  const ranked = matched.sort((a, b) => b.finalScore - a.finalScore).slice(0, limit);

  // 6. Validator pass — second-look agent removes grants the rules couldn't
  //    catch (targeted areas, AMI ceilings, county wrinkles).
  if (!validate) return ranked;
  const { validateEligibility } = await import("./validator");
  const validated = await validateEligibility(ranked, buyer);
  return validated;
}

// Fetch a grant by ID (used in detail page + skills API).
export async function getGrantById(id: string): Promise<Grant | null> {
  await ensureSeeded();
  const rows = await db.select().from(schema.grants).where(eq(schema.grants.id, id));
  return rows[0] ?? null;
}

// Fetch all active grants (used by curator agent).
export async function listActiveGrants(): Promise<Grant[]> {
  await ensureSeeded();
  return db.select().from(schema.grants).where(eq(schema.grants.status, "active"));
}

/** Resolved location + AMI for display (results heading, admin). */
export function describeLocation(buyer: BuyerCriteria) {
  const loc = resolveLocation(buyer);
  return { ...loc, ami: lookupAmi(loc.state, loc.county) };
}
