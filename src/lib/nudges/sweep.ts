// Idle-detection sweep (FR-010/FR-011). The DECISION half is pure and unit-tested;
// the EXECUTION half runs from the cron route with the admin client.

export const IDLE_MIN_MINUTES = 15;
export const IDLE_MAX_MINUTES = 120;
export const IDLE_DEFAULT_MINUTES = 30;
export const SMS_FALLBACK_MINUTES = 15;
export const EXPIRE_MINUTES = 30;
export const MAX_CYCLES_PER_DAY = 3;

// MVP quiet hours: 8am–6pm Mon–Fri, org-local. Pilot org is Clemson (America/New_York).
// TASK-047 makes this a per-org setting.
export const QUIET_TZ = "America/New_York";

export type SweepTask = {
  id: string;
  org_id: string;
  title: string;
  assignee_id: string;
  estimated_minutes: number | null;
  last_activity_at: string | null;
  claimed_at: string | null;
};

export type OpenNudge = {
  id: string;
  task_id: string;
  channel: "push" | "sms";
  status: "sent" | "confirmed" | "released" | "expired";
  sent_at: string;
};

export type SweepAction =
  | { kind: "send_first"; taskId: string }
  | { kind: "sms_fallback"; taskId: string; pushNudgeId: string }
  | { kind: "expire"; taskId: string; nudgeId: string };

export function idleWindowMinutes(estimatedMinutes: number | null): number {
  const est = estimatedMinutes ?? IDLE_DEFAULT_MINUTES;
  return Math.min(IDLE_MAX_MINUTES, Math.max(IDLE_MIN_MINUTES, est));
}

export function isWorkingHours(
  now: Date,
  tz: string = QUIET_TZ,
  workStart = 8,
  workEnd = 18
): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const isWeekday = !["Sat", "Sun"].includes(weekday);
  return isWeekday && hour >= workStart && hour < workEnd;
}

/**
 * Decide what to do for each 'doing' task. Idempotent: an open (sent) nudge
 * suppresses re-sending, so a doubled cron run cannot double-nudge.
 */
export function decideSweepActions(
  now: Date,
  tasks: SweepTask[],
  nudges: OpenNudge[], // today's nudges for these tasks, any status
  opts: { tz?: string; workStart?: number; workEnd?: number } = {}
): SweepAction[] {
  if (!isWorkingHours(now, opts.tz, opts.workStart, opts.workEnd)) return [];

  const actions: SweepAction[] = [];
  for (const task of tasks) {
    const taskNudges = nudges.filter((n) => n.task_id === task.id);
    const open = taskNudges.filter((n) => n.status === "sent");
    const cyclesToday = taskNudges.filter((n) => n.channel === "push" || n.channel === "sms").length;

    const openPush = open.find((n) => n.channel === "push");
    const openSms = open.find((n) => n.channel === "sms");

    if (openSms) {
      const age = (now.getTime() - new Date(openSms.sent_at).getTime()) / 60000;
      if (age >= EXPIRE_MINUTES) actions.push({ kind: "expire", taskId: task.id, nudgeId: openSms.id });
      continue;
    }
    if (openPush) {
      const age = (now.getTime() - new Date(openPush.sent_at).getTime()) / 60000;
      if (age >= SMS_FALLBACK_MINUTES) {
        actions.push({ kind: "sms_fallback", taskId: task.id, pushNudgeId: openPush.id });
      }
      continue;
    }

    // No open nudge: is the task idle past its window?
    if (cyclesToday >= MAX_CYCLES_PER_DAY) continue; // fatigue cap — dashboard-only from here
    const basis = task.last_activity_at ?? task.claimed_at;
    if (!basis) continue;
    const idleMinutes = (now.getTime() - new Date(basis).getTime()) / 60000;
    if (idleMinutes > idleWindowMinutes(task.estimated_minutes)) {
      actions.push({ kind: "send_first", taskId: task.id });
    }
  }
  return actions;
}
