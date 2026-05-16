import { db, schema } from "../lib/db";
import { FEDERAL_GRANTS } from "../lib/data/seed-federal";
import { STATE_GRANTS } from "../lib/data/seed-states";
import { LOCAL_GRANTS } from "../lib/data/seed-local";

const ALL_GRANTS = [...FEDERAL_GRANTS, ...STATE_GRANTS, ...LOCAL_GRANTS];

async function main() {
  console.log(`Seeding ${ALL_GRANTS.length} grants...`);

  // Idempotent: clear then re-insert.
  await db.delete(schema.grants);

  for (const grant of ALL_GRANTS) {
    await db.insert(schema.grants).values(grant);
  }

  const count = await db.select().from(schema.grants);
  console.log(`✓ Seed complete. ${count.length} grants in database.`);

  // Breakdown by level
  const byLevel = count.reduce<Record<string, number>>((acc, g) => {
    acc[g.level] = (acc[g.level] ?? 0) + 1;
    return acc;
  }, {});
  console.log("By level:", byLevel);

  const byState = count
    .filter((g) => g.state)
    .reduce<Record<string, number>>((acc, g) => {
      acc[g.state!] = (acc[g.state!] ?? 0) + 1;
      return acc;
    }, {});
  console.log("States covered:", Object.keys(byState).length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
