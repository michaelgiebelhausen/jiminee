import "server-only";
import { ai, MODEL, AI_MOCK } from "./client";
import { stepsSystemPrompt, stepsUserPrompt, type TaskContext } from "./prompts";

const MOCK_STEPS = `1. Read the task title again so you know exactly what's being asked.
2. Check the workplace brief section of this card for where things live.
3. Gather what you need before you start walking.
4. Do the main part of the task carefully.
5. Double-check the result matches what was asked.
6. Mark this card done — and note anything odd in the chat.`;

/** Streams raw model text. The route parses + persists after the stream completes. */
export async function* generateStepsStream(ctx: TaskContext): AsyncGenerator<string> {
  if (AI_MOCK) {
    for (const line of MOCK_STEPS.split("\n")) {
      yield line + "\n";
      await new Promise((r) => setTimeout(r, 30));
    }
    return;
  }

  const stream = await ai().chat.completions.create({
    model: MODEL,
    max_tokens: 1500,
    stream: true,
    messages: [
      { role: "system", content: stepsSystemPrompt(ctx) },
      { role: "user", content: stepsUserPrompt(ctx) },
    ],
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
