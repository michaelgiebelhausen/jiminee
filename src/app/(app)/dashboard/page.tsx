import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardView, type DashboardData } from "@/components/features/dashboard/DashboardView";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: membership } = await supabase
    .from("memberships")
    .select("role, org_id, organizations(baseline_tasks_per_week)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/no-membership");
  if (!["manager", "administrator"].includes(membership.role)) redirect("/board");

  const orgId = membership.org_id;
  const baseline =
    (membership.organizations as unknown as { baseline_tasks_per_week: number | null } | null)
      ?.baseline_tasks_per_week ?? null;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  weekStart.setHours(0, 0, 0, 0);

  const [{ data: metrics }, { data: workers }, { data: exceptions }, { data: openDisputes }] =
    await Promise.all([
      supabase
        .from("gate_metrics_weekly")
        .select("*")
        .eq("org_id", orgId)
        .order("week", { ascending: false })
        .limit(6),
      supabase.from("worker_activity").select("*").eq("org_id", orgId),
      supabase
        .from("nudges")
        .select("id, status, sent_at, channel, tasks(id, title), users(display_name)")
        .eq("org_id", orgId)
        .in("status", ["sent", "expired"])
        .order("sent_at", { ascending: false })
        .limit(10),
      supabase
        .from("disputes")
        .select("id, task_id, reason, tasks(title)")
        .eq("org_id", orgId)
        .eq("status", "open"),
    ]);

  const thisWeek = (metrics ?? []).find((m) => new Date(m.week) >= weekStart);
  const completed = thisWeek?.tasks_completed ?? 0;
  const chased = Math.min(thisWeek?.tasks_chased ?? 0, completed);

  const data: DashboardData = {
    baseline,
    tasksCreatedThisWeek: thisWeek?.tasks_created ?? 0,
    pctWithoutChase: completed > 0 ? Math.round(((completed - chased) / completed) * 100) : null,
    completedThisWeek: completed,
    workers: (workers ?? []).map((w) => ({
      name: w.display_name as string,
      completed: Number(w.completed ?? 0),
      inProgress: Number(w.in_progress ?? 0),
      avgMinutes: w.avg_minutes_to_done ? Math.round(Number(w.avg_minutes_to_done)) : null,
    })),
    exceptions: (exceptions ?? []).map((n) => ({
      id: n.id as string,
      status: n.status as string,
      channel: n.channel as string,
      sentAt: n.sent_at as string,
      taskId: (n.tasks as unknown as { id: string } | null)?.id ?? "",
      taskTitle: (n.tasks as unknown as { title: string } | null)?.title ?? "(removed)",
      worker: (n.users as unknown as { display_name: string } | null)?.display_name ?? "",
    })),
    openDisputes: (openDisputes ?? []).map((d) => ({
      id: d.id as string,
      taskId: d.task_id as string,
      taskTitle: (d.tasks as unknown as { title: string } | null)?.title ?? "(removed)",
      reason: d.reason as string,
    })),
    isAdmin: membership.role === "administrator",
  };

  return <DashboardView data={data} />;
}
