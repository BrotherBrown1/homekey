/**
 * Curator Agent — weekly grant-update worker.
 *
 * For each active grant in the DB:
 *   1. Fetch its source URL (HTML).
 *   2. Ask watsonx.ai whether the program has changed (amount, eligibility,
 *      status, application URL) — strictly comparing to the stored copy.
 *   3. If yes, POST a proposal to /api/skills/upsert-grant for human review.
 *
 * This script can be invoked:
 *   - From the command line as a cron job: `npm run curator`
 *   - From watsonx Orchestrate as a scheduled flow (run via HTTP webhook
 *     hitting /api/curator/run — TODO if Orchestrate prefers HTTP)
 *
 * It exists as a Node script (not a Next.js route) so it can run for many
 * minutes without hitting serverless timeouts.
 */

import { listActiveGrants } from "../lib/matcher";
import { chatJson, isConfigured } from "../lib/watsonx";
import { BRAND } from "../lib/config";

const ADMIN_BASE = process.env.HOMEKEY_API_BASE ?? "http://localhost:3000";
const TOKEN = process.env.CURATOR_AGENT_TOKEN;

type CuratorVerdict = {
  changed: boolean;
  changeType?: "modified" | "removed";
  fields?: {
    amountMin?: number | null;
    amountMax?: number | null;
    amountDescription?: string;
    status?: "active" | "paused" | "ended";
    summary?: string;
  };
  evidence?: string;
  confidence: "high" | "medium" | "low";
};

async function fetchSource(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        `${BRAND.name}-Curator/1.0 (grant tracker; contact: ${BRAND.realtor.email})`,
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`fetch ${url} failed: ${res.status}`);
  }
  const html = await res.text();
  // Crude HTML-to-text to keep token budget low. Real impl: use cheerio.
  return html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12_000); // ~3k tokens
}

async function askWatsonxIfChanged(
  grant: Awaited<ReturnType<typeof listActiveGrants>>[number],
  pageText: string
): Promise<CuratorVerdict> {
  const prompt = `You are checking whether a home-buyer grant program has changed since we last verified it.

CURRENT DATABASE RECORD:
${JSON.stringify(
  {
    name: grant.name,
    sponsor: grant.sponsor,
    amountMin: grant.amountMin,
    amountMax: grant.amountMax,
    amountDescription: grant.amountDescription,
    summary: grant.summary,
    status: grant.status,
    eligibility: grant.eligibility,
  },
  null,
  2
)}

CURRENT PAGE TEXT (extracted from ${grant.sourceUrl}):
"""
${pageText}
"""

Compare carefully. Has anything material changed? Respond with JSON ONLY:
{
  "changed": true|false,
  "changeType": "modified"|"removed" (only if changed),
  "fields": { only the fields that changed, with new values },
  "evidence": "quote the page text that shows the change",
  "confidence": "high"|"medium"|"low"
}

Be conservative — say "changed" only if the page CLEARLY contradicts the DB. Cosmetic
or marketing wording does not count. If the program is shut down or "no longer
accepting applications", set changeType="removed".`;

  return chatJson<CuratorVerdict>(
    [{ role: "user", content: prompt }],
    { temperature: 0.1, maxTokens: 800 }
  );
}

async function proposeChange(
  grantId: string,
  source: string,
  changeType: "modified" | "removed",
  diff: Record<string, unknown>
) {
  if (!TOKEN) throw new Error("CURATOR_AGENT_TOKEN not set");

  const res = await fetch(`${ADMIN_BASE}/api/skills/upsert-grant`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ source, changeType, grantId, diff }),
  });

  if (!res.ok) {
    console.error(`  ! upsert failed: ${res.status} ${await res.text()}`);
  }
}

async function main() {
  if (!isConfigured()) {
    console.error(
      "⚠️  watsonx.ai is not configured. Set IBM_CLOUD_API_KEY + WATSONX_PROJECT_ID in .env.local."
    );
    process.exit(1);
  }

  const grants = await listActiveGrants();
  console.log(`Curator: checking ${grants.length} active grants...`);

  let changed = 0;
  let errors = 0;

  for (const [i, grant] of grants.entries()) {
    process.stdout.write(`[${i + 1}/${grants.length}] ${grant.name.slice(0, 50).padEnd(50)} `);

    try {
      const pageText = await fetchSource(grant.sourceUrl);
      const verdict = await askWatsonxIfChanged(grant, pageText);

      if (verdict.changed && verdict.confidence !== "low") {
        console.log(`CHANGED (${verdict.changeType})`);
        await proposeChange(
          grant.id,
          grant.sourceUrl,
          verdict.changeType ?? "modified",
          {
            fields: verdict.fields,
            evidence: verdict.evidence,
            confidence: verdict.confidence,
          }
        );
        changed += 1;
      } else {
        console.log("ok");
      }
    } catch (err) {
      console.log(`error: ${err instanceof Error ? err.message : "unknown"}`);
      errors += 1;
    }

    // Politeness delay
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(
    `\n✓ Curator complete. ${changed} changes queued for review, ${errors} errors.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
