import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BriefForm } from "@/components/features/admin/BriefForm";
import { DisputeQueue, type DisputeItem, type WorkerOption } from "@/components/features/admin/DisputeQueue";
import { OrgSettings } from "@/components/features/admin/OrgSettings";
import type { WorkplaceBrief } from "@/lib/brief";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: membership } = await supabase
    .from("memberships")
    .select(
      "role, org_id, organizations(name, workplace_brief, brief_completed_at, baseline_tasks_per_week, quiet_hours_start, quiet_hours_end)"
    )
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/no-membership");
  if (membership.role !== "administrator") redirect("/board");

  const org = membership.organizations as unknown as {
    name: string;
    workplace_brief: WorkplaceBrief;
    brief_completed_at: string | null;
    baseline_tasks_per_week: number | null;
    quiet_hours_start: number;
    quiet_hours_end: number;
  };

  const [{ data: disputeRows }, { data: workerRows }] = await Promise.all([
    supabase
      .from("disputes")
      .select("id, reason, created_at, task_id, tasks(title), raiser:users!disputes_raised_by_fkey(display_name)")
      .eq("status", "open")
      .order("created_at", { ascending: true }),
    supabase
      .from("memberships")
      .select("user_id, users!memberships_user_id_fkey(display_name)")
      .eq("org_id", membership.org_id)
      .eq("role", "worker"),
  ]);

  const disputes: DisputeItem[] = (disputeRows ?? []).map((d) => ({
    id: d.id,
    reason: d.reason,
    created_at: d.created_at,
    task_id: d.task_id,
    task_title: (d.tasks as unknown as { title: string } | null)?.title ?? "(removed)",
    raised_by_name:
      (d.raiser as unknown as { display_name: string } | null)?.display_name ?? "Someone",
  }));

  const workers: WorkerOption[] = (workerRows ?? []).map((w) => ({
    id: w.user_id,
    name: (w.users as unknown as { display_name: string } | null)?.display_name ?? "Worker",
  }));

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16 md:px-8">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Admin</h1>
      <p className="mt-1 text-ink-secondary">{org.name}</p>

      <section className="mt-6">
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Workplace brief
        </h2>
        <BriefForm
          orgId={membership.org_id}
          initialBrief={org.workplace_brief ?? {}}
          completedAt={org.brief_completed_at}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Open disputes
        </h2>
        <DisputeQueue disputes={disputes} workers={workers} />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Organization settings
        </h2>
        <OrgSettings
          orgId={membership.org_id}
          initialName={org.name}
          initialBaseline={org.baseline_tasks_per_week}
          initialQuietStart={org.quiet_hours_start}
          initialQuietEnd={org.quiet_hours_end}
        />
      </section>
    </main>
  );
}
