// Google Sheets bridge.
//
// The sheet is the business's working record of leads and grant checks. It
// is written through a small Apps Script web app attached to the sheet
// (source: integrations/google-sheets/Code.gs), so there is no Google Cloud
// project, service account, or OAuth to manage — just one URL.
//
// GOOGLE_SHEETS_WEBHOOK_URL is the web app's /exec URL. Treat it as a
// secret: anyone holding it can append rows. It is only ever used
// server-side and never sent to the browser.

import type { SheetLeadRow } from "./lead-enrich";

const WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL ?? "";

export const sheetsConfigured = Boolean(WEBHOOK_URL);

export type ProgramCheckRow = {
  checkedAt: string;
  programId: string;
  program: string;
  where: string;
  result: "OK" | "Changed" | "Unreachable" | "Needs better link" | "Error" | "Skipped";
  details: string;
  confidence: string;
  sourceUrl: string;
};

type SheetPayload =
  | { type: "lead"; lead: SheetLeadRow }
  | { type: "program_checks"; checks: ProgramCheckRow[] };

export type SheetResult = { ok: true } | { ok: false; error: string };

export async function postToSheet(payload: SheetPayload, timeoutMs = 20_000): Promise<SheetResult> {
  if (!WEBHOOK_URL) return { ok: false, error: "not_configured" };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    // Apps Script answers a POST with a redirect to the script's output;
    // fetch follows it and returns the JSON the script wrote.
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: ctrl.signal,
    });
    const text = await res.text();
    let data: { ok?: boolean; error?: string } | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, error: `unexpected response (HTTP ${res.status}): ${text.slice(0, 200)}` };
    }
    return data?.ok ? { ok: true } : { ok: false, error: data?.error ?? `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(timer);
  }
}
