// Lead-notification utility. Sends an email to the realtor every time a
// buyer submits the lead-capture form. Uses Resend (https://resend.com)
// because it works from Vercel's edge with no SDK and has a generous
// free tier (100 emails/day, no domain required).
//
// If RESEND_API_KEY is missing, the function logs and returns silently
// so the request still succeeds — we never want a failed notification
// to break the buyer's experience.

import { BRAND } from "./config";

export type LeadNotification = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state?: string | null;
  zip?: string | null;
  wantsRealtor: boolean;
  matchedGrantIds: string[];
  criteria: Record<string, unknown>;
};

function html(lead: LeadNotification) {
  const c = lead.criteria;
  const tag = (label: string, value: unknown) =>
    value == null || value === ""
      ? ""
      : `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px">${label}</td><td style="padding:6px 0;color:#111827;font-size:14px"><strong>${value}</strong></td></tr>`;

  return `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f9fafb;padding:24px;color:#111827">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:24px">
    <p style="margin:0 0 4px 0;font-size:12px;color:#6366f1;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">${BRAND.name} — new lead</p>
    <h1 style="margin:0 0 16px 0;font-size:22px">${lead.firstName} ${lead.lastName}</h1>
    <table style="border-collapse:collapse;width:100%;margin-bottom:16px">
      ${tag("Email", `<a href="mailto:${lead.email}" style="color:#4f46e5;text-decoration:none">${lead.email}</a>`)}
      ${tag("Phone", `<a href="tel:${lead.phone}" style="color:#4f46e5;text-decoration:none">${lead.phone}</a>`)}
      ${tag("State", lead.state ?? "—")}
      ${tag("Zip", lead.zip ?? "—")}
      ${tag("Wants realtor", lead.wantsRealtor ? "YES — call within 24h" : "No, just digest")}
      ${tag("Matched programs", lead.matchedGrantIds.length)}
    </table>
    <p style="margin:12px 0 6px 0;font-size:12px;color:#6b7280;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">Buyer profile</p>
    <table style="border-collapse:collapse;width:100%">
      ${tag("Household income", typeof c.annualIncome === "number" ? `$${c.annualIncome.toLocaleString()}` : c.annualIncome)}
      ${tag("Household size", c.householdSize)}
      ${tag("Target price", typeof c.targetPurchasePrice === "number" ? `$${c.targetPurchasePrice.toLocaleString()}` : c.targetPurchasePrice ?? "—")}
      ${tag("Credit score", c.creditScore ?? "—")}
      ${tag("First-time buyer", c.firstTimeBuyer ? "Yes" : "No")}
      ${tag("Veteran", c.veteran ? "Yes" : "No")}
      ${tag("Active military", c.activeMilitary ? "Yes" : "No")}
      ${tag("Profession", c.profession ?? "—")}
      ${tag("Owner-occupied", c.ownerOccupied ? "Yes" : "No")}
    </table>
  </div>
</body></html>`;
}

export async function notifyLead(lead: LeadNotification): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[notifyLead] RESEND_API_KEY not set — skipping email; lead persisted to DB only");
    return;
  }

  const from = process.env.LEAD_NOTIFY_FROM ?? "HomeKey <onboarding@resend.dev>";
  const to = process.env.LEAD_NOTIFY_TO ?? BRAND.realtor.email;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: lead.email,
        subject: `🏠 New ${BRAND.name} lead — ${lead.firstName} ${lead.lastName}${lead.wantsRealtor ? " (wants callback)" : ""}`,
        html: html(lead),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[notifyLead] Resend error", res.status, body);
    }
  } catch (err) {
    console.error("[notifyLead] fetch failed", err);
  }
}
