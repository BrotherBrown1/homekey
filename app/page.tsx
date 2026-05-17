import Link from "next/link";
import { BRAND } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="-mt-px">
      <FullBleed
        bg="bg-white"
        text="text-zinc-950"
        align="end"
        bgVisual={
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-white via-white to-zinc-50" />
          </div>
        }
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-2 w-2 rounded-full bg-[#30d158] shadow-[0_0_0_4px_rgba(48,209,88,0.15)]" />
          <Eyebrow>Live · 82 programs · all 50 states</Eyebrow>
        </div>
        <Headline>
          Find the grants that unlock
          <br className="hidden sm:block" /> your first home.
        </Headline>
        <Subline>
          Every federal, state, county, and city program you qualify for.
          Free. Three minutes.
        </Subline>
        <CtaPair
          primary={{ href: "/onboarding", label: "Find my grants" }}
          secondary={{ href: "#how", label: "Learn how" }}
        />
      </FullBleed>

      <FullBleed bg="bg-zinc-950" text="text-white" align="end">
        <Eyebrow tone="dark">The opportunity</Eyebrow>
        <Headline>
          $18,400.
          <br />
          On average, in your name.
        </Headline>
        <Subline tone="dark">
          That's what the average first-time buyer qualifies for in stackable
          down-payment and closing-cost grants and never claims. Because no one
          told them. {BRAND.name} does.
        </Subline>
        <CtaPair
          tone="dark"
          primary={{ href: "/onboarding", label: "See yours" }}
          secondary={{ href: "#how", label: "How we know" }}
        />
      </FullBleed>

      <FullBleed id="how" bg="bg-white" text="text-zinc-950" align="end">
        <Eyebrow>How it works</Eyebrow>
        <Headline>
          Three minutes.
          <br />
          Every grant you qualify for.
        </Headline>
        <div className="mt-12 grid w-full max-w-5xl grid-cols-1 gap-px overflow-hidden rounded-3xl bg-zinc-200 sm:grid-cols-3">
          <Step
            n="01"
            title="Tell us about you"
            body="Where you want to buy, household income, profession. We only ask what we need."
          />
          <Step
            n="02"
            title="Match instantly"
            body="Your profile runs against every active grant. You see the ones you qualify for, with dollar amounts and reasoning."
          />
          <Step
            n="03"
            title="Apply with help"
            body={`One click. A free ${BRAND.name} grant specialist walks you through eligibility and the application.`}
          />
        </div>
        <div className="mt-12">
          <CtaPair
            primary={{ href: "/onboarding", label: "Find my grants" }}
            secondary={{ href: "#freshness", label: "How current is the data?" }}
          />
        </div>
      </FullBleed>

      <FullBleed id="freshness" bg="bg-zinc-950" text="text-white" align="end">
        <Eyebrow tone="dark">Always current</Eyebrow>
        <Headline>
          Grants change quarterly.
          <br />
          {BRAND.name} watches every one.
        </Headline>
        <Subline tone="dark">
          Funding windows open and close. Eligibility rules shift. Programs
          launch, pause, and disappear. {BRAND.name} updates within a week of
          any change — so what you see is what you can actually claim.
        </Subline>
        <FreshnessStats />
        <div className="mt-12">
          <CtaPair
            tone="dark"
            primary={{ href: "/onboarding", label: "Get started" }}
            secondary={{ href: "#community", label: "About this project" }}
          />
        </div>
      </FullBleed>

      <FullBleed id="community" bg="bg-white" text="text-zinc-950" align="end">
        <Eyebrow>A community resource</Eyebrow>
        <Headline>
          Free for buyers.
          <br />
          Always.
        </Headline>
        <Subline>
          {BRAND.name} doesn&apos;t charge buyers. No fees, no credit pull, no
          data sold. It exists so the money governments set aside for
          first-time home buyers actually reaches them.
        </Subline>
        <CtaPair
          primary={{ href: "/onboarding", label: "Find my grants" }}
          secondary={{ href: `mailto:${BRAND.realtor.email}`, label: "Contact" }}
        />
      </FullBleed>
    </div>
  );
}

function FullBleed({
  id,
  bg,
  text,
  align = "center",
  bgVisual,
  children,
}: {
  id?: string;
  bg: string;
  text: string;
  align?: "center" | "end";
  bgVisual?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`relative flex min-h-[88vh] w-full overflow-hidden ${bg} ${text}`}
    >
      {bgVisual}
      <div
        className={`relative z-10 mx-auto flex w-full max-w-5xl flex-col px-6 ${
          align === "end" ? "justify-end pb-20 pt-32" : "justify-center py-24"
        } sm:px-10`}
      >
        {children}
      </div>
    </section>
  );
}

function Eyebrow({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <p
      className={`text-xs font-medium uppercase tracking-[0.18em] ${
        tone === "dark" ? "text-zinc-400" : "text-zinc-500"
      }`}
    >
      {children}
    </p>
  );
}

function Headline({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-4 text-5xl font-semibold leading-[1.03] tracking-[-0.025em] sm:text-7xl lg:text-[88px]">
      {children}
    </h2>
  );
}

function Subline({
  children,
  tone = "light",
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <p
      className={`mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl ${
        tone === "dark" ? "text-zinc-300" : "text-zinc-600"
      }`}
    >
      {children}
    </p>
  );
}

function CtaPair({
  primary,
  secondary,
  tone = "light",
}: {
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
  tone?: "light" | "dark";
}) {
  // Tesla-style: primary is always the saturated blue you want clicked;
  // secondary is the lower-contrast neutral.
  const primaryCls =
    "bg-[#3457dc] text-white hover:bg-[#2742b0]";
  const secondaryCls =
    tone === "dark"
      ? "bg-white/10 text-white ring-1 ring-inset ring-white/20 backdrop-blur hover:bg-white/15"
      : "bg-white text-zinc-950 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50";
  return (
    <div className="mt-10 flex flex-col gap-3 sm:flex-row">
      <Link
        href={primary.href}
        className={`inline-flex min-w-[200px] items-center justify-center rounded-full px-8 py-3.5 text-sm font-medium uppercase tracking-[0.08em] transition ${primaryCls}`}
      >
        {primary.label}
      </Link>
      <Link
        href={secondary.href}
        className={`inline-flex min-w-[200px] items-center justify-center rounded-full px-8 py-3.5 text-sm font-medium uppercase tracking-[0.08em] transition ${secondaryCls}`}
      >
        {secondary.label}
      </Link>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="bg-white p-8">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
        {n}
      </p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
        {title}
      </h3>
      <p className="mt-3 text-base leading-relaxed text-zinc-600">{body}</p>
    </div>
  );
}

function FreshnessStats() {
  const items: Array<[string, string]> = [
    ["12", "Federal programs"],
    ["51+", "States covered"],
    ["19+", "City & county programs"],
    ["7 days", "Max data age"],
  ];
  return (
    <div className="mt-12 grid w-full max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-4">
      {items.map(([v, l]) => (
        <div key={l} className="bg-zinc-950 p-6">
          <p className="text-3xl font-semibold tracking-tight sm:text-4xl">{v}</p>
          <p className="mt-2 text-sm text-zinc-400">{l}</p>
        </div>
      ))}
    </div>
  );
}
