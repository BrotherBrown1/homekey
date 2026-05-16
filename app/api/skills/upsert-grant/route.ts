import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

// Used by the Curator agent to propose changes.
// Writes go to update_log for human approval — NOT directly to grants.
const proposalSchema = z.object({
  source: z.string().url(),
  changeType: z.enum(["new", "modified", "removed"]),
  grantId: z.string().optional(),
  diff: z.record(z.string(), z.unknown()),
});

export async function POST(request: NextRequest) {
  // Lightweight auth: shared secret for the agent.
  const auth = request.headers.get("authorization");
  const expected = process.env.CURATOR_AGENT_TOKEN;
  if (!expected || auth !== `Bearer ${expected}`) {
    return Response.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const proposal = proposalSchema.parse(body);

    const id = randomUUID();
    await db.insert(schema.updateLog).values({
      id,
      source: proposal.source,
      changeType: proposal.changeType,
      grantId: proposal.grantId ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      diff: proposal.diff as any,
      status: "pending",
    });

    return Response.json({
      success: true,
      proposalId: id,
      message: "Change proposal logged for human review.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ success: false, error: "validation", issues: err.issues }, { status: 400 });
    }
    console.error("upsert-grant error", err);
    return Response.json({ success: false, error: "internal" }, { status: 500 });
  }
}

// Curator can also GET the diff queue + list-active-grants.
export async function GET() {
  const rows = await db
    .select()
    .from(schema.updateLog)
    .where(eq(schema.updateLog.status, "pending"));
  return Response.json({ success: true, count: rows.length, pending: rows });
}
