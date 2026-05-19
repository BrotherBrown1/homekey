import { NextRequest } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db, schema } from "@/lib/db";
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
    await db.insert(schema.leads).values({
      id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      zip: null,
      state: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      criteria: {} as any,
      matchedGrantIds: [],
      wantsRealtor: false,
      wantsDigest: true,
    });

    notifyLead({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      state: null,
      zip: null,
      wantsRealtor: false,
      matchedGrantIds: [],
      criteria: { stage: "started" },
    }).catch((e) => console.error("notifyLead (starter) failed", e));

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
