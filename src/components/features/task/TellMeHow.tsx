"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { logTaskEvent } from "@/lib/events";
import { track } from "@/lib/analytics";

export type Step = {
  id: string;
  step_number: number;
  content: string;
  checked_at: string | null;
  generation_id: string;
};

export function TellMeHow({
  taskId,
  orgId,
  initialSteps,
  isAssignee,
  briefCompleted,
  userId,
}: {
  taskId: string;
  orgId: string;
  initialSteps: Step[];
  isAssignee: boolean;
  briefCompleted: boolean;
  userId: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [streamText, setStreamText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flagOpen, setFlagOpen] = useState(false);
  const [flagNote, setFlagNote] = useState("");
  const [flagState, setFlagState] = useState<"idle" | "busy" | "sent">("idle");

  const generationId = steps[0]?.generation_id;
  const done = steps.filter((s) => s.checked_at).length;

  async function refetchSteps() {
    const { data } = await supabase
      .from("task_steps")
      .select("id, step_number, content, checked_at, generation_id")
      .eq("task_id", taskId)
      .order("step_number");
    const rows = (data ?? []) as Step[];
    const latest = rows[rows.length - 1]?.generation_id;
    setSteps(rows.filter((r) => r.generation_id === latest));
  }

  async function generate() {
    if (steps.length > 0 && !confirm("Regenerate the steps? The current checklist will be replaced.")) {
      return;
    }
    setBusy(true);
    setError(null);
    setStreamText("");
    try {
      const res = await fetch("/api/ai/steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Couldn't generate steps just now — give it another tap.");
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      for (;;) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        full += decoder.decode(value, { stream: true });
        const display = full.split("\n__")[0];
        setStreamText(display);
      }
      if (full.includes("__ERROR__:")) {
        throw new Error(full.split("__ERROR__:")[1]?.trim() || "Generation failed mid-stream.");
      }
      await refetchSteps();
      track("tmh_generated");
      setStreamText(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't generate steps just now — give it another tap. The card still works the old-fashioned way."
      );
      setStreamText(null);
    } finally {
      setBusy(false);
    }
  }

  async function toggleStep(step: Step) {
    if (!isAssignee) return;
    const checked = step.checked_at ? null : new Date().toISOString();
    setSteps((ss) => ss.map((s) => (s.id === step.id ? { ...s, checked_at: checked } : s)));
    const { error } = await supabase
      .from("task_steps")
      .update({ checked_at: checked, checked_by: checked ? userId : null })
      .eq("id", step.id);
    if (error) {
      setSteps((ss) => ss.map((s) => (s.id === step.id ? { ...s, checked_at: step.checked_at } : s)));
      return;
    }
    await supabase
      .from("tasks")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", taskId);
    if (checked) {
      track("step_checked");
      await logTaskEvent(supabase, orgId, taskId, "step_checked", { step: step.step_number });
    }
  }

  async function sendFlag() {
    setFlagState("busy");
    try {
      const res = await fetch("/api/ai/flag-correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, generationId, note: flagNote }),
      });
      if (!res.ok) throw new Error();
      setFlagState("sent");
      setFlagOpen(false);
      setFlagNote("");
    } catch {
      setFlagState("idle");
      setError("Couldn't send the flag — try again.");
    }
  }

  return (
    <div>
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
        Tell me how{steps.length > 0 && ` — ${done} of ${steps.length} done`}
      </h2>

      {steps.length === 0 && streamText === null && (
        <div className="rounded-md border border-line bg-surface p-5 text-center shadow-rest">
          <p className="mb-3 text-sm text-ink-secondary">
            Never done this before? Jiminee writes the steps.
          </p>
          <button
            onClick={generate}
            disabled={busy || !briefCompleted}
            className="h-10 rounded-sm bg-primary px-5 font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
            title={briefCompleted ? undefined : "Ask your administrator to finish the workplace brief"}
          >
            {busy ? "Thinking…" : "Tell me how"}
          </button>
          {!briefCompleted && (
            <p className="mt-2 text-[13px] text-ink-muted">
              Ask your administrator to finish the workplace brief first.
            </p>
          )}
        </div>
      )}

      {streamText !== null && (
        <pre className="whitespace-pre-wrap rounded-md border border-line bg-surface p-4 font-body text-[15px] leading-relaxed shadow-rest">
          {streamText}
          <span className="animate-pulse text-primary">▍</span>
        </pre>
      )}

      {steps.length > 0 && streamText === null && (
        <div className="flex flex-col gap-0.5">
          {steps.map((step) => (
            <label
              key={step.id}
              className={`flex items-start gap-2.5 rounded-sm px-2.5 py-2 transition-colors ${
                isAssignee ? "cursor-pointer hover:bg-background" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={Boolean(step.checked_at)}
                onChange={() => toggleStep(step)}
                disabled={!isAssignee}
                className="mt-1 h-5 w-5 accent-primary"
                aria-label={`Step ${step.step_number}`}
              />
              <span
                className={
                  step.checked_at ? "text-ink-secondary line-through decoration-line-strong" : ""
                }
              >
                {step.content}
              </span>
            </label>
          ))}
          <div className="mt-1 flex items-center gap-3 px-2">
            {isAssignee && flagState !== "sent" && (
              <button
                onClick={() => setFlagOpen(true)}
                className="py-1.5 text-[13px] font-semibold text-ink-muted underline underline-offset-2 hover:text-error"
              >
                These steps were wrong? Flag it
              </button>
            )}
            {flagState === "sent" && (
              <span className="py-1.5 text-[13px] text-success">
                Flag sent — the next checklist gets smarter.
              </span>
            )}
            <button
              onClick={generate}
              disabled={busy}
              className="py-1.5 text-[13px] font-semibold text-ink-muted underline underline-offset-2 hover:text-primary"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}

      {flagOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-overlay">
            <h3 className="font-body text-lg font-bold">Flag these steps as wrong?</h3>
            <p className="mt-1 text-sm text-ink-secondary">
              Tell us what didn&apos;t match reality — your manager gets notified and the next
              checklist gets smarter.
            </p>
            <textarea
              autoFocus
              className="mt-3 min-h-24 w-full rounded-sm border border-line p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. The toner isn't in the supply closet anymore — it moved to the front desk."
              value={flagNote}
              onChange={(e) => setFlagNote(e.target.value)}
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={sendFlag}
                disabled={flagNote.trim().length < 3 || flagState === "busy"}
                className="h-10 flex-1 rounded-sm bg-primary font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
              >
                {flagState === "busy" ? "Sending…" : "Send flag"}
              </button>
              <button
                onClick={() => setFlagOpen(false)}
                className="h-10 rounded-sm border border-line-strong px-4 font-bold text-ink-secondary hover:bg-surface-sunken"
              >
                Never mind
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
