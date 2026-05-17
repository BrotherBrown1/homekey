import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { BRAND } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://homekey-psi.vercel.app";

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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
        />
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span
                aria-hidden
                className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 text-white"
              >
                🔑
              </span>
              <span className="text-lg">{BRAND.name}</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm text-zinc-600">
              <Link href="/onboarding" className="hover:text-zinc-900">
                Find my grants
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 bg-zinc-50 px-6 py-10 text-sm text-zinc-600">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 font-semibold text-zinc-900">
                <span
                  aria-hidden
                  className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-indigo-500 to-emerald-500 text-white text-sm"
                >
                  🔑
                </span>
                {BRAND.name}
              </div>
              <p className="mt-3 text-zinc-500">{BRAND.description}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                A community resource
              </p>
              <p className="mt-2 text-zinc-500">
                {BRAND.name} is a free grant-discovery and application-help service
                for first-time home buyers. We help you find and apply for every federal,
                state, county, and city grant you qualify for. No loans, no credit pull,
                no fees, ever.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Founder
              </p>
              <p className="mt-2 font-medium text-zinc-900">{BRAND.realtor.name}</p>
              <p className="text-zinc-500">First-time-buyer grant specialist</p>
              <p className="text-zinc-500">Based in {BRAND.realtor.market}</p>
              <p className="mt-3">
                <a
                  href={`mailto:${BRAND.realtor.email}`}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  {BRAND.realtor.email}
                </a>
              </p>
            </div>
          </div>
          <div className="mx-auto mt-8 max-w-6xl border-t border-zinc-200 pt-6 text-xs text-zinc-400">
            © {new Date().getFullYear()} {BRAND.name}. Information shown is for guidance only — confirm eligibility with the official program administrator before applying.
          </div>
        </footer>
      </body>
    </html>
  );
}
