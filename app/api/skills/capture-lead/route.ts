import { NextRequest, after } from "next/server";
import { BRAND } from "@/lib/config";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { saveLead } from "@/lib/leads-store";
import { notifyLead } from "@/lib/notify";
import { enrichLead } from "@/lib/lead-enrich";
import { postToSheet } from "@/lib/sheets";

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
    const receivedAt = new Date().toISOString();

    // Log the lead to the Google Sheet after the response is sent, so a slow
    // spreadsheet never makes the buyer wait. `after` is guaranteed to run to
    // completion on Vercel. The awaited email below remains the record of
    // last resort if the sheet is down.
    after(async () => {
      const row = await enrichLead({
        id,
        receivedAt,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        zip: data.zip ?? null,
        state: data.state?.toUpperCase() ?? null,
        criteria: data.criteria,
        matchedGrantIds: data.matchedGrantIds,
        wantsRealtor: data.wantsRealtor,
      });
      const res = await postToSheet({ type: "lead", lead: row });
      if (!res.ok && res.error !== "not_configured") {
        console.error("[capture-lead] lead", id, "not written to sheet:", res.error);
      }
    });

    // Persist first, but never let a storage failure lose the lead: the
    // email below is an independent durable record, so we only report a
    // failure to the buyer if BOTH channels fail.
    let stored = true;
    try {
      await saveLead({
        id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        zip: data.zip ?? null,
        state: data.state?.toUpperCase() ?? null,
        criteria: data.criteria,
        matchedGrantIds: data.matchedGrantIds,
        wantsRealtor: data.wantsRealtor,
        wantsDigest: data.wantsDigest,
      });
    } catch (e) {
      stored = false;
      console.error("[capture-lead] storage failed for lead", id, e);
    }

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

    if (!stored && !notified.ok) {
      // Both the database and the email failed. Tell the buyer plainly
      // rather than pretending we captured them.
      console.error("[capture-lead] LEAD LOST", id, JSON.stringify(data));
      return Response.json(
        {
          success: false,
          error: "not_captured",
          message:
            "We couldn't save your details just now. Please email " +
            BRAND.realtor.email +
            " and we'll pick this up straight away.",
        },
        { status: 503 }
      );
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
