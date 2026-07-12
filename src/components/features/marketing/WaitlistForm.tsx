"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setState(res.ok ? "done" : "error");
  }

  if (state === "done") {
    return (
      <p className="mt-3 rounded-sm bg-success-soft px-3 py-2 text-sm text-success">
        You&apos;re on the list — the cricket will chirp when it&apos;s time.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 flex gap-2">
      <input
        type="email"
        required
        className="h-10 flex-1 rounded-sm border border-line bg-surface px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email for the jiminee.me waitlist"
      />
      <button
        type="submit"
        disabled={state === "busy"}
        className="h-10 rounded-sm bg-primary px-4 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
      >
        {state === "busy" ? "…" : "Join"}
      </button>
      {state === "error" && <span className="self-center text-sm text-error">Try again?</span>}
    </form>
  );
}
