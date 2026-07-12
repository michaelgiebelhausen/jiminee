"use client";

import { useState } from "react";

export function ChaseButton({ taskId }: { taskId: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  async function chase() {
    setState("busy");
    const res = await fetch(`/api/tasks/${taskId}/chase`, { method: "POST" });
    setState(res.ok ? "done" : "idle");
  }

  if (state === "done") {
    return <span className="py-2 text-[13px] text-ink-muted">Noted — it counts toward the gate.</span>;
  }

  return (
    <button
      onClick={chase}
      disabled={state === "busy"}
      title="Helps Jiminee measure what it saves you — logs that this task needed a personal follow-up."
      className="h-10 rounded-sm px-3 text-[13px] font-semibold text-ink-muted underline underline-offset-2 hover:text-warning"
    >
      {state === "busy" ? "Noting…" : "I had to chase this"}
    </button>
  );
}
