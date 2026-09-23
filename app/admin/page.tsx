import { db, schema, ensureSeeded } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { isConfigured as llmConfigured, activeProvider } from "@/lib/llm";
import { listRecentLeads, leadBackend, leadsAreDurable } from "@/lib/leads-store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await ensureSeeded();
  const [grants, pendingProposals, leads] = await Promise.all([
    db.select().from(schema.grants),
    db
      .select()
      .from(schema.updateLog)
      .where(eq(schema.updateLog.status, "pending"))
      .orderBy(desc(schema.updateLog.runAt))
      .limit(50),
    listRecentLeads(20),
  ]);

  const grantsByLevel = grants.reduce<Record<string, number>>((acc, g) => {
    acc[g.level] = (acc[g.level] ?? 0) + 1;
    return acc;
  }, {});

  const activeGrants = grants.filter((g) => g.status === "active").length;

  // Configuration health. These are the settings that silently break the
  // site in production, so surface them where they'll actually be seen.
  const onVercel = Boolean(process.env.VERCEL);
  const checks: Array<{ label: string; ok: boolean; detail: string }> = [
    {
      label: "Lead email notifications",
      ok: Boolean(process.env.RESEND_API_KEY),
      detail: process.env.RESEND_API_KEY
        ? `Sending to ${process.env.LEAD_NOTIFY_TO ?? "the address in lib/config.ts"}.`
        : "RESEND_API_KEY is not set. New leads are NOT emailed to you.",
    },
    {
      label: "Lead storage",
      ok: leadsAreDurable,
      detail:
        leadBackend === "postgres"
          ? "Postgres. Leads survive redeploys."
          : onVercel
            ? "SQLite in ephemeral storage on Vercel: rows are lost on redeploy or when the instance recycles. Set POSTGRES_URL to store leads durably; email is the only durable record until then."
            : "Local SQLite file at data/homekey.db.",
    },
    {
      label: `Curator LLM (${activeProvider})`,
      ok: llmConfigured(),
      detail: llmConfigured()
        ? "Credentials present; the weekly source re-check can run."
        : "No API key for the active provider. The weekly Curator cannot run, so the \"updated within 7 days\" claim does not hold.",
    },
    {
      label: "Demo data",
      ok: process.env.DEMO_MODE === "false",
      detail:
        process.env.DEMO_MODE === "false"
          ? "Disabled. Leads below are real."
          : "DEMO_MODE is not \"false\", so sample leads and Curator entries are seeded on a cold start.",
    },
  ];
  const failing = checks.filter((c) => !c.ok).length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Admin</h1>
      <p className="mt-2 text-zinc-600">
        Database state + pending Curator agent proposals + recent leads.
      </p>

      {/* Configuration health */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Configuration
          {failing > 0 && (
            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium normal-case tracking-normal text-red-800">
              {failing} need{failing === 1 ? "s" : ""} attention
            </span>
          )}
        </h2>
        <div className="mt-3 divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {checks.map((c) => (
            <div key={c.label} className="flex items-start gap-3 p-4">
              <span
                aria-hidden
                className={`mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs font-bold ${
                  c.ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}
              >
                {c.ok ? "\u2713" : "!"}
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {c.label}
                  <span className="sr-only">: {c.ok ? "OK" : "needs attention"}</span>
                </p>
                <p className="mt-0.5 text-sm text-zinc-600">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total grants" value={grants.length.toString()} />
        <Stat label="Active" value={activeGrants.toString()} />
        <Stat label="Pending diffs" value={pendingProposals.length.toString()} />
        <Stat label="Recent leads" value={leads.length.toString()} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-xs text-zinc-500">
        {Object.entries(grantsByLevel).map(([k, v]) => (
          <span key={k} className="rounded-full bg-zinc-100 px-3 py-1">
            {k}: {v}
          </span>
        ))}
      </div>

      {/* Curator proposals */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-zinc-900">
          Curator agent — pending proposals
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Changes detected by the weekly watsonx Orchestrate scrape. Approve or reject manually.
        </p>
        <div className="mt-4 space-y-3">
          {pendingProposals.length === 0 && (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
              No pending proposals. The Curator runs weekly — next scheduled scrape will repopulate this list.
            </div>
          )}
          {pendingProposals.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    p.changeType === "new"
                      ? "bg-emerald-100 text-emerald-800"
                      : p.changeType === "modified"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {p.changeType}
                </span>
                {p.grantId && (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-700">
                    {p.grantId}
                  </span>
                )}
                <span className="text-zinc-400">{p.runAt}</span>
              </div>
              <p className="mt-2 truncate text-sm text-zinc-600">
                Source: <a href={p.source} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700">{p.source}</a>
              </p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700">
                {JSON.stringify(p.diff, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </section>

      {/* Recent leads */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-zinc-900">Recent leads</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Buyers who submitted their email. Realtor-flag means they want a callback.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Wants realtor</th>
                <th className="px-4 py-3"># matches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                    No leads yet.
                  </td>
                </tr>
              )}
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 text-zinc-500">{l.createdAt}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{l.firstName} {l.lastName}</td>
                  <td className="px-4 py-3 text-zinc-700">{l.email}</td>
                  <td className="px-4 py-3 text-zinc-700">{l.phone}</td>
                  <td className="px-4 py-3">{l.state ?? "—"}</td>
                  <td className="px-4 py-3">
                    {l.wantsRealtor ? (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        Yes — follow up
                      </span>
                    ) : (
                      <span className="text-zinc-400">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{l.matchedGrantIds.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <p className="text-2xl font-semibold text-zinc-900">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{label}</p>
    </div>
  );
}
