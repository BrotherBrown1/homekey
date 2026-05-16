import { NextRequest } from "next/server";
import { z } from "zod";
import { matchGrants } from "@/lib/matcher";

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
  useAi: z.boolean().default(true),
  limit: z.number().int().min(1).max(50).default(15),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const buyer = buyerSchema.parse(body);
    const { useAi, limit, ...criteria } = buyer;

    const matches = await matchGrants(
      { ...criteria, state: criteria.state.toUpperCase() },
      { useAi, limit }
    );

    return Response.json({
      success: true,
      count: matches.length,
      matches: matches.map((m) => ({
        id: m.grant.id,
        name: m.grant.name,
        sponsor: m.grant.sponsor,
        level: m.grant.level,
        programType: m.grant.programType,
        amountDescription: m.grant.amountDescription,
        summary: m.grant.summary,
        finalScore: m.finalScore,
        confidence: m.confidence,
        whyQualify: m.whyQualify,
        whyDisqualify: m.whyDisqualify,
        applicationUrl: m.grant.applicationUrl,
      })),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return Response.json({ success: false, error: "validation", issues: err.issues }, { status: 400 });
    }
    console.error("match-grants error", err);
    return Response.json({ success: false, error: "internal" }, { status: 500 });
  }
}
