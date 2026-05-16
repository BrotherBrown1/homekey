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

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.description,
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
              <Link href="/admin" className="hover:text-zinc-900">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-200 bg-zinc-50 px-6 py-8 text-sm text-zinc-500">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <p>
              © {new Date().getFullYear()} {BRAND.name}. Built for the IBM watsonx hackathon.
            </p>
            <p>
              Realtor partner: {BRAND.realtor.name} · {BRAND.realtor.market}
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
