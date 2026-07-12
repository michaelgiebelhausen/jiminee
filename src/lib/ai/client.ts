import "server-only";
import OpenAI from "openai";

// AI provider seam (FR-006): nothing outside src/lib/ai imports the SDK.
// We call Claude through OpenRouter — one key for many models. To move to a
// cheaper model later, set AI_MODEL; no code change needed.
// Confirm exact model slugs at https://openrouter.ai/models
export const MODEL = process.env.AI_MODEL ?? "anthropic/claude-sonnet-4.5";

// AI_MOCK=1 short-circuits generation with canned output — used by CI/E2E.
export const AI_MOCK = process.env.AI_MOCK === "1";

let _client: OpenAI | null = null;

export function ai(): OpenAI {
  if (!_client) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not set");
    }
    _client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      // OpenRouter attribution headers (recommended; some models require them).
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://jiminee.work",
        "X-Title": "Jiminee",
      },
    });
  }
  return _client;
}
