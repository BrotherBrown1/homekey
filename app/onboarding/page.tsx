"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BuyerCriteria } from "@/lib/schema";
import { ConsentNote } from "@/components/ConsentNote";
import { BRAND } from "@/lib/config";

const REALTOR_FIRST_NAME = BRAND.realtor.name.split(" ")[0];

const US_STATES = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],
  ["CO","Colorado"],["CT","Connecticut"],["DC","Washington, D.C."],["DE","Delaware"],["FL","Florida"],
  ["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],
  ["IA","Iowa"],["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],
  ["MD","Maryland"],["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],
  ["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],
  ["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],["ND","North Dakota"],
  ["OH","Ohio"],["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],
  ["SC","South Carolina"],["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],
  ["VT","Vermont"],["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],
  ["WY","Wyoming"],
] as const;

const PROFESSIONS = [
  ["", "Not listed / prefer not to say"],
  ["teacher", "Teacher (K-12)"],
  ["police", "Police officer"],
  ["firefighter", "Firefighter"],
  ["ems", "EMT / Paramedic"],
  ["nurse", "Nurse / Healthcare worker"],
  ["corrections", "Corrections officer"],
  ["government_employee", "Government employee"],
] as const;

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  county: string;
  householdSize: number;
  annualIncome: number;
  targetPurchasePrice: number;
  creditScore: number;
  firstTimeBuyer: boolean;
  veteran: boolean;
  activeMilitary: boolean;
  profession: string;
  ownerOccupied: boolean;
};

const initial: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  state: "MI",
  city: "",
  county: "",
  householdSize: 1,
  annualIncome: 60000,
  targetPurchasePrice: 200000,
  creditScore: 680,
  firstTimeBuyer: true,
  veteran: false,
  activeMilitary: false,
  profession: "",
  ownerOccupied: true,
};

// Flow: qualification questions first (steps 0-3), then a teaser with the
// real number of programs the buyer matched, and only then the contact
// details that unlock the results. Contact info is POSTed to the lead API
// and never placed in the results URL.
const CONTACT_STEP = 4;
const TOTAL_STEPS = 5;

function toCriteria(form: FormState): BuyerCriteria {
  return {
    state: form.state,
    city: form.city.trim() || undefined,
    county: form.county.trim() || undefined,
    householdSize: form.householdSize,
    annualIncome: form.annualIncome,
    targetPurchasePrice: form.targetPurchasePrice || undefined,
    creditScore: form.creditScore || undefined,
    firstTimeBuyer: form.firstTimeBuyer,
    veteran: form.veteran,
    activeMilitary: form.activeMilitary,
    profession: form.profession || undefined,
    ownerOccupied: form.ownerOccupied,
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [wantsRealtor, setWantsRealtor] = useState(false);
  // Teaser shown on the contact step: how many programs the profile matched.
  const [preview, setPreview] = useState<{ count: number; ids: string[] } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const totalSteps = TOTAL_STEPS;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function contactValid(): boolean {
    if (!form.firstName.trim()) return false;
    if (!form.lastName.trim()) return false;
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return false;
    // Strip non-digits and require at least 10 digits (US-style).
    if (form.phone.replace(/\D/g, "").length < 10) return false;
    return true;
  }

  // Runs the real matcher (no AI, so it's instant) so the teaser number is
  // the same one the results page will show.
  async function loadPreview() {
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/skills/match-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...toCriteria(form), useAi: false, limit: 50 }),
      });
      const data = await res.json();
      if (data.success) {
        setPreview({
          count: data.count,
          ids: (data.matches as Array<{ id: string }>).map((m) => m.id),
        });
      }
    } catch (err) {
      // Teaser is a nice-to-have; the contact step still works without it.
      console.error("match preview failed", err);
    } finally {
      setPreviewLoading(false);
    }
  }

  function next() {
    const nextStep = step + 1;
    if (nextStep === CONTACT_STEP) {
      setPreview(null);
      loadPreview();
    }
    setStep(nextStep);
  }

  async function submit() {
    if (!contactValid()) {
      setContactError("Please fill in all four fields with a valid email and phone.");
      return;
    }
    setContactError(null);
    setSubmitting(true);

    const criteria = toCriteria(form);

    // Save the lead with the full profile + matches. A network blip must not
    // strand the buyer, so failures are logged and the funnel continues.
    try {
      await fetch("/api/skills/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          state: criteria.state,
          criteria,
          matchedGrantIds: preview?.ids ?? [],
          wantsRealtor,
          wantsDigest: true,
        }),
      });
    } catch (err) {
      console.error("capture-lead failed", err);
    }

    // Only matching criteria go in the URL — never name, email, or phone.
    const params = new URLSearchParams();
    Object.entries(criteria).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.set(k, String(v));
    });
    params.set("saved", "1");
    router.push(`/results?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
      <div className="mb-10">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500">
          <span>
            Step {step + 1} / {totalSteps}
          </span>
          <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="mt-3 h-px w-full bg-zinc-200">
          <div
            className="h-px bg-zinc-950 transition-all"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div>
        {step === 0 && (
          <StepShell title="Where are you buying?" subtitle="We'll match you to programs in your state, county, and city.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="State">
                <select
                  className="input"
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                >
                  {US_STATES.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="City (optional)">
                <input
                  className="input"
                  placeholder="e.g., Detroit"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                />
              </Field>
              <Field label="County (optional)">
                <input
                  className="input"
                  placeholder="e.g., Wayne"
                  value={form.county}
                  onChange={(e) => update("county", e.target.value)}
                />
              </Field>
            </div>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell title="Tell us about your household" subtitle="This determines income-based eligibility.">
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <Field label="Household size">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={15}
                  className="input"
                  value={form.householdSize || ""}
                  placeholder="e.g., 2"
                  onChange={(e) => {
                    const v = e.target.value;
                    update("householdSize", v === "" ? 0 : Number(v));
                  }}
                />
              </Field>
              <Field label="Annual household income">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  className="input"
                  value={form.annualIncome || ""}
                  placeholder="e.g., 60000"
                  onChange={(e) => {
                    const v = e.target.value;
                    update("annualIncome", v === "" ? 0 : Number(v));
                  }}
                />
              </Field>
              <Field label="Target purchase price">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={5000}
                  className="input"
                  value={form.targetPurchasePrice || ""}
                  placeholder="e.g., 200000"
                  onChange={(e) => {
                    const v = e.target.value;
                    update("targetPurchasePrice", v === "" ? 0 : Number(v));
                  }}
                />
              </Field>
              <Field label="Credit score (approx.)">
                <input
                  type="number"
                  inputMode="numeric"
                  min={300}
                  max={850}
                  className="input"
                  value={form.creditScore || ""}
                  placeholder="e.g., 680"
                  onChange={(e) => {
                    const v = e.target.value;
                    update("creditScore", v === "" ? 0 : Number(v));
                  }}
                />
              </Field>
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell title="Are you a first-time buyer?" subtitle="Most DPA programs target first-timers, but many work for repeat buyers too.">
            <div className="flex flex-col gap-3">
              <Choice
                checked={form.firstTimeBuyer}
                onChange={() => update("firstTimeBuyer", true)}
                label="Yes, this is my first home (or I haven't owned in 3+ years)"
              />
              <Choice
                checked={!form.firstTimeBuyer}
                onChange={() => update("firstTimeBuyer", false)}
                label="No, I've owned a home in the past 3 years"
              />
            </div>
            <div className="mt-6 border-t border-zinc-200 pt-6">
              <p className="text-sm font-medium text-zinc-900">Will you live in this home?</p>
              <div className="mt-3 flex flex-col gap-3">
                <Choice
                  checked={form.ownerOccupied}
                  onChange={() => update("ownerOccupied", true)}
                  label="Yes, as my primary residence"
                />
                <Choice
                  checked={!form.ownerOccupied}
                  onChange={() => update("ownerOccupied", false)}
                  label="No, it's an investment property"
                />
              </div>
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title="Military or specific profession?" subtitle="These unlock targeted programs with bigger benefits.">
            <div className="grid grid-cols-1 gap-3">
              <Choice
                checked={form.veteran}
                onChange={() => update("veteran", !form.veteran)}
                label="I'm a veteran"
                type="checkbox"
              />
              <Choice
                checked={form.activeMilitary}
                onChange={() => update("activeMilitary", !form.activeMilitary)}
                label="I'm currently active duty / Guard / Reserve"
                type="checkbox"
              />
            </div>
            <div className="mt-6 border-t border-zinc-200 pt-6">
              <Field label="Profession">
                <select
                  className="input"
                  value={form.profession}
                  onChange={(e) => update("profession", e.target.value)}
                >
                  {PROFESSIONS.map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </StepShell>
        )}

        {step === CONTACT_STEP && (
          <StepShell
            title={
              previewLoading
                ? "Checking programs…"
                : preview
                  ? `We found ${preview.count} program${preview.count === 1 ? "" : "s"} you may qualify for.`
                  : "Your matches are ready."
            }
            subtitle={`Tell us where to send them. Only ${REALTOR_FIRST_NAME} (your grant specialist) sees this.`}
          >
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <Field label="First name">
                <input
                  className="input"
                  autoComplete="given-name"
                  placeholder="Jane"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                />
              </Field>
              <Field label="Last name">
                <input
                  className="input"
                  autoComplete="family-name"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                />
              </Field>
              <Field label="Email address">
                <input
                  className="input"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </Field>
              <Field label="Phone number">
                <input
                  className="input"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="(555) 555-1212"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </Field>
            </div>
            <label className="mt-8 flex items-center gap-3 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={wantsRealtor}
                onChange={(e) => setWantsRealtor(e.target.checked)}
                style={{ accentColor: "#30d158" }}
                className="h-4 w-4"
              />
              Have a grant specialist contact me to help me apply
            </label>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 border-t border-zinc-200 pt-2 sm:grid-cols-4">
              <Item k="Location" v={`${form.city ? form.city + ", " : ""}${form.state}`} />
              <Item k="Income" v={`$${form.annualIncome.toLocaleString()}`} />
              <Item k="Target price" v={`$${form.targetPurchasePrice.toLocaleString()}`} />
              <Item k="First-time buyer" v={form.firstTimeBuyer ? "Yes" : "No"} />
            </dl>
            {contactError && (
              <p className="mt-4 text-sm text-red-600">{contactError}</p>
            )}
          </StepShell>
        )}

        <div className="mt-12 flex items-center justify-between gap-4 border-t border-zinc-200 pt-8">
          <button
            type="button"
            onClick={() => {
              if (step === 0) router.push("/");
              else setStep((s) => s - 1);
            }}
            className="text-xs uppercase tracking-[0.12em] text-zinc-500 hover:text-zinc-950"
          >
            ← Back
          </button>
          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex min-w-[180px] items-center justify-center rounded-full bg-[#3457dc] px-8 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white transition hover:bg-[#2742b0]"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex min-w-[200px] items-center justify-center rounded-full bg-[#3457dc] px-8 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white transition hover:bg-[#2742b0] disabled:opacity-60"
            >
              {submitting ? "Matching…" : "Show my grants"}
            </button>
          )}
        </div>
        {step === CONTACT_STEP && <ConsentNote tone="light" />}
      </div>

      <style>{`
        .input {
          display: block;
          width: 100%;
          border: 0;
          border-bottom: 1px solid #d4d4d8;
          background: transparent;
          padding: 0.5rem 0;
          font-size: 1.0625rem;
          color: #09090b;
          transition: border-color 0.15s ease;
        }
        .input:focus {
          outline: none;
          border-bottom-color: #09090b;
        }
      `}</style>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-4xl font-semibold leading-[1.05] tracking-[-0.025em] text-zinc-950 sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base text-zinc-600 sm:text-lg">{subtitle}</p>
      <div className="mt-10">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function Choice({
  checked,
  onChange,
  label,
  type = "radio",
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  type?: "radio" | "checkbox";
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 border-b px-1 py-4 text-base transition ${
        checked
          ? "border-zinc-950 text-zinc-950"
          : "border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-950"
      }`}
    >
      <input
        type={type}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-zinc-950"
      />
      <span className="flex-1">{label}</span>
    </label>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="border-b border-zinc-200 py-3">
      <dt className="text-xs uppercase tracking-[0.12em] text-zinc-500">{k}</dt>
      <dd className="mt-1 text-base font-medium text-zinc-950">{v}</dd>
    </div>
  );
}
