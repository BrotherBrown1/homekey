"use client";

import { useState } from "react";
import { ConsentNote } from "@/components/ConsentNote";

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
          `Got it — a grant specialist will reach out within 24 hours to start your ${grantName} application at ${email} or ${phone}.`
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
      <div className="border-y border-emerald-400/40 bg-emerald-500/10 px-6 py-6 text-emerald-100">
        <p className="text-lg font-medium tracking-[-0.01em] text-white">
          ✓ You&apos;re in. We&apos;ll start your {grantName} application.
        </p>
        <p className="mt-3 max-w-xl text-sm text-emerald-100/90">
          A grant specialist will reach out within 24 hours at{" "}
          <strong className="text-white">{email}</strong> or{" "}
          <strong className="text-white">{phone}</strong>. They&apos;ll confirm eligibility,
          gather what you need, and submit the official application with you. Free. No
          credit pull. No obligation.
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
          className="border-0 border-b border-white/20 bg-transparent px-1 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
        />
        <input
          required
          type="text"
          autoComplete="family-name"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="border-0 border-b border-white/20 bg-transparent px-1 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
        />
        <input
          required
          type="email"
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-0 border-b border-white/20 bg-transparent px-1 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
        />
        <input
          required
          type="tel"
          autoComplete="tel"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border-0 border-b border-white/20 bg-transparent px-1 py-2.5 text-base text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
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
        className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#30d158] px-6 py-4 text-xs font-medium uppercase tracking-[0.14em] text-white transition hover:bg-[#28b94d] disabled:opacity-60 sm:w-auto sm:min-w-[280px]"
      >
        {status === "submitting" ? "Sending…" : "Start my grant application →"}
      </button>
      {status === "error" && <p className="text-sm text-red-400">{message}</p>}
      <ConsentNote />
    </form>
  );
}
