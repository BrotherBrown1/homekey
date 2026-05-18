import { NextRequest } from "next/server";
import { z } from "zod";
import { getGrantById } from "@/lib/matcher";
import { validateOne } from "@/lib/validator";

const buyerSchema = z.object({
  state: z.string().length(2),
  zip: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  householdSize: z.number().int().min(1).max(15).default(1),
  annualIncome: z.number().int().min(0),
  targetPurchasePrice: z.number().int().min(0).optional(),
  creditScore: z.number().int().min(300).max(850).optional(),
  firstTimeBuyer: z.boolean().default(true),
  veteran: z.boolean().default(false),
  activeMilitary: z.boolean().default(false),
  profession: z.string().optional(),
  ownerOccupied: z.boolean().default(true),
});

const bodySchema = z.object({
  grantId: z.string().min(1),
  buyer: buyerSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grantId, buyer } = bodySchema.parse(body);

    const grant = await getGrantById(grantId);
    if (!grant) {
      return Response.json(
        { success: false, error: "grant_not_found" },
        { status: 404 }
      );
    }

    const verdict = await validateOne(grant, {
      ...buyer,
      state: buyer.state.toUpperCase(),
    });

    return Response.json({
      success: true,
      grantId,
      grantName: grant.name,
      verdict: verdict.verdict,
      reason: verdict.reason,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json(
        { success: false, error: "validation", issues: err.issues },
        { status: 400 }
      );
    }
    console.error("validate-eligibility error", err);
    return Response.json({ success: false, error: "internal" }, { status: 500 });
  }
}
