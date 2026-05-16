import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db, schema } from "@/lib/db";

const leadSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  zip: z.string().optional(),
  state: z.string().length(2).optional(),
  criteria: z.record(z.string(), z.unknown()),
  matchedGrantIds: z.array(z.string()).default([]),
  wantsRealtor: z.boolean().default(false),
  wantsDigest: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = leadSchema.parse(body);

    const id = randomUUID();
    await db.insert(schema.leads).values({
      id,
      email: data.email,
      phone: data.phone ?? null,
      zip: data.zip ?? null,
      state: data.state?.toUpperCase() ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      criteria: data.criteria as any,
      matchedGrantIds: data.matchedGrantIds,
      wantsRealtor: data.wantsRealtor,
      wantsDigest: data.wantsDigest,
    });

    return Response.json({
      success: true,
      leadId: id,
      message: data.wantsRealtor
        ? "We'll have a realtor reach out within 24 hours."
        : "You're on the digest. New grants in your area will arrive weekly.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ success: false, error: "validation", issues: err.issues }, { status: 400 });
    }
    console.error("capture-lead error", err);
    return Response.json({ success: false, error: "internal" }, { status: 500 });
  }
}
