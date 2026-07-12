import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchTask } from "@/lib/board/queries";
import { fetchTaskEvents } from "@/lib/events";
import { TaskHeader } from "@/components/features/task/TaskHeader";
import { ActivityLog } from "@/components/features/task/ActivityLog";
import { TellMeHow, type Step } from "@/components/features/task/TellMeHow";
import { CardChat } from "@/components/features/task/CardChat";
import { CorrectionBanner, type CorrectionRow } from "@/components/features/task/CorrectionBanner";
import type { Role } from "@/lib/permissions";
import { can } from "@/lib/permissions";

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/task/${id}`);

  const { data: membership } = await supabase
    .from("memberships")
    .select("role, org_id, organizations(brief_completed_at)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/no-membership");
  const role = membership.role as Role;
  const briefCompleted = Boolean(
    (membership.organizations as unknown as { brief_completed_at: string | null } | null)
      ?.brief_completed_at
  );

  const task = await fetchTask(supabase, id);

  if (!task) {
    return (
      <main className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="font-display text-xl font-bold">This task was removed</h1>
        <p className="mt-2 text-ink-secondary">It&apos;s no longer on the board.</p>
        <Link href="/board" className="mt-4 inline-block font-bold text-primary underline underline-offset-2">
          Back to the board
        </Link>
      </main>
    );
  }

  const [{ data: stepRows }, { data: msgRows }, events] = await Promise.all([
    supabase
      .from("task_steps")
      .select("id, step_number, content, checked_at, generation_id")
      .eq("task_id", id)
      .order("step_number"),
    supabase
      .from("task_messages")
      .select("role, content")
      .eq("task_id", id)
      .order("created_at", { ascending: true }),
    fetchTaskEvents(supabase, id),
  ]);

  const allSteps = (stepRows ?? []) as Step[];
  const latestGen = allSteps[allSteps.length - 1]?.generation_id;
  const steps = allSteps.filter((s) => s.generation_id === latestGen);

  let corrections: CorrectionRow[] = [];
  if (can(role, "resolveCorrection")) {
    const { data } = await supabase
      .from("instruction_corrections")
      .select("id, flag_note, correction")
      .eq("task_id", id)
      .order("created_at", { ascending: false });
    corrections = (data ?? []) as CorrectionRow[];
  }

  return (
    <main className="mx-auto max-w-2xl pb-16">
      <div className="px-5 pt-2 md:px-8">
        <Link href="/board" className="text-sm font-semibold text-ink-secondary hover:text-primary">
          ← Board
        </Link>
      </div>

      <TaskHeader task={task} role={role} userId={user.id} />

      <section className="px-5 py-5 md:px-8">
        {corrections.length > 0 && <CorrectionBanner corrections={corrections} />}
        <TellMeHow
          taskId={id}
          orgId={task.org_id}
          initialSteps={steps}
          isAssignee={task.assignee_id === user.id}
          briefCompleted={briefCompleted}
          userId={user.id}
        />
      </section>

      <section className="px-5 pb-5 md:px-8">
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Ask Jiminee
        </h2>
        <CardChat
          taskId={id}
          initialMessages={(msgRows ?? []) as { role: "user" | "assistant"; content: string }[]}
        />
      </section>

      <section className="px-5 md:px-8">
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Activity
        </h2>
        <ActivityLog events={events} />
      </section>
    </main>
  );
}
