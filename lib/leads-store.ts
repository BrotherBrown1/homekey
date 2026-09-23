// Durable storage for leads.
//
// Why this exists separately from lib/db.ts: on Vercel the SQLite file
// lives in /tmp, which is per-instance and wiped on redeploy. That is
// perfectly fine for `grants` (re-seeded from lib/data/*.ts on every cold
// start) and acceptable for `update_log` (the Curator regenerates its
// proposals on the next run), but leads are irreplaceable customer data.
// A buyer who fills in the quiz must never disappear.
//
// So: when a Postgres connection string is present, leads are written
// there. Otherwise we fall back to the local SQLite table, which keeps
// local development and `npm run dev` working with no extra setup.
//
// Any Postgres provider works — Vercel Postgres, Neon, Supabase — because
// all of them hand you a connection string. Set POSTGRES_URL (or
// DATABASE_URL) in the project's environment variables. Prefer the
// provider's *pooled* connection string on serverless.

import type { Pool as PgPool } from "pg";
import { db, schema, ensureSeeded } from "./db";
import { desc } from "drizzle-orm";
import type { BuyerCriteria } from "./schema";

export type LeadInput = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  zip: string | null;
  state: string | null;
  criteria: BuyerCriteria | Record<string, unknown>;
  matchedGrantIds: string[];
  wantsRealtor: boolean;
  wantsDigest: boolean;
};

export type LeadRow = LeadInput & { createdAt: string };

export type LeadBackend = "postgres" | "sqlite";

const CONNECTION_STRING =
  process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "";

export const leadBackend: LeadBackend = CONNECTION_STRING ? "postgres" : "sqlite";

/** True when leads survive a redeploy. Surfaced on /admin. */
export const leadsAreDurable = leadBackend === "postgres" || !process.env.VERCEL;

// ---------------------------------------------------------------- Postgres

let poolPromise: Promise<PgPool> | null = null;

async function getPool(): Promise<PgPool> {
  if (!poolPromise) {
    poolPromise = (async () => {
      const { Pool } = await import("pg");
      const pool = new Pool({
        connectionString: CONNECTION_STRING,
        // Serverless functions are short-lived and numerous; keep each
        // instance's footprint small so we don't exhaust the server's
        // connection limit.
        max: 3,
        idleTimeoutMillis: 10_000,
        connectionTimeoutMillis: 10_000,
      });
      // Surface background client errors instead of crashing the process.
      pool.on("error", (err) => console.error("[leads-store] pool error", err));
      await pool.query(`
        CREATE TABLE IF NOT EXISTS leads (
          id TEXT PRIMARY KEY,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          zip TEXT,
          state TEXT,
          criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
          matched_grant_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
          wants_realtor BOOLEAN NOT NULL DEFAULT FALSE,
          wants_digest BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
      `);
      return pool;
    })();
    // A failed bootstrap must not poison every later request.
    poolPromise.catch(() => {
      poolPromise = null;
    });
  }
  return poolPromise;
}

async function savePg(lead: LeadInput): Promise<void> {
  const pool = await getPool();
  await pool.query(
    `INSERT INTO leads
       (id, first_name, last_name, email, phone, zip, state,
        criteria, matched_grant_ids, wants_realtor, wants_digest)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11)
     ON CONFLICT (id) DO NOTHING`,
    [
      lead.id,
      lead.firstName,
      lead.lastName,
      lead.email,
      lead.phone,
      lead.zip,
      lead.state,
      JSON.stringify(lead.criteria ?? {}),
      JSON.stringify(lead.matchedGrantIds ?? []),
      lead.wantsRealtor,
      lead.wantsDigest,
    ]
  );
}

async function listPg(limit: number): Promise<LeadRow[]> {
  const pool = await getPool();
  const { rows } = await pool.query(
    `SELECT id, first_name, last_name, email, phone, zip, state,
            criteria, matched_grant_ids, wants_realtor, wants_digest, created_at
       FROM leads ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return rows.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    firstName: r.first_name as string,
    lastName: r.last_name as string,
    email: r.email as string,
    phone: r.phone as string,
    zip: (r.zip as string | null) ?? null,
    state: (r.state as string | null) ?? null,
    criteria: (r.criteria ?? {}) as Record<string, unknown>,
    matchedGrantIds: (r.matched_grant_ids ?? []) as string[],
    wantsRealtor: Boolean(r.wants_realtor),
    wantsDigest: Boolean(r.wants_digest),
    createdAt:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
  }));
}

// ------------------------------------------------------------------ SQLite

async function saveSqlite(lead: LeadInput): Promise<void> {
  await db.insert(schema.leads).values({
    id: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    zip: lead.zip,
    state: lead.state,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    criteria: lead.criteria as any,
    matchedGrantIds: lead.matchedGrantIds,
    wantsRealtor: lead.wantsRealtor,
    wantsDigest: lead.wantsDigest,
  });
}

async function listSqlite(limit: number): Promise<LeadRow[]> {
  await ensureSeeded();
  const rows = await db
    .select()
    .from(schema.leads)
    .orderBy(desc(schema.leads.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    phone: r.phone,
    zip: r.zip ?? null,
    state: r.state ?? null,
    criteria: r.criteria ?? {},
    matchedGrantIds: r.matchedGrantIds ?? [],
    wantsRealtor: Boolean(r.wantsRealtor),
    wantsDigest: Boolean(r.wantsDigest),
    createdAt: r.createdAt,
  }));
}

// ------------------------------------------------------------------- Public

/**
 * Persist a lead. Throws if the write fails so the caller can decide what
 * to tell the buyer — losing a lead silently is the thing this module
 * exists to prevent.
 */
export async function saveLead(lead: LeadInput): Promise<void> {
  if (leadBackend === "postgres") return savePg(lead);
  return saveSqlite(lead);
}

export async function listRecentLeads(limit = 20): Promise<LeadRow[]> {
  if (leadBackend === "postgres") return listPg(limit);
  return listSqlite(limit);
}
