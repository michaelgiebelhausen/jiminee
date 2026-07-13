// .me anti-rot sweep decisions — pure, unit-tested (mirrors nudges/sweep.ts).
// Two failure modes of a schedule-free to-do board:
//   stale_card:      a non-habit card untouched in todo/doing past the threshold
//   today_slipping:  a committed today-pick still not done by late afternoon
// The cron route turns these into nudges; escalation/quiet-hours are applied there.

export type MeSweepTask = {
  id: string;
  org_id: string;
  title: string;
  status: string; // backlog|todo|doing|blocked|done
  task_type: string; // todo|project|habit
  committed_on: string | null; // YYYY-MM-DD
  last_activity_at: string; // timestamptz ISO
};

export type MeOpenNudge = {
  task_id: string;
  status: string; // sent|confirmed|released|expired
  sent_at: string;
};

export type RotKind = "stale_card" | "today_slipping";

export type RotAction = { kind: RotKind; taskId: string; title: string };

export const STALE_DAYS_DEFAULT = 3;
export const SLIP_HOUR_DEFAULT = 16; // 4pm local: today's picks start getting chased
const DAY_MS = 86_400_000;

/**
 * Decide anti-rot actions. Pure: callers supply the local clock.
 * @param nowMs      epoch ms
 * @param todayIso   today's date (user tz), YYYY-MM-DD
 * @param localHour  current hour (user tz), 0-23
 */
export function decideRotActions(
  nowMs: number,
  todayIso: string,
  localHour: number,
  tasks: MeSweepTask[],
  openNudges: MeOpenNudge[],
  opts: { staleDays?: number; slipHour?: number } = {}
): RotAction[] {
  const staleDays = opts.staleDays ?? STALE_DAYS_DEFAULT;
  const slipHour = opts.slipHour ?? SLIP_HOUR_DEFAULT;

  // One open (unanswered) nudge per task at a time — don't pile on.
  const nudged = new Set(openNudges.filter((n) => n.status === "sent").map((n) => n.task_id));

  const actions: RotAction[] = [];
  for (const t of tasks) {
    if (t.status === "done" || t.status === "blocked") continue;
    if (t.task_type === "habit") continue; // habits are the ritual's job, not rot's
    if (nudged.has(t.id)) continue;

    // Today-pick slipping beats staleness (more specific, more urgent).
    if (t.committed_on === todayIso && localHour >= slipHour) {
      actions.push({ kind: "today_slipping", taskId: t.id, title: t.title });
      continue;
    }

    if (t.status === "todo" || t.status === "doing") {
      const idleMs = nowMs - new Date(t.last_activity_at).getTime();
      if (idleMs >= staleDays * DAY_MS) {
        actions.push({ kind: "stale_card", taskId: t.id, title: t.title });
      }
    }
  }
  return actions;
}
