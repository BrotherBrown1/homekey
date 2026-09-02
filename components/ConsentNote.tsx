import Link from "next/link";

// One-line consent disclosure shown directly under every lead-capture
// submit button. Keep the wording in one place so all forms stay in sync.

export function ConsentNote({ tone = "dark" }: { tone?: "light" | "dark" }) {
  const text = tone === "dark" ? "text-zinc-400" : "text-zinc-500";
  const link =
    tone === "dark"
      ? "text-zinc-300 underline underline-offset-4 hover:text-white"
      : "text-zinc-700 underline underline-offset-4 hover:text-zinc-950";
  return (
    <p className={`mt-4 max-w-xl text-xs leading-relaxed ${text}`}>
      By continuing you agree to our{" "}
      <Link href="/terms" className={link}>
        Terms
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className={link}>
        Privacy Policy
      </Link>
      , and consent to be contacted by phone, text, or email about your matches.
      Consent is not a condition of purchase. Reply STOP to opt out of texts.
    </p>
  );
}
