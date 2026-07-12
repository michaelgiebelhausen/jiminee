import Link from "next/link";
import { format } from "date-fns";

export type DashboardData = {
  baseline: number | null;
  tasksCreatedThisWeek: number;
  completedThisWeek: number;
  pctWithoutChase: number | null;
  workers: { name: string; completed: number; inProgress: number; avgMinutes: number | null }[];
  exceptions: {
    id: string;
    status: string;
    channel: string;
    sentAt: string;
    taskId: string;
    taskTitle: string;
    worker: string;
  }[];
  openDisputes: { id: string; taskId: string; taskTitle: string; reason: string }[];
  isAdmin: boolean;
};

// Exceptions and gate metrics at a glance — designed to be glanced at, not lived in.
// Factual and neutral: events, counts, timestamps. No scores on people (design § Don'ts).
export function DashboardView({ data }: { data: DashboardData }) {
  return (
    <main className="mx-auto max-w-4xl px-5 pb-16 md:px-8">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Dashboard</h1>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-line bg-surface p-6 shadow-rest">
          <div className="font-display text-4xl font-extrabold">{data.tasksCreatedThisWeek}</div>
          <p className="mt-1 text-[13px] text-ink-secondary">
            tasks delegated this week
            {data.baseline !== null ? (
              <> (baseline {data.baseline}/week)</>
            ) : (
              <>
                {" "}
                —{" "}
                {data.isAdmin ? (
                  <Link href="/admin" className="underline underline-offset-2">
                    set the baseline
                  </Link>
                ) : (
                  "baseline not set"
                )}
              </>
            )}
          </p>
        </div>
        <div className="rounded-md border border-line bg-surface p-6 shadow-rest">
          <div className="font-display text-4xl font-extrabold">
            {data.pctWithoutChase !== null ? `${data.pctWithoutChase}%` : "—"}
          </div>
          <p className="mt-1 text-[13px] text-ink-secondary">
            of this week&apos;s {data.completedThisWeek} completed tasks needed no chase (gate: 80%)
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Exceptions — the only list worth your attention
        </h2>
        {data.openDisputes.length === 0 && data.exceptions.length === 0 ? (
          <p className="rounded-md border border-line bg-surface p-5 text-center text-sm italic text-ink-muted">
            Nothing needs you. The board is quiet — that&apos;s the point.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.openDisputes.map((d) => (
              <Link
                key={d.id}
                href={`/task/${d.taskId}`}
                className="rounded-md border border-error/30 bg-error-soft px-4 py-3 text-sm hover:shadow-rest"
              >
                <b className="text-error">Open dispute:</b> {d.taskTitle} — &ldquo;{d.reason}&rdquo;
              </Link>
            ))}
            {data.exceptions.map((n) => (
              <Link
                key={n.id}
                href={`/task/${n.taskId}`}
                className="rounded-md border border-line bg-surface px-4 py-3 text-sm hover:shadow-rest"
              >
                <b>{n.status === "expired" ? "Unanswered nudge" : "Nudge pending"}:</b> {n.worker},
                &ldquo;{n.taskTitle}&rdquo; · {n.channel} · {format(new Date(n.sentAt), "MMM d, p")}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Workers
        </h2>
        {data.workers.length === 0 ? (
          <p className="rounded-md border border-line bg-surface p-5 text-center text-sm italic text-ink-muted">
            No claimed tasks yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-line bg-surface shadow-rest">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  <th className="px-4 py-2.5">Worker</th>
                  <th className="px-4 py-2.5">Done</th>
                  <th className="px-4 py-2.5">In progress</th>
                  <th className="px-4 py-2.5">Avg time to done</th>
                </tr>
              </thead>
              <tbody>
                {data.workers.map((w) => (
                  <tr key={w.name} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5 font-semibold">{w.name}</td>
                    <td className="px-4 py-2.5">{w.completed}</td>
                    <td className="px-4 py-2.5">{w.inProgress}</td>
                    <td className="px-4 py-2.5">{w.avgMinutes !== null ? `${w.avgMinutes} min` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
