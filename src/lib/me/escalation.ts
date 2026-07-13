// .me escalation ladder — the paid conscience.
// The user picks a *cap* (how hard Jiminee is allowed to chase them);
// chasing always starts warm and climbs one rung per ignored nudge,
// never past the cap. Quiet hours silence everything.

export type Intensity = "warm" | "firm" | "tough_love";

const LADDER: Intensity[] = ["warm", "firm", "tough_love"];

/**
 * Pick the intensity for the next nudge.
 * @param cap          the user's self-set maximum (me_settings.nudge_intensity)
 * @param ignoredCount prior unanswered nudges in this episode (0 = first nudge)
 */
export function escalate(cap: Intensity, ignoredCount: number): Intensity {
  const capIdx = LADDER.indexOf(cap);
  const idx = Math.min(Math.max(ignoredCount, 0), capIdx);
  return LADDER[idx];
}

/**
 * Quiet hours: [quietStart, quietEnd) wrapping midnight when start > end
 * (the default 22 → 7 silences 10pm–7am).
 */
export function inQuietHours(hour: number, quietStart: number, quietEnd: number): boolean {
  if (quietStart === quietEnd) return false; // degenerate: no quiet window
  if (quietStart < quietEnd) return hour >= quietStart && hour < quietEnd;
  return hour >= quietStart || hour < quietEnd;
}

/** Local hour + ISO date in the user's timezone (mirrors sweep.ts's Intl use). */
export function localClock(now: Date, tz: string): { hour: number; todayIso: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const rawHour = Number(get("hour"));
  return {
    hour: rawHour === 24 ? 0 : rawHour, // some ICU versions emit "24" at midnight
    todayIso: `${get("year")}-${get("month")}-${get("day")}`,
  };
}
