"use client";

import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export function CardChat({ taskId, initialMessages }: { taskId: string; initialMessages: Msg[] }) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  function scrollDown() {
    requestAnimationFrame(() => listRef.current?.scrollTo(0, listRef.current.scrollHeight));
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || streaming !== null) return;
    setError(null);
    setMessages((m) => [...m, { role: "user", content: message }]);
    setInput("");
    setStreaming("");
    scrollDown();

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, message }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Jiminee didn't hear that — try again.");
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreaming(full.split("\n__")[0]);
        scrollDown();
      }
      if (full.includes("__ERROR__:")) {
        throw new Error(full.split("__ERROR__:")[1]?.trim() || "Chat failed mid-reply.");
      }
      setMessages((m) => [...m, { role: "assistant", content: full.split("\n__")[0].trim() }]);
      setStreaming(null);
    } catch (err) {
      // Preserve the draft on failure (PRD § Screen: Task Detail).
      setMessages((m) => m.slice(0, -1));
      setInput(message);
      setStreaming(null);
      setError(err instanceof Error ? err.message : "Jiminee didn't hear that — try again.");
    }
    scrollDown();
  }

  return (
    <div className="rounded-md border border-line bg-background p-3">
      <div ref={listRef} className="flex max-h-80 flex-col gap-2.5 overflow-y-auto">
        {messages.length === 0 && streaming === null && (
          <p className="px-2 py-3 text-center text-[13px] italic text-ink-muted">
            Stuck on something? Ask away — no dumb questions here.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "max-w-[85%] self-end rounded-md rounded-br-[4px] bg-accent-soft px-3 py-2 text-sm"
                : "max-w-[85%] self-start rounded-md rounded-bl-[4px] border border-line bg-surface px-3 py-2 text-sm"
            }
          >
            {m.role === "assistant" && (
              <span className="mb-0.5 block text-[10.5px] font-bold uppercase tracking-wider text-primary">
                Jiminee
              </span>
            )}
            {m.content}
          </div>
        ))}
        {streaming !== null && (
          <div className="max-w-[85%] self-start rounded-md rounded-bl-[4px] border border-line bg-surface px-3 py-2 text-sm">
            <span className="mb-0.5 block text-[10.5px] font-bold uppercase tracking-wider text-primary">
              Jiminee
            </span>
            {streaming}
            <span className="animate-pulse text-primary">▍</span>
          </div>
        )}
      </div>

      {error && <p className="mt-2 rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}

      <form onSubmit={send} className="mt-2.5 flex gap-2">
        <input
          className="h-10 flex-1 rounded-sm border border-line bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          placeholder="Ask anything — no dumb questions here"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={!input.trim() || streaming !== null}
          className="h-10 rounded-sm bg-primary px-4 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
        >
          Send
        </button>
      </form>
    </div>
  );
}
