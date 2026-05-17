"use client";

import { useState } from "react";
import type { BuyerCriteria } from "@/lib/schema";

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
      <div className="mt-6 rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
        <p className="font-medium text-emerald-900">✓ {message}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="mt-6 rounded-2xl bg-zinc-900 p-5 text-white">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Want these matches in your inbox?</p>
            <p className="text-sm text-zinc-300">
              We'll alert you when new programs in your area launch.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-full bg-white px-5 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
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
      className="mt-6 rounded-2xl bg-zinc-900 p-5 text-white"
    >
      <p className="font-medium">Save my matches + get the weekly digest</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          required
          type="text"
          autoComplete="given-name"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline focus:outline-2 focus:outline-indigo-400"
        />
        <input
          required
          type="text"
          autoComplete="family-name"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline focus:outline-2 focus:outline-indigo-400"
        />
        <input
          required
          type="email"
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline focus:outline-2 focus:outline-indigo-400"
        />
        <input
          required
          type="tel"
          autoComplete="tel"
          placeholder="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline focus:outline-2 focus:outline-indigo-400"
        />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-zinc-200">
        <input
          type="checkbox"
          checked={wantsRealtor}
          onChange={(e) => setWantsRealtor(e.target.checked)}
          className="accent-indigo-500"
        />
        Have a grant specialist contact me to help me apply
      </label>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 px-5 py-2 text-sm font-medium text-white hover:from-indigo-600 hover:to-emerald-600 disabled:opacity-60"
        >
          {status === "submitting" ? "Saving..." : "Save matches"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-zinc-400 hover:text-white"
        >
          Cancel
        </button>
        {status === "error" && <p className="text-sm text-red-400">{message}</p>}
      </div>
    </form>
  );
}
