// Event vocabulary — must match the CHECK constraint in supabase/migrations/0001_schema.sql
// and the allowed list in the log_task_event RPC (0002_rls.sql), both extended by
// 0006_me_accountability.sql (.me events).
export const EVENT_TYPES = [
  "created",
  "claimed",
  "released",
  "moved",
  "step_checked",
  "steps_generated",
  "chat_message",
  "nudge_sent",
  "nudge_confirmed",
  "nudge_expired",
  "flagged",
  "ruled",
  "completed",
  "correction_flagged",
  "manager_chase",
  // .me accountability (0006)
  "committed_today",
  "focus_started",
  "focus_ended",
  "habit_completed",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export type EventPayload = Record<string, string | number | boolean | null>;
