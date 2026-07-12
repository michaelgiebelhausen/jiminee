"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type DisputeItem = {
  id: string;
  reason: string;
  created_at: string;
  task_id: string;
  task_title: string;
  raised_by_name: string;
};

export type WorkerOption = { id: string; name: string };

export function DisputeQueue({ disputes, workers }: { disputes: DisputeItem[]; workers: WorkerOption[] }) {
  const router = useRouter();
  const [ruling, setRuling] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [reassignTo, setReassignTo] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (disputes.length === 0) {
    return (
      <p className="rounded-md border border-line bg-surface p-5 text-center text-sm italic text-ink-muted">
        No open disputes. The paper trail is quiet.
      </p>
    );
  }

  async function rule(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/disputes/${id}/rule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ruling: ruling[id],
          note: note[id],
          reassignTo: ruling[id] === "reassigned" && reassignTo[id] ? reassignTo[id] : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Ruling didn't stick — try again.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ruling didn't stick — try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}
      {disputes.map((d) => (
        <div key={d.id} className="rounded-md border border-line bg-surface p-4 shadow-rest">
          <Link href={`/task/${d.task_id}`} className="font-bold hover:text-primary">
            {d.task_title}
          </Link>
          <p className="mt-1 text-sm text-ink-secondary">
            <b>{d.raised_by_name}</b> flagged it: &ldquo;{d.reason}&rdquo;
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              className="h-9 rounded-sm border border-line bg-surface px-2 text-sm"
              value={ruling[d.id] ?? ""}
              onChange={(e) => setRuling({ ...ruling, [d.id]: e.target.value })}
              aria-label="Ruling"
            >
              <option value="" disabled>
                Your ruling…
              </option>
              <option value="reassigned">Reassign — someone else takes it</option>
              <option value="upheld">Uphold — it stays with them</option>
              <option value="dismissed">Dismiss — back to the backlog</option>
            </select>
            {ruling[d.id] === "reassigned" && (
              <select
                className="h-9 rounded-sm border border-line bg-surface px-2 text-sm"
                value={reassignTo[d.id] ?? ""}
                onChange={(e) => setReassignTo({ ...reassignTo, [d.id]: e.target.value })}
                aria-label="Reassign to"
              >
                <option value="">Back to To Do (anyone)</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <textarea
            className="mt-2 min-h-16 w-full rounded-sm border border-line p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            placeholder="Your note — required. This is the record everyone sees."
            value={note[d.id] ?? ""}
            onChange={(e) => setNote({ ...note, [d.id]: e.target.value })}
          />
          <button
            onClick={() => rule(d.id)}
            disabled={!ruling[d.id] || (note[d.id] ?? "").trim().length < 3 || busy === d.id}
            className="mt-2 h-9 rounded-sm bg-primary px-4 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
          >
            {busy === d.id ? "Ruling…" : "Rule"}
          </button>
        </div>
      ))}
    </div>
  );
}
