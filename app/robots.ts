import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/onboarding", "/results", "/grant/", "/apply/", "/privacy", "/terms"],
        disallow: ["/admin", "/api/", "/apply/*/direct"],
      },
    ],
    sitemap: `${BRAND.siteUrl}/sitemap.xml`,
    host: BRAND.siteUrl,
  };
}
