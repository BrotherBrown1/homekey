import type { BuyerCriteria, Grant } from "./schema";
import type { MatchedGrant } from "./matcher";
import { chatJson, isConfigured as watsonxConfigured } from "./watsonx";

export type ValidationVerdict = "eligible" | "uncertain" | "ineligible";

export type ValidatedGrant = MatchedGrant & {
  validation?: {
    verdict: ValidationVerdict;
    reason: string;
  };
};

type ValidatorResponse = {
  results: Array<{
    id: string;
    verdict: ValidationVerdict;
    reason: string;
  }>;
};

/**
 * Second-look agent. Runs after the rule-based matcher to catch
 * ambiguous ineligibility the rules can't see:
 *   - "Targeted areas only" notes (specific neighborhoods/census tracts)
 *   - AMI percentage caps that aren't an absolute dollar cap
 *   - County- or city-restricted notes embedded in detailedRequirements
 *   - Hidden eligibility wrinkles in the program summary
 *
 * Returns the same shape as matchGrants() but with ineligible grants
 * dropped and uncertain ones downgraded to lower confidence.
 */
export async function validateEligibility(
  matches: MatchedGrant[],
  buyer: BuyerCriteria
): Promise<ValidatedGrant[]> {
  if (matches.length === 0) return [];
  if (!watsonxConfigured()) return matches;

  const items = matches.map((m) => ({
    id: m.grant.id,
    name: m.grant.name,
    level: m.grant.level,
    state: m.grant.state,
    county: m.grant.county,
    city: m.grant.city,
    summary: m.grant.summary,
    detailedRequirements: m.grant.detailedRequirements,
    eligibility: m.grant.eligibility,
  }));

  const prompt = `You are an expert validator for US first-time home buyer grant programs.

A buyer's profile:
${JSON.stringify(buyer, null, 2)}

The matcher already removed obvious disqualifications (income cap, veteran-only, first-time-only, profession-restricted, owner-occupied). Your job is the second look: catch eligibility wrinkles the rule engine cannot see.

For each program, decide:
- "eligible"    — buyer plausibly qualifies; no notable concerns
- "uncertain"   — needs human review; some condition is ambiguous (e.g., "targeted census tracts", "80% AMI in this specific county", "limited funding window")
- "ineligible"  — the program's notes, detailedRequirements, or summary make clear the buyer would not qualify (e.g., income obviously exceeds the local AMI cap, geography is narrower than the buyer's, program is implicitly for a different population)

Return JSON only:
{
  "results": [
    { "id": "...", "verdict": "eligible" | "uncertain" | "ineligible", "reason": "one short sentence" }
  ]
}

Programs:
${JSON.stringify(items, null, 2)}`;

  try {
    const data = await chatJson<ValidatorResponse>(
      [{ role: "user", content: prompt }],
      { temperature: 0.1, maxTokens: 2000 }
    );

    const verdictMap = new Map<string, { verdict: ValidationVerdict; reason: string }>();
    for (const r of data.results ?? []) {
      verdictMap.set(r.id, { verdict: r.verdict, reason: r.reason });
    }

    const validated: ValidatedGrant[] = [];
    for (const m of matches) {
      const v = verdictMap.get(m.grant.id);
      if (!v) {
        // Validator didn't return a verdict for this one — keep it as-is.
        validated.push(m);
        continue;
      }
      if (v.verdict === "ineligible") {
        // Drop it entirely.
        continue;
      }
      if (v.verdict === "uncertain") {
        validated.push({
          ...m,
          confidence: m.confidence === "high" ? "medium" : m.confidence,
          whyDisqualify: [...m.whyDisqualify, `Validator flag: ${v.reason}`],
          validation: v,
        });
        continue;
      }
      validated.push({ ...m, validation: v });
    }

    return validated;
  } catch (err) {
    console.error("Validator agent failed, falling back to unvalidated matches:", err);
    return matches;
  }
}

/**
 * Validates a single grant against a buyer — used by the standalone
 * Orchestrate skill endpoint. Returns a verdict and reason.
 */
export async function validateOne(
  grant: Grant,
  buyer: BuyerCriteria
): Promise<{ verdict: ValidationVerdict; reason: string }> {
  if (!watsonxConfigured()) {
    return { verdict: "uncertain", reason: "watsonx.ai not configured — cannot validate." };
  }

  const prompt = `You are an expert validator for US first-time home buyer grant programs.

Buyer:
${JSON.stringify(buyer, null, 2)}

Program:
${JSON.stringify(
    {
      id: grant.id,
      name: grant.name,
      level: grant.level,
      state: grant.state,
      county: grant.county,
      city: grant.city,
      summary: grant.summary,
      detailedRequirements: grant.detailedRequirements,
      eligibility: grant.eligibility,
    },
    null,
    2
  )}

Decide if this specific buyer plausibly qualifies. Return JSON only:
{ "verdict": "eligible" | "uncertain" | "ineligible", "reason": "one short sentence" }`;

  try {
    const data = await chatJson<{ verdict: ValidationVerdict; reason: string }>(
      [{ role: "user", content: prompt }],
      { temperature: 0.1, maxTokens: 300 }
    );
    return data;
  } catch (err) {
    console.error("validateOne failed:", err);
    return { verdict: "uncertain", reason: "Validator error; defer to human review." };
  }
}
