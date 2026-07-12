"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { claimTask, completeTask, releaseTask } from "@/lib/board/mutations";
import type { BoardTask } from "@/lib/board/queries";
import type { Role } from "@/lib/permissions";
import { formatDistanceToNow, format } from "date-fns";
import { DisputeButton } from "./DisputeModal";
import { ChaseButton } from "./ChaseButton";

const STATUS_LABEL: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  doing: "Doing",
  blocked: "Blocked / Flagged",
  done: "Done",
};

export function TaskHeader({
  task,
  role,
  userId,
}: {
  task: BoardTask;
  role: Role;
  userId: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAssignee = task.assignee_id === userId;
  const isManager = role === "manager" || role === "administrator";
  const canClaim = role === "worker" && !task.assignee_id && task.status !== "done";
  const canComplete = (isAssignee || isManager) && task.status !== "done";
  const canRelease = isAssignee && task.status === "doing";

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't stick — try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <header className="border-b border-line px-5 py-5 md:px-8">
      <div className="mb-2 text-[10.5px] font-bold uppercase tracking-wider text-ink-muted">
        {STATUS_LABEL[task.status]}
        {task.claimed_at &&
          ` · claimed ${formatDistanceToNow(new Date(task.claimed_at), { addSuffix: true })}`}
        {task.estimated_minutes && ` · est. ${task.estimated_minutes} min`}
      </div>
      <h1 className="font-display text-xl font-extrabold leading-snug tracking-tight md:text-2xl">
        {task.title}
      </h1>
      {task.description && <p className="mt-2 text-ink-secondary">{task.description}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-ink-secondary">
        {task.assignee && <span>Assigned to <b>{task.assignee.display_name}</b></span>}
        {task.due_at && <span>· due {format(new Date(task.due_at), "MMM d, p")}</span>}
        {task.location && <span>· {task.location}</span>}
      </div>

      {error && <p className="mt-3 rounded-sm bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {canClaim && (
          <button
            onClick={() =>
              run("claim", async () => {
                const { won } = await claimTask(supabase, task, userId);
                if (!won) throw new Error("Already claimed — someone got there first.");
              })
            }
            disabled={busy !== null}
            className="h-10 rounded-sm bg-primary px-5 font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
          >
            {busy === "claim" ? "Claiming…" : "Claim this task"}
          </button>
        )}
        {canComplete && (
          <button
            onClick={() => run("done", () => completeTask(supabase, task))}
            disabled={busy !== null}
            className="h-10 rounded-sm bg-primary px-5 font-bold text-on-primary hover:bg-primary-hover disabled:bg-line disabled:text-ink-muted"
          >
            {busy === "done" ? "Marking…" : "✓ Mark done"}
          </button>
        )}
        {role === "worker" && task.status !== "done" && task.status !== "blocked" && (
          <DisputeButton taskId={task.id} />
        )}
        {isManager && <ChaseButton taskId={task.id} />}
        {canRelease && (
          <button
            onClick={() => run("release", () => releaseTask(supabase, task))}
            disabled={busy !== null}
            className="h-10 rounded-sm border border-line-strong bg-surface px-5 font-bold text-ink-secondary hover:bg-surface-sunken disabled:text-ink-muted"
          >
            {busy === "release" ? "Releasing…" : "Drop the card"}
          </button>
        )}
      </div>
    </header>
  );
}
