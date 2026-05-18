/**
 * LLM provider switch.
 *
 * Single entry point all matcher / validator code uses. Picks between
 * Anthropic (default — Claude Opus 4.7) and IBM watsonx.ai (Granite) based
 * on the LLM_PROVIDER env var.
 *
 *   LLM_PROVIDER=anthropic   → Claude (default if ANTHROPIC_API_KEY is set)
 *   LLM_PROVIDER=watsonx     → IBM Granite (used during hackathon demo)
 *
 * If LLM_PROVIDER is unset, we use Anthropic when its key is configured,
 * otherwise fall back to watsonx.
 */

import * as anthropic from "./anthropic";
import * as watsonx from "./watsonx";

export type Provider = "anthropic" | "watsonx";

function resolveProvider(): Provider {
  const flag = (process.env.LLM_PROVIDER ?? "").toLowerCase();
  if (flag === "anthropic" || flag === "claude") return "anthropic";
  if (flag === "watsonx" || flag === "ibm" || flag === "granite") return "watsonx";
  // Auto: prefer Anthropic when its key is set; otherwise watsonx.
  if (anthropic.isConfigured()) return "anthropic";
  return "watsonx";
}

export const activeProvider: Provider = resolveProvider();

export type ChatMessage = anthropic.ChatMessage; // identical shape across providers
export type ChatOptions = anthropic.ChatOptions;

export async function chat(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  if (activeProvider === "anthropic") return anthropic.chat(messages, options);
  return watsonx.chat(messages, options);
}

export async function chatJson<T = unknown>(
  messages: ChatMessage[],
  options: Omit<ChatOptions, "jsonMode"> = {}
): Promise<T> {
  if (activeProvider === "anthropic") return anthropic.chatJson<T>(messages, options);
  return watsonx.chatJson<T>(messages, options);
}

export function isConfigured(): boolean {
  if (activeProvider === "anthropic") return anthropic.isConfigured();
  return watsonx.isConfigured();
}
