/**
 * Anthropic Claude client.
 *
 * Mirrors the chat / chatJson / isConfigured interface of lib/watsonx.ts so
 * we can swap providers via lib/llm.ts without changing callers.
 *
 * Env vars (set in .env.local + Vercel):
 *   ANTHROPIC_API_KEY     - your Anthropic API key (console.anthropic.com)
 *   ANTHROPIC_MODEL       - optional; defaults to claude-opus-4-7 (the highest)
 */

import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";

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
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  model?: string;
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

  // For JSON mode we strengthen the system prompt — Claude doesn't have a
  // dedicated response_format flag, but it follows format instructions well.
  if (options.jsonMode) {
    systemParts.push(
      "Respond with a single valid JSON object only. No prose, no markdown fences, no commentary before or after."
    );
  }

  const resp = await client().messages.create({
    model: options.model ?? ANTHROPIC_MODEL,
    max_tokens: options.maxTokens ?? 1500,
    temperature: options.temperature ?? 0.3,
    system: systemParts.length ? systemParts.join("\n\n") : undefined,
    messages: turns,
  });

  // Concatenate all text blocks from the response.
  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  if (!text) {
    throw new Error(`Anthropic returned no text content: ${JSON.stringify(resp)}`);
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
