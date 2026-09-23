import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db, schema } from "@/lib/db";
import { notifyLead } from "@/lib/notify";

const leadSchema = z.object({
  firstName: z.string().trim().min(1, "First name required"),
  lastName: z.string().trim().min(1, "Last name required"),
  email: z.string().email(),
  phone: z.string().trim().min(7, "Phone required"),
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
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      zip: data.zip ?? null,
      state: data.state?.toUpperCase() ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      criteria: data.criteria as any,
      matchedGrantIds: data.matchedGrantIds,
      wantsRealtor: data.wantsRealtor,
      wantsDigest: data.wantsDigest,
    });

    // Awaited on purpose: a promise left pending after the response is sent
    // is not guaranteed to run on serverless, and the email is currently the
    // only durable record of the lead.
    const notified = await notifyLead({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      state: data.state?.toUpperCase() ?? null,
      zip: data.zip ?? null,
      wantsRealtor: data.wantsRealtor,
      matchedGrantIds: data.matchedGrantIds,
      criteria: data.criteria,
    });
    if (!notified.ok) {
      console.error("[capture-lead] lead", id, "was not emailed:", notified.reason);
    }

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
