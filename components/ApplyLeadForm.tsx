"use client";

import { useState } from "react";

export function ApplyLeadForm({
  grantId,
  grantName,
}: {
  grantId: string;
  grantName: string;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zip, setZip] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch("/api/skills/capture-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          zip: zip || undefined,
          criteria: { source: "apply-page", grantId, grantName },
          matchedGrantIds: [grantId],
          wantsRealtor: true,
          wantsDigest: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("ok");
        setMessage(
          `Got it. ${grantName} is locked in. A specialist will reach out within 24 hours at ${email} or ${phone}.`
        );
      } else {
        setStatus("error");
        setMessage("Couldn't save. Please double-check your info and try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network issue. Try once more.");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl bg-emerald-50 p-5 text-emerald-900 ring-1 ring-emerald-200">
        <p className="font-medium">✓ Got it — you're in the queue for {grantName}.</p>
        <p className="mt-2 text-sm text-emerald-800">
          A specialist will reach out within 24 hours at <strong>{email}</strong> or <strong>{phone}</strong>.
          They'll walk you through eligibility, answer questions, and coordinate with a participating
          lender who files this program alongside your mortgage paperwork. No application fee, no
          credit pull until you're ready.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          required
          type="text"
          autoComplete="given-name"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline focus:outline-2 focus:outline-indigo-400"
        />
        <input
          required
          type="text"
          autoComplete="family-name"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline focus:outline-2 focus:outline-indigo-400"
        />
        <input
          required
          type="email"
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline focus:outline-2 focus:outline-indigo-400"
        />
        <input
          required
          type="tel"
          autoComplete="tel"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline focus:outline-2 focus:outline-indigo-400"
        />
        <input
          type="text"
          autoComplete="postal-code"
          placeholder="ZIP (optional)"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline focus:outline-2 focus:outline-indigo-400 sm:col-span-2"
        />
      </div>
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:from-indigo-600 hover:to-emerald-600 disabled:opacity-60"
      >
        {status === "submitting" ? "Sending..." : "Get a specialist to help me apply →"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-400">{message}</p>
      )}
      <p className="text-xs text-zinc-400">
        We never sell your data. You can opt out anytime by replying STOP to any message.
      </p>
    </form>
  );
}
