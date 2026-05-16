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
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
    siteName: BRAND.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.description,
  },
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
                Built and maintained by
              </p>
              <p className="mt-2 font-medium text-zinc-900">{BRAND.realtor.name}</p>
              <p className="text-zinc-500">Licensed Michigan Realtor</p>
              <p className="text-zinc-500">{BRAND.realtor.market}</p>
              <p className="mt-3">
                <a
                  href={`mailto:${BRAND.realtor.email}`}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  {BRAND.realtor.email}
                </a>
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Why this exists
              </p>
              <p className="mt-2 text-zinc-500">
                Every year, billions of dollars in down-payment-assistance and first-time-homebuyer grants go unclaimed.
                {BRAND.name} matches you with every program you qualify for in seconds — free, no credit pull.
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
