import { NextRequest } from "next/server";
import { getGrantById } from "@/lib/matcher";

export const dynamic = "force-dynamic";

const CHECK_TIMEOUT_MS = 2500;

async function urlIsAlive(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CHECK_TIMEOUT_MS);
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; HomeKey-Bot/1.0; +https://homekey-psi.vercel.app)",
      },
    });
    clearTimeout(timer);
    if (res.status >= 200 && res.status < 400) return true;
    if (res.status === 405) {
      const ctrl2 = new AbortController();
      const timer2 = setTimeout(() => ctrl2.abort(), CHECK_TIMEOUT_MS);
      const res2 = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: ctrl2.signal,
      });
      clearTimeout(timer2);
      return res2.status >= 200 && res2.status < 400;
    }
    return false;
  } catch {
    return false;
  }
}

function searchFallback(name: string, sponsor: string): string {
  const q = encodeURIComponent(`${name} ${sponsor} official application`);
  return `https://www.google.com/search?q=${q}`;
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

  const primary = grant.applicationUrl;
  if (await urlIsAlive(primary)) {
    return Response.redirect(primary, 302);
  }

  return Response.redirect(searchFallback(grant.name, grant.sponsor), 302);
}
