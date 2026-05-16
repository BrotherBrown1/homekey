import { NextRequest } from "next/server";
import { and, eq, like, or, SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const state = params.get("state");
  const level = params.get("level");
  const status = params.get("status") ?? "active";
  const limit = Math.min(Number(params.get("limit") ?? 100), 500);

  const filters: SQL[] = [eq(schema.grants.status, status as "active" | "paused" | "ended")];
  if (state) filters.push(or(eq(schema.grants.state, state.toUpperCase()), eq(schema.grants.level, "federal"))!);
  if (level) filters.push(eq(schema.grants.level, level as "federal" | "state" | "county" | "city"));

  const rows = await db
    .select()
    .from(schema.grants)
    .where(and(...filters))
    .limit(limit);

  return Response.json({
    success: true,
    count: rows.length,
    grants: rows.map((g) => ({
      id: g.id,
      name: g.name,
      sponsor: g.sponsor,
      level: g.level,
      state: g.state,
      county: g.county,
      city: g.city,
      programType: g.programType,
      amountDescription: g.amountDescription,
      summary: g.summary,
      status: g.status,
      lastVerified: g.lastVerified,
      sourceUrl: g.sourceUrl,
    })),
  });
}
