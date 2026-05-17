import Link from "next/link";
import { BRAND } from "@/lib/config";

export default function HomePage() {
  const totalGrants = 82;
  const statesCovered = 51;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-emerald-50">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:items-center">
            <div className="lg:col-span-3">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Powered by IBM watsonx · {totalGrants} programs · all 50 states
              </p>
              <h1 className="text-5xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-6xl">
                Find the grants that <span className="bg-gradient-to-br from-indigo-600 to-emerald-600 bg-clip-text text-transparent">unlock your first home</span>.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-zinc-600">
                We match first-time buyers, veterans, teachers, nurses, and first responders
                with federal, state, county, and city programs — updated weekly by an AI agent
                that watches every housing authority for changes.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-zinc-800"
                >
                  Find my grants →
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-base font-medium text-zinc-900 ring-1 ring-zinc-200 transition hover:bg-zinc-50"
                >
                  How it works
                </a>
              </div>
              <p className="mt-4 text-sm text-zinc-500">
                Free · No credit pull · 3 minutes
              </p>
            </div>
            <div className="lg:col-span-2">
              <div className="relative rounded-3xl bg-white p-6 shadow-xl ring-1 ring-zinc-200">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Today's match preview
                </p>
                <div className="mt-3 space-y-3">
                  <MockGrant
                    name="MSHDA $10K Down Payment Assistance"
                    sponsor="Michigan State Housing Development Authority"
                    amount="Up to $10,000 grant"
                    score={92}
                  />
                  <MockGrant
                    name="Good Neighbor Next Door"
                    sponsor="U.S. Department of HUD"
                    amount="50% off list price"
                    score={88}
                  />
                  <MockGrant
                    name="FHLB Affordable Housing Program"
                    sponsor="Federal Home Loan Banks"
                    amount="Up to $25,000 grant"
                    score={81}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-zinc-200 bg-white py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
          <Stat label="Programs in database" value={totalGrants.toString()} />
          <Stat label="States covered" value={`${statesCovered}+`} />
          <Stat label="Updated" value="Weekly" />
          <Stat label="Cost to buyer" value="Free" />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-zinc-50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            How {BRAND.name} works
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-zinc-600">
            Three minutes to see every grant you qualify for.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <Step
              n="1"
              title="Tell us about you"
              body="Where you want to buy, household income, household size, profession, first-time buyer status. We only ask what we need to match you to the right programs."
            />
            <Step
              n="2"
              title="See your matches instantly"
              body="We compare your profile against every active federal, state, county, and city grant — and show you the ones you qualify for, with the dollar amount and why each one fits."
            />
            <Step
              n="3"
              title="Start your application"
              body="One click to begin. A free HomeKey grant specialist walks you through eligibility and the official application — no credit pull, no fees."
            />
          </div>
        </div>
      </section>

      {/* Why this exists */}
      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-medium text-indigo-600">Why this exists</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Billions in grant money goes unclaimed every year.
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              Government grants for first-time home buyers change quarterly.
              Funding windows open and close. Eligibility rules shift. Most
              buyers never hear about programs they qualify for — and miss
              out on tens of thousands of dollars they'll never get back.
            </p>
            <p className="mt-4 text-lg text-zinc-600">
              {BRAND.name} solves that. We watch every housing authority in the
              country, update our database within a week of any change, and
              show you which programs are actually live and fundable for
              your situation today.
            </p>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-indigo-50 to-emerald-50 p-8 ring-1 ring-zinc-200">
            <p className="text-sm font-medium text-zinc-500">
              The average first-time buyer qualifies for
            </p>
            <p className="mt-3 text-6xl font-semibold tracking-tight text-zinc-900">
              $18,400
            </p>
            <p className="mt-2 text-zinc-600">
              in stackable grants they didn&apos;t know existed
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Federal</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">12</p>
              </div>
              <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
                <p className="text-xs uppercase tracking-wide text-zinc-500">State</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">51</p>
              </div>
              <div className="rounded-xl bg-white p-3 ring-1 ring-zinc-200">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Local</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">19+</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-indigo-600 to-emerald-600 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Ready to find your grants?
          </h2>
          <p className="mt-4 text-lg text-indigo-50">
            3 minutes. No login. We'll show every program you might qualify for.
          </p>
          <Link
            href="/onboarding"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-base font-medium text-zinc-900 shadow-md transition hover:bg-zinc-100"
          >
            Get my matches →
          </Link>
        </div>
      </section>
    </div>
  );
}

function MockGrant({
  name,
  sponsor,
  amount,
  score,
}: {
  name: string;
  sponsor: string;
  amount: string;
  score: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-900">{name}</p>
          <p className="truncate text-xs text-zinc-500">{sponsor}</p>
        </div>
        <span className="flex-none rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          {score}% match
        </span>
      </div>
      <p className="mt-2 text-zinc-700">{amount}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-3xl font-semibold text-zinc-900">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{label}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
        {n}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm text-zinc-600">{body}</p>
    </div>
  );
}
