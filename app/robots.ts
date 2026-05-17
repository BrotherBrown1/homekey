import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/onboarding", "/results", "/grant/", "/apply/"],
        disallow: ["/admin", "/api/", "/apply/*/direct"],
      },
    ],
    sitemap: "https://homekey-psi.vercel.app/sitemap.xml",
    host: "https://homekey-psi.vercel.app",
  };
}
