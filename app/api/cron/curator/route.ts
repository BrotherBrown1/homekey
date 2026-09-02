// Weekly Curator entry-point invoked by Vercel Cron (vercel.json).
//
// Vercel Hobby functions max out at 60s, so this batches a small number of
// grants per run. Schedule it daily; it'll cover the 82-program list within
// a week. Vercel auto-injects an `Authorization: Bearer <CRON_SECRET>` header
// when invoking cron routes — we verify it to keep this endpoint private.

import { NextRequest } from "next/server";
import { listActiveGrants } from "@/lib/matcher";
import { chatJson, isConfigured } from "@/lib/watsonx";
import { db, schema } from "@/lib/db";
import { randomUUID } from "node:crypto";
import { BRAND } from "@/lib/config";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 6;

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12_000);
}

async function checkGrant(grant: Awaited<ReturnType<typeof listActiveGrants>>[number]) {
  const res = await fetch(grant.sourceUrl, {
    redirect: "follow",
    headers: {
      "user-agent":
        `${BRAND.name}-Curator/1.0 (Vercel Cron; contact: ${BRAND.realtor.email})`,
      accept: "text/html",
    },
  });
  if (!res.ok) {
    return { changed: true as const, changeType: "modified" as const, fields: { status: "paused" }, evidence: `Source URL returned ${res.status}`, confidence: "high" as const };
  }
  const pageText = htmlToText(await res.text());

  const verdict = await chatJson<{
    changed: boolean;
    changeType?: "modified" | "removed";
    fields?: Record<string, unknown>;
    evidence?: string;
    confidence: "high" | "medium" | "low";
  }>(
    [
      {
        role: "user",
        content: `Comparing live grant page against database record. Respond JSON only.\n\nDB record:\n${JSON.stringify({ name: grant.name, sponsor: grant.sponsor, amountMin: grant.amountMin, amountMax: grant.amountMax, status: grant.status, summary: grant.summary }, null, 2)}\n\nLive page text:\n"""\n${pageText}\n"""\n\nIf the page clearly contradicts the DB on amount, status, or eligibility, return {"changed":true,"changeType":"modified","fields":{...},"evidence":"...","confidence":"high|medium|low"}. Otherwise {"changed":false,"confidence":"high"}. Cosmetic differences do not count.`,
      },
    ],
    { temperature: 0.1, maxTokens: 600 }
  );

  return verdict;
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isConfigured()) {
    return Response.json({ error: "watsonx not configured" }, { status: 500 });
  }

  const all = await listActiveGrants();
  // Pick the BATCH_SIZE grants with the oldest lastVerified date.
  const sorted = [...all].sort((a, b) =>
    (a.lastVerified ?? "").localeCompare(b.lastVerified ?? "")
  );
  const batch = sorted.slice(0, BATCH_SIZE);

  const results: Array<{ id: string; name: string; status: "ok" | "changed" | "error"; note?: string }> = [];

  for (const grant of batch) {
    try {
      const verdict = await checkGrant(grant);
      if (verdict.changed && verdict.confidence !== "low") {
        await db.insert(schema.updateLog).values({
          id: randomUUID(),
          status: "pending",
          source: grant.sourceUrl,
          changeType: verdict.changeType ?? "modified",
          grantId: grant.id,
          diff: {
            fields: verdict.fields,
            evidence: verdict.evidence,
            confidence: verdict.confidence,
          },
        });
        results.push({ id: grant.id, name: grant.name, status: "changed", note: verdict.evidence });
      } else {
        results.push({ id: grant.id, name: grant.name, status: "ok" });
      }
    } catch (err) {
      results.push({
        id: grant.id,
        name: grant.name,
        status: "error",
        note: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return Response.json({
    success: true,
    batchSize: batch.length,
    totalActive: all.length,
    results,
  });
}
