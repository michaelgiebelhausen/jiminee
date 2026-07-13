// /today — the .me home: daily ritual, habit strip with streaks, today's
// committed picks, and the focus bar. First visit creates the personal
// workspace (idempotent RPC), so this page IS the .me onboarding.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensurePersonalWorkspace } from "@/lib/me/workspace";
import { localClock } from "@/lib/me/escalation";
import { computeStreak, isDueOn, type Recurrence } from "@/lib/me/streaks";
import { proposeToday, type RitualTask } from "@/lib/me/ritual";
import { TodayClient, type HabitVM, type MeTaskVM } from "@/components/features/me/TodayClient";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/today");

  const ws = await ensurePersonalWorkspace(supabase);
  if (!ws) redirect("/no-membership");

  const now = new Date();
  const { todayIso } = localClock(now, ws.timezone);

  const { data: tasks } = await supabase
    .from("tasks")
    .select(
      "id, org_id, title, status, task_type, recurrence, priority, due_at, committed_on, last_activity_at"
    )
    .eq("org_id", ws.orgId)
    .or(`status.neq.done,committed_on.eq.${todayIso}`)
    .order("sort_order", { ascending: true });

  const all = tasks ?? [];
  const habits = all.filter((t) => t.task_type === "habit");
  const nonHabits = all.filter((t) => t.task_type !== "habit");

  // Streaks for the Daily Commitments strip.
  let habitVMs: HabitVM[] = [];
  if (habits.length > 0) {
    const { data: completions } = await supabase
      .from("habit_completions")
      .select("task_id, completed_on")
      .in(
        "task_id",
        habits.map((h) => h.id)
      )
      .order("completed_on", { ascending: false })
      .limit(1000);
    habitVMs = habits.map((h) => {
      const rec = (h.recurrence ?? "daily") as Recurrence;
      const mine = (completions ?? [])
        .filter((c) => c.task_id === h.id)
        .map((c) => c.completed_on as string);
      const streak = computeStreak(mine, todayIso, rec);
      return {
        id: h.id,
        org_id: h.org_id,
        title: h.title,
        recurrence: rec,
        dueToday: isDueOn(todayIso, rec),
        streak: streak.current,
        doneToday: streak.doneToday,
      };
    });
  }

  const proposal = proposeToday(nonHabits as RitualTask[], todayIso, now.getTime());

  // The open focus session, if one survived a reload.
  const { data: openSession } = await supabase
    .from("focus_sessions")
    .select("id, task_id")
    .eq("user_id", user.id)
    .is("ended_at", null)
    .limit(1)
    .maybeSingle();

  const { data: settings } = await supabase
    .from("me_settings")
    .select("nudge_intensity")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <TodayClient
      todayIso={todayIso}
      habits={habitVMs}
      committed={proposal.alreadyCommitted as MeTaskVM[]}
      proposed={proposal.picks as MeTaskVM[]}
      openSession={openSession ? { id: openSession.id, taskId: openSession.task_id } : null}
      intensity={(settings?.nudge_intensity as string) ?? "warm"}
    />
  );
}
