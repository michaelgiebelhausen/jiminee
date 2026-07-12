import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// The provider seam (FR-006): nothing outside src/lib/ai imports the Anthropic SDK.
export const MODEL = "claude-sonnet-5";

// AI_MOCK=1 short-circuits generation with canned output — used by CI/E2E for determinism.
export const AI_MOCK = process.env.AI_MOCK === "1";

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}
