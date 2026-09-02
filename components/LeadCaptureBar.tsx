"use client";

import { useState } from "react";
import type { BuyerCriteria } from "@/lib/schema";
import { ConsentNote } from "@/components/ConsentNote";

export function LeadCaptureBar({
  buyer,
  matchedIds,
}: {
  buyer: BuyerCriteria;
  matchedIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [wantsRealtor, setWantsRealtor] = useState(false);
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
          state: buyer.state,
          criteria: buyer,
          matchedGrantIds: matchedIds,
          wantsRealtor,
          wantsDigest: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("ok");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage("Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  if (status === "ok") {
    return (
      <div className="mt-10 border-y border-emerald-200 bg-emerald-50 px-6 py-5">
        <p className="text-sm font-medium text-emerald-900">✓ {message}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="mt-10 bg-zinc-950 px-6 py-6 text-white sm:px-10 sm:py-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-medium tracking-[-0.01em]">
              Want these matches in your inbox?
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              We'll alert you when new programs in your area launch.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-w-[180px] items-center justify-center rounded-full bg-[#3457dc] px-6 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white transition hover:bg-[#2742b0]"
          >
            Save my matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-10 bg-zinc-950 px-6 py-6 text-white sm:px-10 sm:py-8"
    >
      <p className="text-lg font-medium tracking-[-0.01em]">
        Save my matches & get the weekly digest
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          required
          type="text"
          autoComplete="given-name"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="border-0 border-b border-white/20 bg-transparent px-1 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
        />
        <input
          required
          type="text"
          autoComplete="family-name"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="border-0 border-b border-white/20 bg-transparent px-1 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
        />
        <input
          required
          type="email"
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-0 border-b border-white/20 bg-transparent px-1 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
        />
        <input
          required
          type="tel"
          autoComplete="tel"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border-0 border-b border-white/20 bg-transparent px-1 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-white focus:outline-none"
        />
      </div>
      <label className="mt-6 flex items-center gap-3 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={wantsRealtor}
          onChange={(e) => setWantsRealtor(e.target.checked)}
          style={{ accentColor: "#30d158" }}
          className="h-4 w-4"
        />
        Have a grant specialist contact me to help me apply
      </label>
      <div className="mt-6 flex items-center gap-5">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex min-w-[180px] items-center justify-center rounded-full bg-[#3457dc] px-6 py-3 text-xs font-medium uppercase tracking-[0.12em] text-white transition hover:bg-[#2742b0] disabled:opacity-60"
        >
          {status === "submitting" ? "Saving…" : "Save matches"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs uppercase tracking-[0.12em] text-zinc-400 hover:text-white"
        >
          Cancel
        </button>
        {status === "error" && <p className="text-sm text-red-400">{message}</p>}
      </div>
      <ConsentNote />
    </form>
  );
}
