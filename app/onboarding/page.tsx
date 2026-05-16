"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = 5;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setSubmitting(true);
    // Encode criteria into URL — results page reads from query for shareability.
    const params = new URLSearchParams();
    Object.entries(form).forEach(([k, v]) => params.set(k, String(v)));
    router.push(`/results?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>
            Step {step + 1} of {totalSteps}
          </span>
          <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-3xl bg-white p-8 ring-1 ring-zinc-200">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Household size">
                <input
                  type="number"
                  min={1}
                  max={15}
                  className="input"
                  value={form.householdSize}
                  onChange={(e) => update("householdSize", Number(e.target.value))}
                />
              </Field>
              <Field label="Annual household income">
                <input
                  type="number"
                  min={0}
                  step={1000}
                  className="input"
                  value={form.annualIncome}
                  onChange={(e) => update("annualIncome", Number(e.target.value))}
                />
              </Field>
              <Field label="Target purchase price">
                <input
                  type="number"
                  min={0}
                  step={5000}
                  className="input"
                  value={form.targetPurchasePrice}
                  onChange={(e) => update("targetPurchasePrice", Number(e.target.value))}
                />
              </Field>
              <Field label="Credit score (approx.)">
                <input
                  type="number"
                  min={300}
                  max={850}
                  className="input"
                  value={form.creditScore}
                  onChange={(e) => update("creditScore", Number(e.target.value))}
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

        {step === 4 && (
          <StepShell title="Ready to see your matches" subtitle="Review your profile, then we'll match you to grants in seconds.">
            <dl className="grid grid-cols-1 gap-3 rounded-2xl bg-zinc-50 p-5 text-sm sm:grid-cols-2">
              <Item k="Location" v={`${form.city ? form.city + ", " : ""}${form.state}`} />
              <Item k="Household size" v={form.householdSize.toString()} />
              <Item k="Annual income" v={`$${form.annualIncome.toLocaleString()}`} />
              <Item k="Target price" v={`$${form.targetPurchasePrice.toLocaleString()}`} />
              <Item k="Credit score" v={form.creditScore.toString()} />
              <Item k="First-time buyer" v={form.firstTimeBuyer ? "Yes" : "No"} />
              <Item k="Veteran" v={form.veteran ? "Yes" : "No"} />
              <Item k="Profession" v={form.profession || "—"} />
            </dl>
          </StepShell>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="text-sm text-zinc-500 hover:text-zinc-900 disabled:opacity-30"
          >
            ← Back
          </button>
          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="rounded-full bg-gradient-to-r from-indigo-600 to-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:from-indigo-700 hover:to-emerald-700 disabled:opacity-60"
            >
              {submitting ? "Matching..." : "Show my grants →"}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .input {
          display: block;
          width: 100%;
          border-radius: 0.75rem;
          background: white;
          padding: 0.625rem 0.875rem;
          font-size: 0.95rem;
          color: #18181b;
          box-shadow: inset 0 0 0 1px #e4e4e7;
        }
        .input:focus {
          outline: 2px solid #6366f1;
          outline-offset: 1px;
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
      <h2 className="text-2xl font-semibold text-zinc-900">{title}</h2>
      <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</span>
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
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
        checked
          ? "border-indigo-300 bg-indigo-50 text-indigo-900"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
      }`}
    >
      <input
        type={type}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-indigo-600"
      />
      {label}
    </label>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{k}</dt>
      <dd className="mt-0.5 font-medium text-zinc-900">{v}</dd>
    </div>
  );
}
