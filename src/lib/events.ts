import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventType, EventPayload } from "@/types/events";

// FR-005: the ONLY writers to task_events.
// - logTaskEvent: client/server acting as a user → security-definer RPC (validates membership).
// - logSystemEvent: cron/notifications via the admin client → direct insert with actor null.
// An ESLint rule blocks `.from("task_events")` everywhere outside this file.

export async function logTaskEvent(
  supabase: SupabaseClient,
  orgId: string,
  taskId: string | null,
  eventType: EventType,
  payload: EventPayload = {}
): Promise<void> {
  const { error } = await supabase.rpc("log_task_event", {
    p_org_id: orgId,
    p_task_id: taskId,
    p_event_type: eventType,
    p_payload: payload,
  });
  if (error) {
    // The event log is the product's memory — surface loudly in dev, report in prod.
    console.error(`logTaskEvent(${eventType}) failed:`, error.message);
  }
}

export type TaskEventRow = {
  id: number;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
  actor: { display_name: string } | null;
};

export async function fetchTaskEvents(
  supabase: SupabaseClient,
  taskId: string
): Promise<TaskEventRow[]> {
  const { data } = await supabase
    .from("task_events")
    .select(
      "id, event_type, payload, created_at, actor:users!task_events_actor_id_fkey(display_name)"
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: true })
    .limit(100);
  return (data ?? []) as unknown as TaskEventRow[];
}

/** AI rate limit (FR-006): generations by this user in the trailing hour. */
export async function countRecentGenerations(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase
    .from("task_events")
    .select("id", { count: "exact", head: true })
    .eq("actor_id", userId)
    .eq("event_type", "steps_generated")
    .gte("created_at", oneHourAgo);
  return count ?? 0;
}

export async function logSystemEvent(
  admin: SupabaseClient,
  orgId: string,
  taskId: string | null,
  eventType: EventType,
  payload: EventPayload = {}
): Promise<void> {
  const { error } = await admin.from("task_events").insert({
    org_id: orgId,
    task_id: taskId,
    actor_id: null,
    event_type: eventType,
    payload,
  });
  if (error) {
    console.error(`logSystemEvent(${eventType}) failed:`, error.message);
  }
}
