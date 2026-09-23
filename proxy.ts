import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

// Locks /admin behind HTTP Basic auth. The admin page lists every lead —
// names, emails, phone numbers, household income — so it must never be
// reachable by anyone who simply knows the URL.
//
// Set ADMIN_PASSWORD (and optionally ADMIN_USER, default "admin") in the
// Vercel project's environment variables. If ADMIN_PASSWORD is unset the
// page is refused outright: failing closed is the only safe default for a
// page that exposes buyer PII.
//
// Note: this is the `proxy` file convention (Next renamed `middleware` to
// `proxy`); it runs on the Node.js runtime, so node:crypto is available.

const REALM = 'Basic realm="PocketGrants admin", charset="UTF-8"';

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  // timingSafeEqual throws on length mismatch, so compare lengths first and
  // still run the comparison to keep the timing profile flat.
  if (ab.length !== bb.length) {
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export function proxy(request: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return new NextResponse(
      "Admin is disabled because ADMIN_PASSWORD is not configured.",
      { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } }
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    let decoded = "";
    try {
      decoded = Buffer.from(encoded, "base64").toString("utf8");
    } catch {
      decoded = "";
    }
    const sep = decoded.indexOf(":");
    if (sep !== -1) {
      const user = decoded.slice(0, sep);
      const pass = decoded.slice(sep + 1);
      const expectedUser = process.env.ADMIN_USER ?? "admin";
      // Evaluate both so a wrong username costs the same time as a wrong password.
      const userOk = safeEqual(user, expectedUser);
      const passOk = safeEqual(pass, expected);
      if (userOk && passOk) return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": REALM,
      "content-type": "text/plain; charset=utf-8",
      // Never let a proxy or browser cache an admin response.
      "cache-control": "no-store",
    },
  });
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
