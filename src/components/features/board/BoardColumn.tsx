"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { BoardTask, TaskStatus } from "@/lib/board/queries";
import { SortableTaskCard } from "./TaskCard";

const DOT: Record<TaskStatus, string> = {
  backlog: "bg-line-strong",
  todo: "bg-accent-soft outline outline-1 outline-line-strong",
  doing: "bg-primary",
  blocked: "bg-error",
  done: "bg-success",
};

const EMPTY: Record<TaskStatus, string> = {
  backlog: "Nothing waiting in the wings.",
  todo: "Nothing queued. Post a card — one sentence is enough.",
  doing: "Nobody's mid-task right now.",
  blocked: "No open disputes. The paper trail is quiet.",
  done: "Nothing finished yet — the day is young.",
};

export function BoardColumn({
  status,
  label,
  tasks,
  isWorker,
  canDragTask,
  onClaim,
  claimingId,
}: {
  status: TaskStatus;
  label: string;
  tasks: BoardTask[];
  isWorker: boolean;
  canDragTask: (t: BoardTask) => boolean;
  onClaim: (t: BoardTask) => void;
  claimingId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}` });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-[296px] min-w-[296px] flex-col gap-2.5 rounded-lg bg-surface-sunken p-3 ${
        isOver ? "ring-2 ring-primary/40" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-1.5">
        <span className={`h-2 w-2 rounded-full ${DOT[status]}`} />
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
          {label}
        </span>
        <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-[11px] font-bold text-ink-muted">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-16 flex-col gap-2.5">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              draggable={canDragTask(task)}
              canClaim={
                isWorker && !task.assignee_id && (status === "todo" || status === "backlog")
              }
              onClaim={onClaim}
              claiming={claimingId === task.id}
            />
          ))}
          {tasks.length === 0 && (
            <p className="px-3 py-5 text-center text-[13px] italic text-ink-muted">
              {EMPTY[status]}
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
