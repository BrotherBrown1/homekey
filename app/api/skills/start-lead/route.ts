import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { saveLead } from "@/lib/leads-store";
import { notifyLead } from "@/lib/notify";

// Lightweight lead capture fired the moment a buyer finishes the first
// onboarding step (name + contact). Saves a "starter" lead so Christian
// gets a hot alert immediately — even if the buyer bails before finishing
// the matching questions.

const starterSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().email(),
  phone: z.string().trim().min(7),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = starterSchema.parse(body);

    const id = randomUUID();
    try {
      await saveLead({
        id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        zip: null,
        state: null,
        criteria: {},
        matchedGrantIds: [],
        wantsRealtor: false,
        wantsDigest: true,
      });
    } catch (e) {
      console.error("[start-lead] storage failed for lead", id, e);
    }

    const notified = await notifyLead({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      state: null,
      zip: null,
      wantsRealtor: false,
      matchedGrantIds: [],
      criteria: { stage: "started" },
    });
    if (!notified.ok) {
      console.error("[start-lead] lead", id, "was not emailed:", notified.reason);
    }

    return Response.json({ success: true, leadId: id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json(
        { success: false, error: "validation", issues: err.issues },
        { status: 400 }
      );
    }
    console.error("start-lead error", err);
    return Response.json({ success: false, error: "internal" }, { status: 500 });
  }
}
