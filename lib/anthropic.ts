/**
 * Anthropic Claude client.
 *
 * Mirrors the chat / chatJson / isConfigured interface of lib/watsonx.ts so
 * we can swap providers via lib/llm.ts without changing callers.
 *
 * Env vars (set in .env.local + Vercel):
 *   ANTHROPIC_API_KEY     - your Anthropic API key (console.anthropic.com)
 *   ANTHROPIC_MODEL       - optional; defaults to claude-opus-5
 *
 * Current-model API rules this file follows:
 *   - No `temperature`: Claude Opus 4.7 and later reject sampling
 *     parameters with a 400, so the option is accepted for interface
 *     compatibility with watsonx and deliberately not sent.
 *   - Thinking is adaptive by default and counts toward `max_tokens`, so
 *     the default ceiling is generous; control depth with `effort`.
 *   - Server-side fallbacks are enabled: if the model declines a request on
 *     policy grounds, the API re-runs it on a fallback model in the same
 *     call instead of returning nothing.
 */

import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";

let cached: Anthropic | null = null;

function client(): Anthropic {
  if (!ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local and Vercel env."
    );
  }
  if (!cached) {
    cached = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
  return cached;
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatOptions = {
  /** Accepted for watsonx compatibility; not sent to Claude (see header). */
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  model?: string;
  /** Thinking depth / token spend. Omit for the model default. */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  /** Per-request timeout in milliseconds. */
  timeoutMs?: number;
};

export async function chat(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  // Anthropic's messages API takes a `system` separately from user/assistant
  // turns, so split them apart.
  const systemParts = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content);
  const turns = messages
    .filter((m): m is { role: "user" | "assistant"; content: string } =>
      m.role === "user" || m.role === "assistant"
    )
    .map((m) => ({ role: m.role, content: m.content }));

  if (options.jsonMode) {
    systemParts.push(
      "Respond with a single valid JSON object only. No prose, no markdown fences, no commentary before or after."
    );
  }

  const resp = await client().beta.messages.create(
    {
      model: options.model ?? ANTHROPIC_MODEL,
      max_tokens: options.maxTokens ?? 16000,
      system: systemParts.length ? systemParts.join("\n\n") : undefined,
      messages: turns,
      ...(options.effort ? { output_config: { effort: options.effort } } : {}),
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    },
    options.timeoutMs ? { timeout: options.timeoutMs } : undefined
  );

  // Check why generation stopped before trusting the content.
  if (resp.stop_reason === "refusal") {
    const why = resp.stop_details?.explanation ?? resp.stop_details?.category ?? "no detail";
    throw new Error(`Claude declined the request (${why}).`);
  }

  const text = resp.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  if (!text) {
    throw new Error(
      resp.stop_reason === "max_tokens"
        ? "Claude hit max_tokens before producing an answer; raise maxTokens or lower effort."
        : `Claude returned no text (stop_reason: ${resp.stop_reason}).`
    );
  }
  return text;
}

export async function chatJson<T = unknown>(
  messages: ChatMessage[],
  options: Omit<ChatOptions, "jsonMode"> = {}
): Promise<T> {
  const raw = await chat(messages, { ...options, jsonMode: true });
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

export function isConfigured(): boolean {
  return Boolean(ANTHROPIC_API_KEY);
}

export const ANTHROPIC_MODEL_IN_USE = ANTHROPIC_MODEL;
