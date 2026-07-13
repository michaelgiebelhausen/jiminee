// .me habit check-off — one tap on the Daily Commitments strip.
// Idempotent per day (unique task_id+completed_on); returns the fresh streak.

import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logTaskEvent } from "@/lib/events";
import { getPersonalWorkspace } from "@/lib/me/workspace";
import { localClock } from "@/lib/me/escalation";
import { computeStreak, type Recurrence } from "@/lib/me/streaks";

const Body = z.object({ taskId: z.string().uuid() });

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const ws = await getPersonalWorkspace(supabase);
  if (!ws) return NextResponse.json({ error: "No personal workspace" }, { status: 404 });

  const { data: habit } = await supabase
    .from("tasks")
    .select("id, org_id, title, task_type, recurrence")
    .eq("id", parsed.data.taskId)
    .eq("org_id", ws.orgId)
    .eq("task_type", "habit")
    .maybeSingle();
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { todayIso } = localClock(new Date(), ws.timezone);

  const { error: insertError } = await supabase.from("habit_completions").insert({
    org_id: ws.orgId,
    task_id: habit.id,
    user_id: user.id,
    completed_on: todayIso,
  });
  // 23505 = already checked today — friendly no-op, still report the streak.
  const alreadyDone = insertError?.code === "23505";
  if (insertError && !alreadyDone) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: completions } = await supabase
    .from("habit_completions")
    .select("completed_on")
    .eq("task_id", habit.id)
    .order("completed_on", { ascending: false })
    .limit(120);

  const streak = computeStreak(
    (completions ?? []).map((c) => c.completed_on as string),
    todayIso,
    (habit.recurrence ?? "daily") as Recurrence
  );

  if (!alreadyDone) {
    await supabase
      .from("tasks")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", habit.id);
    await logTaskEvent(supabase, ws.orgId, habit.id, "habit_completed", {
      date: todayIso,
      streak: streak.current,
    });
  }

  return NextResponse.json({ streak: streak.current, doneToday: true, alreadyDone });
}
