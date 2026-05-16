import { NextRequest } from "next/server";
import { getGrantById } from "@/lib/matcher";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 4000;

// State HFA sites often return 200 OK even on missing pages. Sniff the
// body for telltale "this page is gone" language.
const DEAD_PAGE_MARKERS = [
  "page not found",
  "404 error",
  "page can't be found",
  "page cannot be found",
  "page you are looking for",
  "page you requested",
  "no longer available",
  "no longer exists",
  "this page is unavailable",
  "we couldn't find",
  "doesn't exist",
  "error 404",
  "404 not found",
];

async function checkUrl(url: string): Promise<"alive" | "dead"> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; HomeKey-LinkCheck/1.0; +https://homekey-psi.vercel.app)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timer);
    if (res.status >= 400) return "dead";

    // Read up to 16KB and inspect for "not found" markers.
    const reader = res.body?.getReader();
    if (!reader) return "alive";

    let text = "";
    let bytes = 0;
    const decoder = new TextDecoder();
    while (bytes < 16_000) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      text += decoder.decode(value, { stream: true });
    }
    reader.cancel().catch(() => {});

    const lower = text.toLowerCase();
    if (DEAD_PAGE_MARKERS.some((m) => lower.includes(m))) return "dead";
    return "alive";
  } catch {
    return "dead";
  }
}

function searchUrl(name: string, sponsor: string, state: string | null): string {
  const stateName = state ? ` ${state}` : "";
  const q = `${name} ${sponsor}${stateName} apply official`;
  // DuckDuckGo's "!ducky" bang auto-redirects to the top Google result —
  // so the buyer lands directly on the current program page instead of
  // a search-result list.
  return `https://duckduckgo.com/?q=${encodeURIComponent(`!ducky ${q}`)}`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const grant = await getGrantById(id);
  if (!grant) {
    return Response.redirect("https://homekey-psi.vercel.app", 302);
  }

  const status = await checkUrl(grant.applicationUrl);
  if (status === "alive") {
    return Response.redirect(grant.applicationUrl, 302);
  }
  return Response.redirect(searchUrl(grant.name, grant.sponsor, grant.state), 302);
}
