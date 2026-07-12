import "server-only";
import { ai, MODEL, AI_MOCK } from "./client";
import { chatSystemPrompt, type TaskContext } from "./prompts";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function* cardChatStream(
  ctx: TaskContext,
  steps: string[],
  history: ChatTurn[],
  userMessage: string
): AsyncGenerator<string> {
  if (AI_MOCK) {
    const reply = `Good question — for "${ctx.title}", check the workplace brief on this card, and if it's not covered, ask the contact listed there. You've got this.`;
    for (const word of reply.split(" ")) {
      yield word + " ";
      await new Promise((r) => setTimeout(r, 15));
    }
    return;
  }

  const stream = await ai().chat.completions.create({
    model: MODEL,
    max_tokens: 800,
    stream: true,
    messages: [
      { role: "system", content: chatSystemPrompt(ctx, steps) },
      ...history.slice(-20),
      { role: "user", content: userMessage },
    ],
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
