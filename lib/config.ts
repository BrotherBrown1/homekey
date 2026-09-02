// Single source of truth for brand + contact info.
// Rename here to rebrand the entire app.
export const BRAND = {
  name: "PocketGrants",
  siteUrl: "https://www.mypocketgrants.com",
  tagline: "Find the grants that unlock your first home",
  description:
    "Free grant-matching for first-time home buyers. Federal, state, county, and city programs — updated weekly so the money you qualify for never slips through.",
  realtor: {
    name: "Christian Brown",
    email: "myrealtorbrown@gmail.com",
    market: "Michigan (Oakland, Macomb, Wayne)",
    brokerage: "Oak and Stone Real Estate",
    licenseState: "Michigan",
    licenseNumber: "442316",
  },
  legal: {
    // Shown in the footer and on /terms. Governing law for the terms.
    governingState: "Michigan",
    lastUpdated: "September 2, 2026",
  },
} as const;
