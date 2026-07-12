import type { SupabaseClient } from "@supabase/supabase-js";

export type TaskStatus = "backlog" | "todo" | "doing" | "blocked" | "done";

export const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "backlog", label: "Backlog" },
  { status: "todo", label: "To Do" },
  { status: "doing", label: "Doing" },
  { status: "blocked", label: "Blocked / Flagged" },
  { status: "done", label: "Done" },
];

export type BoardTask = {
  id: string;
  org_id: string;
  board_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: "low" | "normal" | "high";
  due_at: string | null;
  estimated_minutes: number | null;
  location: string | null;
  created_by: string;
  assignee_id: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  last_activity_at: string | null;
  sort_order: number;
  created_at: string;
  assignee: { display_name: string } | null;
  steps_done?: number;
  steps_total?: number;
};

const TASK_SELECT = "*, assignee:users!tasks_assignee_id_fkey(display_name)";

export async function fetchBoard(supabase: SupabaseClient) {
  const { data: board } = await supabase
    .from("boards")
    .select("id, org_id, name")
    .limit(1)
    .maybeSingle();
  if (!board) return null;

  const { data: tasks } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("board_id", board.id)
    .order("sort_order", { ascending: true });

  return { board, tasks: (tasks ?? []) as unknown as BoardTask[] };
}

export async function fetchTask(supabase: SupabaseClient, taskId: string) {
  const { data } = await supabase.from("tasks").select(TASK_SELECT).eq("id", taskId).maybeSingle();
  return (data as unknown as BoardTask) ?? null;
}

// task_events reads live in @/lib/events (the single module allowed to touch that table).
