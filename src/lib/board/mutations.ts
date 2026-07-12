import type { SupabaseClient } from "@supabase/supabase-js";
import { logTaskEvent } from "@/lib/events";
import type { TaskStatus } from "@/lib/board/queries";

export type CreateTaskInput = {
  orgId: string;
  boardId: string;
  title: string;
  description?: string;
  priority?: "low" | "normal" | "high";
  dueAt?: string | null;
  estimatedMinutes?: number | null;
  location?: string | null;
  status?: TaskStatus;
  sortOrder: number;
};

export async function createTask(supabase: SupabaseClient, userId: string, input: CreateTaskInput) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      org_id: input.orgId,
      board_id: input.boardId,
      title: input.title,
      description: input.description || null,
      priority: input.priority ?? "normal",
      due_at: input.dueAt ?? null,
      estimated_minutes: input.estimatedMinutes ?? null,
      location: input.location || null,
      status: input.status ?? "todo",
      created_by: userId,
      sort_order: input.sortOrder,
    })
    .select("id")
    .single();
  if (error) throw error;
  await logTaskEvent(supabase, input.orgId, data.id, "created", { title: input.title });
  return data.id as string;
}

export async function moveTask(
  supabase: SupabaseClient,
  task: { id: string; org_id: string },
  from: TaskStatus,
  to: TaskStatus,
  sortOrder: number
) {
  const patch: Record<string, unknown> = { status: to, sort_order: sortOrder };
  if (to === "done" && from !== "done") patch.completed_at = new Date().toISOString();
  const { error } = await supabase.from("tasks").update(patch).eq("id", task.id);
  if (error) throw error;
  await logTaskEvent(supabase, task.org_id, task.id, "moved", { from, to });
  if (to === "done" && from !== "done") {
    await logTaskEvent(supabase, task.org_id, task.id, "completed");
  }
}

/** Conditional claim — single winner under concurrency (PRD edge case). */
export async function claimTask(
  supabase: SupabaseClient,
  task: { id: string; org_id: string },
  userId: string
): Promise<{ won: boolean }> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("tasks")
    .update({
      assignee_id: userId,
      status: "doing",
      claimed_at: now,
      last_activity_at: now,
    })
    .eq("id", task.id)
    .is("assignee_id", null)
    .select("id");
  if (error) throw error;
  const won = (data ?? []).length > 0;
  if (won) await logTaskEvent(supabase, task.org_id, task.id, "claimed");
  return { won };
}

export async function releaseTask(supabase: SupabaseClient, task: { id: string; org_id: string }) {
  const { error } = await supabase
    .from("tasks")
    .update({ assignee_id: null, status: "todo", claimed_at: null })
    .eq("id", task.id);
  if (error) throw error;
  await logTaskEvent(supabase, task.org_id, task.id, "released");
}

export async function completeTask(supabase: SupabaseClient, task: { id: string; org_id: string }) {
  const { error } = await supabase
    .from("tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", task.id);
  if (error) throw error;
  await logTaskEvent(supabase, task.org_id, task.id, "completed");
}
