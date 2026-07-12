"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { BoardTask } from "@/lib/board/queries";
import { format, isPast } from "date-fns";

function initials(name: string | undefined | null) {
  if (!name) return "—";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TaskCardBody({
  task,
  onClaim,
  canClaim,
  claiming,
}: {
  task: BoardTask;
  onClaim?: (task: BoardTask) => void;
  canClaim: boolean;
  claiming?: boolean;
}) {
  const due = task.due_at ? new Date(task.due_at) : null;
  const ring =
    task.steps_total && task.steps_total > 0
      ? { pct: (task.steps_done ?? 0) / task.steps_total, label: `${task.steps_done}/${task.steps_total}` }
      : null;

  return (
    <div
      data-testid="task-card"
      className={`rounded-md border border-line bg-surface p-3.5 shadow-rest transition-shadow hover:shadow-raised ${
        task.status === "done" ? "opacity-75" : ""
      }`}
    >
      <Link href={`/task/${task.id}`} className="block">
        <div className="mb-2 text-[15px] font-bold leading-snug">{task.title}</div>
      </Link>
      <div className="flex flex-wrap items-center gap-1.5">
        {task.priority === "high" && (
          <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-warning">
            High
          </span>
        )}
        {task.status === "blocked" && (
          <span className="rounded-full bg-error-soft px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-error">
            Disputed
          </span>
        )}
        {due && (
          <span
            className={`rounded-full border border-dashed px-2 py-0.5 text-[11px] font-semibold ${
              isPast(due) && task.status !== "done"
                ? "border-error text-error"
                : "border-line-strong text-ink-secondary"
            }`}
          >
            {format(due, "MMM d, p")}
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          {ring && (
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#0D6036 ${ring.pct * 360}deg, #F3ECE9 0)`,
              }}
              aria-label={`${ring.label} steps done`}
            >
              <i className="flex h-5 w-5 items-center justify-center rounded-full bg-surface text-[8.5px] font-bold not-italic">
                {ring.label}
              </i>
            </span>
          )}
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full border border-line-strong bg-accent-soft text-[10px] font-bold"
            title={task.assignee?.display_name ?? "Unassigned"}
          >
            {initials(task.assignee?.display_name)}
          </span>
        </span>
      </div>
      {canClaim && onClaim && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onClaim(task);
          }}
          disabled={claiming}
          className="mt-2.5 w-full rounded-sm border border-line-strong bg-surface py-1.5 text-[13px] font-bold text-primary transition-colors hover:bg-success-soft disabled:text-ink-muted"
        >
          {claiming ? "Claiming…" : "Claim this task"}
        </button>
      )}
    </div>
  );
}

export function SortableTaskCard(props: {
  task: BoardTask;
  draggable: boolean;
  onClaim?: (task: BoardTask) => void;
  canClaim: boolean;
  claiming?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.task.id,
    disabled: !props.draggable,
  });

  // Spread dnd attributes only when draggable: aria-disabled from a disabled
  // sortable would make descendants (the Claim button) read as disabled.
  const dndProps = props.draggable ? { ...attributes, ...listeners } : {};

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-40" : ""}
      {...dndProps}
    >
      <TaskCardBody {...props} />
    </div>
  );
}
