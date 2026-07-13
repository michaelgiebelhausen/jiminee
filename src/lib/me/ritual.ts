// .me daily ritual proposal — deterministic ranking of "what should today be?"
// (AI-assisted phrasing can layer on later; the ranking itself stays testable.)
// Habits due today always ride along; picks are capped so the ritual stays a
// commitment ceremony, not another overwhelming list.

export type RitualTask = {
  id: string;
  title: string;
  status: string;
  task_type: string;
  priority: string; // low|normal|high
  due_at: string | null; // timestamptz ISO
  committed_on: string | null; // YYYY-MM-DD
  last_activity_at: string;
};

export type RitualProposal = {
  /** Non-habit candidates for today's commitment, best-first, capped. */
  picks: RitualTask[];
  /** Cards already committed today (ritual already ran). */
  alreadyCommitted: RitualTask[];
};

export const MAX_PICKS = 5;
const DAY_MS = 86_400_000;

const PRIORITY_RANK: Record<string, number> = { high: 0, normal: 1, low: 2 };

/**
 * Rank open non-habit cards for the morning ritual.
 * Order: overdue/due-soon first, then priority, then staleness (oldest first).
 */
export function proposeToday(
  tasks: RitualTask[],
  todayIso: string,
  nowMs: number
): RitualProposal {
  const nonHabit = tasks.filter((t) => t.task_type !== "habit" && t.status !== "blocked");

  // Done cards stay in today's list (struck through — the visible win);
  // only open cards are candidates for new commitment.
  const alreadyCommitted = nonHabit.filter((t) => t.committed_on === todayIso);
  const candidates = nonHabit.filter(
    (t) => t.committed_on !== todayIso && t.status !== "done"
  );

  const dueScore = (t: RitualTask): number => {
    if (!t.due_at) return Number.MAX_SAFE_INTEGER;
    return new Date(t.due_at).getTime() - nowMs; // negative = overdue, most urgent
  };

  candidates.sort((a, b) => {
    // 1. due date pressure (overdue < due soon < undated)
    const dueDiff = dueScore(a) - dueScore(b);
    if (dueDiff !== 0) return dueDiff < 0 ? -1 : 1;
    // 2. priority
    const prio =
      (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
    if (prio !== 0) return prio;
    // 3. staleness: the card that's waited longest goes first
    return new Date(a.last_activity_at).getTime() - new Date(b.last_activity_at).getTime();
  });

  return { picks: candidates.slice(0, MAX_PICKS), alreadyCommitted };
}

/** True when a card's due date makes it urgent enough to badge in the UI. */
export function isDueSoon(dueAt: string | null, nowMs: number): boolean {
  if (!dueAt) return false;
  return new Date(dueAt).getTime() - nowMs < 2 * DAY_MS;
}
