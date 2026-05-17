import type { MetadataRoute } from "next";
import { listActiveGrants } from "@/lib/matcher";

const BASE = "https://homekey-psi.vercel.app";

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
