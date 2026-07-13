// .me habit streaks — pure functions over habit_completions dates.
// A streak is consecutive *due* days completed, walking back from today.
// Weekday habits skip weekends when walking back (a Monday completion
// after a completed Friday keeps the chain).

export type Recurrence = "daily" | "weekdays";

export type StreakInfo = {
  current: number; // length of the live chain, counting today if done
  doneToday: boolean;
  atRisk: boolean; // due today, not done yet, and a chain >= 1 is on the line
};

const DAY_MS = 86_400_000;

function toUtcDate(iso: string): Date {
  // "YYYY-MM-DD" → Date at UTC midnight (avoids local-tz off-by-one).
  return new Date(`${iso}T00:00:00Z`);
}

function isoOf(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function isDueOn(dateIso: string, recurrence: Recurrence): boolean {
  if (recurrence === "daily") return true;
  const dow = toUtcDate(dateIso).getUTCDay();
  return dow >= 1 && dow <= 5;
}

/** Walk back from `dateIso` to the previous due day for this recurrence. */
function previousDueDay(dateIso: string, recurrence: Recurrence): string {
  let d = toUtcDate(dateIso);
  do {
    d = new Date(d.getTime() - DAY_MS);
  } while (!isDueOn(isoOf(d), recurrence));
  return isoOf(d);
}

/**
 * Compute the live streak for a habit.
 * @param completions ISO dates ("YYYY-MM-DD") the habit was completed, any order
 * @param todayIso    today's date in the user's timezone
 */
export function computeStreak(
  completions: string[],
  todayIso: string,
  recurrence: Recurrence
): StreakInfo {
  const done = new Set(completions);
  const dueToday = isDueOn(todayIso, recurrence);
  const doneToday = dueToday && done.has(todayIso);

  // Start the walk at today if it's done, else at the previous due day
  // (an unfinished today doesn't break the chain until the day ends).
  let cursor = doneToday ? todayIso : previousDueDay(todayIso, recurrence);
  let current = 0;
  while (done.has(cursor)) {
    current += 1;
    cursor = previousDueDay(cursor, recurrence);
  }

  return {
    current,
    doneToday,
    atRisk: dueToday && !doneToday && current >= 1,
  };
}
