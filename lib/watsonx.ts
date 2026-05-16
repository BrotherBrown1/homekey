/**
 * watsonx.ai client.
 *
 * Auth flow:
 *   1. Exchange IBM Cloud API key for an IAM access token (1hr TTL).
 *   2. Call watsonx.ai chat completions with Bearer access token + project ID.
 *
 * Env vars (set in .env.local):
 *   IBM_CLOUD_API_KEY        - your IBM Cloud IAM API key
 *   WATSONX_PROJECT_ID       - your watsonx.ai project ID
 *   WATSONX_REGION           - e.g. "us-south" (default), "eu-de", "us-east"
 *   WATSONX_MODEL_ID         - optional override; defaults to Granite 3 8B instruct
 */

const WATSONX_REGION = process.env.WATSONX_REGION ?? "us-south";
const WATSONX_PROJECT_ID = process.env.WATSONX_PROJECT_ID ?? "";
const WATSONX_API_KEY = process.env.IBM_CLOUD_API_KEY ?? "";
const WATSONX_MODEL = process.env.WATSONX_MODEL_ID ?? "ibm/granite-3-8b-instruct";

const WATSONX_HOST = `https://${WATSONX_REGION}.ml.cloud.ibm.com`;
const IAM_HOST = "https://iam.cloud.ibm.com";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (!WATSONX_API_KEY) {
    throw new Error(
      "IBM_CLOUD_API_KEY is not set. Add it to .env.local — see IBM_SETUP.md."
    );
  }
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const body = new URLSearchParams({
    grant_type: "urn:ibm:params:oauth:grant-type:apikey",
    apikey: WATSONX_API_KEY,
  });

  const res = await fetch(`${IAM_HOST}/identity/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`IAM token request failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
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
  if (!WATSONX_PROJECT_ID) {
    throw new Error(
      "WATSONX_PROJECT_ID is not set. Add it to .env.local — see IBM_SETUP.md."
    );
  }

  const token = await getAccessToken();
  const model = options.model ?? WATSONX_MODEL;

  // watsonx.ai chat completions endpoint
  const url = `${WATSONX_HOST}/ml/v1/text/chat?version=2024-03-14`;

  const payload: Record<string, unknown> = {
    model_id: model,
    project_id: WATSONX_PROJECT_ID,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    max_tokens: options.maxTokens ?? 1500,
    temperature: options.temperature ?? 0.3,
  };

  if (options.jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`watsonx.ai chat failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`watsonx.ai returned no content: ${JSON.stringify(data)}`);
  }
  return content;
}

/**
 * Helper for JSON-output prompts. Cleans up common LLM mistakes (markdown
 * fences, trailing commas) before parsing.
 */
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
  return Boolean(WATSONX_API_KEY && WATSONX_PROJECT_ID);
}
