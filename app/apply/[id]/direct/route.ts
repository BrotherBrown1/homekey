// Direct passthrough to the agency's application URL — only used when
// the buyer explicitly opts to skip the realtor-assisted path. Validates
// the upstream URL and falls back to a Lucky-style search if it's dead.

import { NextRequest } from "next/server";
import { getGrantById } from "@/lib/matcher";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 4000;
const DEAD_PAGE_MARKERS = [
  "page not found",
  "404 error",
  "page can't be found",
  "page cannot be found",
  "no longer available",
  "no longer exists",
  "this page is unavailable",
  "we couldn't find",
  "error 404",
  "404 not found",
];

async function isAlive(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; Nova-LinkCheck/1.0; +https://homekey-psi.vercel.app)",
        accept: "text/html",
      },
    });
    clearTimeout(timer);
    if (res.status >= 400) return false;
    const reader = res.body?.getReader();
    if (!reader) return true;
    let text = "";
    let bytes = 0;
    const dec = new TextDecoder();
    while (bytes < 16_000) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      text += dec.decode(value, { stream: true });
    }
    reader.cancel().catch(() => {});
    const lower = text.toLowerCase();
    return !DEAD_PAGE_MARKERS.some((m) => lower.includes(m));
  } catch {
    return false;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const grant = await getGrantById(id);
  if (!grant) return Response.redirect("https://homekey-psi.vercel.app", 302);

  if (await isAlive(grant.applicationUrl)) {
    return Response.redirect(grant.applicationUrl, 302);
  }
  const q = `${grant.name} ${grant.sponsor}${grant.state ? " " + grant.state : ""} apply official`;
  return Response.redirect(
    `https://duckduckgo.com/?q=${encodeURIComponent(`!ducky ${q}`)}`,
    302
  );
}
