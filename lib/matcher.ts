import { eq, or, and, inArray, isNull } from "drizzle-orm";
import { db, schema } from "./db";
import type { BuyerCriteria, Grant } from "./schema";
import { chatJson, isConfigured as watsonxConfigured } from "./watsonx";

export type MatchedGrant = {
  grant: Grant;
  ruleScore: number;          // 0-100 from rule-based pre-filter
  aiScore?: number;           // 0-100 from watsonx.ai
  finalScore: number;         // combined
  whyQualify: string[];       // bullet points
  whyDisqualify: string[];    // potential blockers
  confidence: "high" | "medium" | "low";
};

/**
 * Pre-filter grants by hard geographic + eligibility rules.
 * Cheap SQL pass before we spend tokens on LLM scoring.
 */
function prefilter(grants: Grant[], buyer: BuyerCriteria): Grant[] {
  return grants.filter((g) => {
    // Geography
    if (g.level === "state" && g.state !== buyer.state) return false;
    if (g.level === "county" && g.state !== buyer.state) return false;
    if (
      g.level === "county" &&
      g.county &&
      buyer.county &&
      g.county.toLowerCase() !== buyer.county.toLowerCase()
    ) {
      return false;
    }
    if (g.level === "city" && g.state !== buyer.state) return false;
    if (
      g.level === "city" &&
      g.city &&
      buyer.city &&
      g.city.toLowerCase() !== buyer.city.toLowerCase()
    ) {
      return false;
    }

    // Status
    if (g.status === "ended") return false;

    return true;
  });
}

/**
 * Score a single grant against buyer criteria using deterministic rules.
 * Returns 0-100 and lists of qualifying + disqualifying reasons.
 */
function ruleScore(grant: Grant, buyer: BuyerCriteria): {
  score: number;
  qualify: string[];
  disqualify: string[];
} {
  const e = grant.eligibility;
  const qualify: string[] = [];
  const disqualify: string[] = [];
  let score = 50; // start neutral

  // First-time buyer
  if (e.firstTimeBuyerOnly) {
    if (buyer.firstTimeBuyer) {
      qualify.push("First-time buyer requirement met.");
      score += 10;
    } else {
      disqualify.push("Requires first-time buyer; you've owned before.");
      score -= 40;
    }
  } else if (buyer.firstTimeBuyer) {
    qualify.push("Open to first-time and repeat buyers.");
  }

  // Veteran
  if (e.veteranOnly) {
    if (buyer.veteran || buyer.activeMilitary) {
      qualify.push("Veteran/military service confirmed.");
      score += 20;
    } else {
      disqualify.push("Veteran or active-military status required.");
      score -= 50;
    }
  }

  // Profession
  if (e.professions && e.professions.length > 0) {
    if (buyer.profession && e.professions.includes(buyer.profession)) {
      qualify.push(`Targeted at ${buyer.profession}s — your profession qualifies.`);
      score += 25;
    } else {
      disqualify.push(
        `Limited to: ${e.professions.join(", ")}. Your profession may not qualify.`
      );
      score -= 30;
    }
  }

  // Income (absolute)
  if (typeof e.maxIncome === "number") {
    if (buyer.annualIncome <= e.maxIncome) {
      qualify.push(`Income under $${e.maxIncome.toLocaleString()} cap.`);
      score += 10;
    } else {
      disqualify.push(
        `Income cap is $${e.maxIncome.toLocaleString()}; yours is $${buyer.annualIncome.toLocaleString()}.`
      );
      score -= 40;
    }
  }

  // AMI-relative income (rough — we don't have AMI lookup yet, so we flag for AI)
  if (typeof e.maxIncomeAmiPct === "number" && !e.maxIncome) {
    qualify.push(`Income limit is ${e.maxIncomeAmiPct}% AMI — check local AMI for your county.`);
  }

  // Credit score
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

  // Purchase price
  if (typeof e.maxPurchasePrice === "number" && typeof buyer.targetPurchasePrice === "number") {
    if (buyer.targetPurchasePrice <= e.maxPurchasePrice) {
      qualify.push(`Target price under $${e.maxPurchasePrice.toLocaleString()} cap.`);
    } else {
      disqualify.push(
        `Purchase price cap is $${e.maxPurchasePrice.toLocaleString()}; target is $${buyer.targetPurchasePrice.toLocaleString()}.`
      );
      score -= 30;
    }
  }

  // Owner-occupied
  if (e.ownerOccupiedRequired && !buyer.ownerOccupied) {
    disqualify.push("Requires owner-occupied; you indicated investor/non-occupant.");
    score -= 50;
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
  if (!watsonxConfigured() || grants.length === 0) {
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
  options: { useAi?: boolean; limit?: number } = {}
): Promise<MatchedGrant[]> {
  const useAi = options.useAi !== false; // default true
  const limit = options.limit ?? 30;

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
  const filtered = prefilter(candidates, buyer);

  // 3. Rule score
  const ruleScored = filtered.map((g) => {
    const { score, qualify, disqualify } = ruleScore(g, buyer);
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

  return matched.sort((a, b) => b.finalScore - a.finalScore).slice(0, limit);
}

// Fetch a grant by ID (used in detail page + skills API).
export async function getGrantById(id: string): Promise<Grant | null> {
  const rows = await db.select().from(schema.grants).where(eq(schema.grants.id, id));
  return rows[0] ?? null;
}

// Fetch all active grants (used by curator agent).
export async function listActiveGrants(): Promise<Grant[]> {
  return db.select().from(schema.grants).where(eq(schema.grants.status, "active"));
}
