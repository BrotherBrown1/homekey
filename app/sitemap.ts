import type { MetadataRoute } from "next";
import { listActiveGrants } from "@/lib/matcher";
import { BRAND } from "@/lib/config";

const BASE = BRAND.siteUrl;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = new Date();
  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: today, changeFrequency: "weekly", priority: 1.0 },
    {
      url: `${BASE}/onboarding`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    { url: `${BASE}/privacy`, lastModified: today, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: today, changeFrequency: "yearly", priority: 0.3 },
  ];

  let grantUrls: MetadataRoute.Sitemap = [];
  try {
    const grants = await listActiveGrants();
    grantUrls = grants.flatMap((g) => [
      {
        url: `${BASE}/grant/${g.id}`,
        lastModified: g.updatedAt ? new Date(g.updatedAt) : today,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
      {
        url: `${BASE}/apply/${g.id}`,
        lastModified: g.updatedAt ? new Date(g.updatedAt) : today,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
    ]);
  } catch {
    // DB may not be seeded at build time; only static URLs in that case.
  }

  return [...staticUrls, ...grantUrls];
}
