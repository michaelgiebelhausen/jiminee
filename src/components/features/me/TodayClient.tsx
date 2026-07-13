"use client";

// The .me core loop, on one screen:
//   "Every morning I decide what matters, and Jiminee won't let me
//    quietly drop those things."
// Ritual → commit picks → habits with streaks → focus sessions the
// presence watcher holds you to.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { completeTask } from "@/lib/board/mutations";
import { useFocusPresence } from "@/hooks/useFocusPresence";

export type HabitVM = {
  id: string;
  org_id: string;
  title: string;
  recurrence: string;
  dueToday: boolean;
  streak: number;
  doneToday: boolean;
};

export type MeTaskVM = {
  id: string;
  org_id?: string;
  title: string;
  status: string;
  task_type: string;
  priority: string;
  due_at: string | null;
  committed_on: string | null;
  last_activity_at: string;
};

async function post(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

export function TodayClient({
  todayIso,
  habits,
  committed,
  proposed,
  openSession,
  intensity,
}: {
  todayIso: string;
  habits: HabitVM[];
  committed: MeTaskVM[];
  proposed: MeTaskVM[];
  openSession: { id: string; taskId: string } | null;
  intensity: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(openSession);
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(proposed.slice(0, 3).map((t) => t.id))
  );
  const { checkinDue, answerCheckin } = useFocusPresence(session?.id ?? null);

  const ritualDone = committed.length > 0;
  const focusTask =
    session && [...committed, ...proposed].find((t) => t.id === session.taskId);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const commit = () =>
    run(() => post("/api/me/commit", { taskIds: [...picked] }));

  const checkHabit = (id: string) =>
    run(() => post("/api/me/habits/check", { taskId: id }));

  const startFocus = (taskId: string) =>
    run(async () => {
      const r = (await post("/api/me/focus", { action: "start", taskId })) as {
        sessionId: string;
      };
      setSession({ id: r.sessionId, taskId });
    });

  const stopFocus = (outcome: "completed" | "stopped") =>
    run(async () => {
      if (!session) return;
      await post("/api/me/focus", { action: "stop", sessionId: session.id, outcome });
      if (outcome === "completed" && focusTask?.org_id) {
        await completeTask(supabase, { id: focusTask.id, org_id: focusTask.org_id });
      }
      setSession(null);
    });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold">Today</h1>
        <p className="text-sm text-ink-secondary">
          {todayIso} · conscience set to <span className="font-semibold">{intensity.replace("_", " ")}</span>
        </p>
      </header>

      {/* Focus check-in banner (screen-agent v1) */}
      {checkinDue && (
        <div
          data-testid="checkin-banner"
          className="mb-4 flex items-center justify-between rounded-md border border-warning bg-warning-soft p-3"
        >
          <span className="text-sm font-semibold">
            Still on “{focusTask?.title ?? "your task"}”?
          </span>
          <button
            onClick={answerCheckin}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-on-primary hover:bg-primary-hover"
          >
            Yep, still on it
          </button>
        </div>
      )}

      {/* Active focus bar */}
      {session && (
        <div
          data-testid="focus-bar"
          className="mb-6 flex items-center justify-between rounded-md border border-primary bg-success-soft p-4 shadow-rest"
        >
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Focusing
            </div>
            <div className="font-bold">{focusTask?.title ?? "…"}</div>
          </div>
          <div className="flex gap-2">
            <button
              data-testid="focus-done"
              disabled={busy}
              onClick={() => stopFocus("completed")}
              className="rounded-md bg-primary px-3 py-2 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-50"
            >
              Done ✓
            </button>
            <button
              data-testid="focus-stop"
              disabled={busy}
              onClick={() => stopFocus("stopped")}
              className="rounded-md border border-line-strong px-3 py-2 text-sm font-semibold text-ink-secondary hover:bg-surface disabled:opacity-50"
            >
              Stop
            </button>
          </div>
        </div>
      )}

      {/* Daily commitments (habits + streaks) */}
      {habits.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-ink-secondary">
            Daily commitments
          </h2>
          <div className="flex flex-col gap-2">
            {habits.map((h) => (
              <div
                key={h.id}
                data-testid="habit-row"
                className={`flex items-center justify-between rounded-md border border-line bg-surface p-3 shadow-rest ${
                  !h.dueToday ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={h.doneToday ? "line-through opacity-60" : ""}>{h.title}</span>
                  {h.streak > 0 && (
                    <span
                      data-testid="streak-badge"
                      className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-bold text-primary"
                    >
                      🔥 {h.streak}
                    </span>
                  )}
                  {!h.dueToday && (
                    <span className="text-[11px] text-ink-muted">not due today</span>
                  )}
                </div>
                {h.dueToday && !h.doneToday && (
                  <button
                    data-testid="habit-check"
                    disabled={busy}
                    onClick={() => checkHabit(h.id)}
                    className="rounded-md border border-primary px-3 py-1.5 text-sm font-bold text-primary hover:bg-success-soft disabled:opacity-50"
                  >
                    Done today
                  </button>
                )}
                {h.doneToday && <span className="text-sm font-bold text-primary">✓</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Morning ritual */}
      {!ritualDone && proposed.length > 0 && (
        <section data-testid="ritual" className="mb-6 rounded-lg border border-primary bg-surface p-4 shadow-raised">
          <h2 className="text-lg font-extrabold">What matters today?</h2>
          <p className="mb-3 text-sm text-ink-secondary">
            Pick up to 5. I’ll hold you to them — that’s the deal.
          </p>
          <div className="flex flex-col gap-1.5">
            {proposed.map((t) => (
              <label
                key={t.id}
                data-testid="ritual-pick"
                className="flex cursor-pointer items-center gap-2 rounded-md border border-line p-2.5 hover:bg-success-soft"
              >
                <input
                  type="checkbox"
                  checked={picked.has(t.id)}
                  onChange={(e) => {
                    const next = new Set(picked);
                    if (e.target.checked && next.size < 5) next.add(t.id);
                    else next.delete(t.id);
                    setPicked(next);
                  }}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm font-semibold">{t.title}</span>
                {t.priority === "high" && (
                  <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10.5px] font-bold uppercase text-warning">
                    High
                  </span>
                )}
              </label>
            ))}
          </div>
          <button
            data-testid="commit-button"
            disabled={busy || picked.size === 0}
            onClick={commit}
            className="mt-3 rounded-md bg-primary px-4 py-2 font-bold text-on-primary hover:bg-primary-hover disabled:opacity-50"
          >
            Commit to today ({picked.size})
          </button>
        </section>
      )}

      {/* Today's committed picks */}
      {committed.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wider text-ink-secondary">
            Committed today
          </h2>
          <div className="flex flex-col gap-2">
            {committed.map((t) => (
              <div
                key={t.id}
                data-testid="today-card"
                className={`flex items-center justify-between rounded-md border border-line bg-surface p-3 shadow-rest ${
                  t.status === "done" ? "opacity-60" : ""
                }`}
              >
                <span className={`text-sm font-semibold ${t.status === "done" ? "line-through" : ""}`}>
                  {t.title}
                </span>
                {t.status !== "done" && !session && (
                  <button
                    data-testid="focus-start"
                    disabled={busy}
                    onClick={() => startFocus(t.id)}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-bold text-on-primary hover:bg-primary-hover disabled:opacity-50"
                  >
                    Focus
                  </button>
                )}
                {t.status === "done" && <span className="text-sm font-bold text-primary">✓</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {ritualDone && committed.every((t) => t.status === "done") && (
        <p data-testid="all-done" className="rounded-md bg-success-soft p-4 text-center font-bold text-primary">
          Everything you promised yourself today is done. Chirp. 🦗
        </p>
      )}
    </main>
  );
}
