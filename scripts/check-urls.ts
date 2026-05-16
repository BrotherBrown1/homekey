import { FEDERAL_GRANTS } from "../lib/data/seed-federal";
import { STATE_GRANTS } from "../lib/data/seed-states";
import { LOCAL_GRANTS } from "../lib/data/seed-local";

async function main() {
  const all = [...FEDERAL_GRANTS, ...STATE_GRANTS, ...LOCAL_GRANTS];
  console.log(`Checking ${all.length} apply URLs...`);
  const bad: { name: string; url: string; status: string }[] = [];
  let i = 0;
  async function check(g: any) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const r = await fetch(g.applicationUrl, { method: "HEAD", redirect: "follow", signal: ctrl.signal, headers: { "user-agent": "Mozilla/5.0" } });
      clearTimeout(t);
      if (r.status >= 400) bad.push({ name: g.name, url: g.applicationUrl, status: String(r.status) });
    } catch (e: any) {
      bad.push({ name: g.name, url: g.applicationUrl, status: e.name || "err" });
    }
  }
  const workers = Array.from({length: 12}, async () => {
    while (i < all.length) { const j = i++; await check(all[j]); }
  });
  await Promise.all(workers);
  console.log(`\n${bad.length} of ${all.length} broken:`);
  for (const b of bad) console.log(`  [${b.status}] ${b.name}\n         ${b.url}`);
}
main();
