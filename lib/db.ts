import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

const DB_PATH = process.env.VERCEL
  ? "/tmp/homekey.db"
  : path.join(process.cwd(), "data", "homekey.db");

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS grants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sponsor TEXT NOT NULL,
    level TEXT NOT NULL,
    state TEXT,
    county TEXT,
    city TEXT,
    program_type TEXT NOT NULL,
    amount_min INTEGER,
    amount_max INTEGER,
    amount_description TEXT,
    eligibility TEXT NOT NULL,
    summary TEXT NOT NULL,
    detailed_requirements TEXT NOT NULL,
    application_url TEXT NOT NULL,
    source_url TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active',
    last_verified TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    zip TEXT,
    state TEXT,
    criteria TEXT NOT NULL,
    matched_grant_ids TEXT NOT NULL,
    wants_realtor INTEGER NOT NULL DEFAULT 0,
    wants_digest INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS update_log (
    id TEXT PRIMARY KEY,
    run_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'pending',
    source TEXT NOT NULL,
    change_type TEXT NOT NULL,
    grant_id TEXT,
    diff TEXT NOT NULL,
    reviewed_at TEXT,
    reviewed_by TEXT
  );
`);

export const db = drizzle(sqlite, { schema });
export { schema };

let seeded = false;
export async function ensureSeeded() {
  if (seeded) return;
  const row = sqlite.prepare("SELECT COUNT(*) as c FROM grants").get() as { c: number };
  if (row.c === 0) {
    const { FEDERAL_GRANTS } = await import("./data/seed-federal");
    const { STATE_GRANTS } = await import("./data/seed-states");
    const { LOCAL_GRANTS } = await import("./data/seed-local");
    const all = [...FEDERAL_GRANTS, ...STATE_GRANTS, ...LOCAL_GRANTS];
    for (const g of all) {
      await db.insert(schema.grants).values(g);
    }
  }

  // Demo data: on cold start with an empty leads/update_log table, seed a
  // couple realistic-looking entries so /admin doesn't look dead during a
  // live demo. Skip if DEMO_MODE=false is set explicitly (production).
  if (process.env.DEMO_MODE !== "false") {
    const leadCount = (
      sqlite.prepare("SELECT COUNT(*) as c FROM leads").get() as { c: number }
    ).c;
    if (leadCount === 0) {
      const { seedDemoLeads, seedDemoUpdateLog } = await import("./data/seed-demo");
      for (const lead of seedDemoLeads) {
        await db.insert(schema.leads).values(lead);
      }
      for (const entry of seedDemoUpdateLog) {
        await db.insert(schema.updateLog).values(entry);
      }
    }
  }

  seeded = true;
}
