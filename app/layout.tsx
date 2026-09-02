import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/config";
import "./globals.css";

const SITE_URL = BRAND.siteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND.name} — First-Time Home Buyer Grants for All 50 States`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Free first-time home buyer grant finder. Federal, state, county, and city down-payment and closing-cost assistance — updated weekly. See the grants you qualify for in 3 minutes.",
  keywords: [
    "first time home buyer grants",
    "down payment assistance",
    "closing cost assistance",
    "first time home buyer programs",
    "home buyer grant finder",
    "DPA grants",
    "MSHDA",
    "CalHFA",
    "FHA",
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: `${BRAND.name} — First-Time Home Buyer Grants for All 50 States`,
    description:
      "Free first-time home buyer grant finder. Federal, state, county, and city down-payment and closing-cost assistance — updated weekly.",
    siteName: BRAND.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — First-Time Home Buyer Grants for All 50 States`,
    description:
      "Free grant-matching for first-time home buyers. See every grant you qualify for in 3 minutes.",
  },
  robots: { index: true, follow: true },
};

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: BRAND.name,
  url: SITE_URL,
  description: BRAND.description,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/onboarding`,
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: BRAND.name,
    url: SITE_URL,
    description: "Free grant-matching service for first-time home buyers",
  },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What are first-time home buyer grants?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Grants are funds you don't pay back, given by federal, state, county, and city housing agencies to help first-time buyers cover down payment and closing costs. They're combined with a standard mortgage and can stack up to $30,000+ in some markets.",
      },
    },
    {
      "@type": "Question",
      name: `Is ${BRAND.name} free?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `Yes. ${BRAND.name} is a free public-service tool for first-time home buyers. We never charge buyers, never pull credit, and never sell your data.`,
      },
    },
    {
      "@type": "Question",
      name: "How current is the grant data?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `${BRAND.name} watches every housing authority in the country and updates the database within a week of any change — funding windows, eligibility shifts, new programs, or closed programs.`,
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-zinc-950">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
        />
        <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
            <Link
              href="/"
              aria-label={BRAND.name}
              style={{
                fontFamily:
                  '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
              }}
              className="text-[15px] font-semibold uppercase leading-none tracking-[0.2em] text-zinc-950 sm:text-[17px] sm:tracking-[0.34em]"
            >
              {BRAND.name.toUpperCase()}
            </Link>
            <nav className="flex items-center gap-7 text-xs uppercase tracking-[0.12em] text-zinc-600">
              <Link href="/onboarding" className="hidden hover:text-zinc-950 sm:inline">
                Find my grants
              </Link>
              <Link href="/#how" className="hidden hover:text-zinc-950 sm:inline">
                How it works
              </Link>
              <Link
                href="/onboarding"
                className="rounded-full bg-[#3457dc] px-5 py-2 text-xs uppercase tracking-[0.08em] text-white transition hover:bg-[#2742b0]"
              >
                Start
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-16 sm:grid-cols-3">
            <div>
              <p
                style={{
                  fontFamily:
                    '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
                }}
                className="text-[19px] font-semibold uppercase tracking-[0.2em] text-zinc-950 sm:tracking-[0.34em]"
              >
                {BRAND.name.toUpperCase()}
              </p>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-600">
                First-time home buyer grant finder. Federal, state, county, and
                city programs.
              </p>
            </div>
            <div className="text-sm">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Founder
              </p>
              <p className="mt-3 font-medium text-zinc-950">
                {BRAND.realtor.name}
              </p>
              <p className="mt-1 text-zinc-600">
                Licensed Real Estate Salesperson, {BRAND.realtor.licenseState}
              </p>
              <p className="text-zinc-600">
                License #{BRAND.realtor.licenseNumber} · {BRAND.realtor.brokerage}
              </p>
              <a
                href={`mailto:${BRAND.realtor.email}`}
                className="mt-2 inline-block text-zinc-950 underline-offset-4 hover:underline"
              >
                {BRAND.realtor.email}
              </a>
            </div>
            <div className="text-sm">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Legal
              </p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/privacy" className="text-zinc-950 underline-offset-4 hover:underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-zinc-950 underline-offset-4 hover:underline">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-200">
            <div className="mx-auto max-w-6xl space-y-3 px-6 py-6 text-xs leading-relaxed text-zinc-500">
              <p>
                {BRAND.name} is not a lender, government agency, or housing
                authority and is not affiliated with any program listed. Program
                information is provided for general guidance only and is not a
                commitment to lend, a determination of eligibility, or a
                guarantee of funding. Confirm all details with the official
                program administrator before applying.
              </p>
              <p>
                {BRAND.realtor.name} is a licensed real estate salesperson in{" "}
                {BRAND.realtor.licenseState} (License #{BRAND.realtor.licenseNumber})
                with {BRAND.realtor.brokerage}. Equal Housing Opportunity.
              </p>
              <p>
                © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
