"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { createClient } from "@/lib/supabase/browser";
import { COLUMNS, fetchBoard, type BoardTask, type TaskStatus } from "@/lib/board/queries";
import { createTask, moveTask, claimTask } from "@/lib/board/mutations";
import { sortBetween } from "@/lib/board/sort";
import { useRealtimeBoard } from "@/hooks/useRealtimeBoard";
import { can, type Role } from "@/lib/permissions";
import { track } from "@/lib/analytics";
import { BoardColumn } from "./BoardColumn";
import { TaskCardBody } from "./TaskCard";
import { NewCardComposer, type NewCardValues } from "./NewCardComposer";

export function BoardClient({
  initialTasks,
  boardId,
  orgId,
  role,
  userId,
}: {
  initialTasks: BoardTask[];
  boardId: string;
  orgId: string;
  role: Role;
  userId: string;
}) {
  const [tasks, setTasks] = useState<BoardTask[]>(initialTasks);
  const [dragging, setDragging] = useState<BoardTask | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const isManager = can(role, "editAnyTask");
  const isWorker = role === "worker";

  const refetch = useCallback(async () => {
    const data = await fetchBoard(supabase);
    if (data) setTasks(data.tasks);
  }, [supabase]);

  useRealtimeBoard(orgId, refetch);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  const byColumn = useMemo(() => {
    const map = new Map<TaskStatus, BoardTask[]>();
    for (const { status } of COLUMNS) map.set(status, []);
    for (const t of [...tasks].sort((a, b) => a.sort_order - b.sort_order)) {
      map.get(t.status)?.push(t);
    }
    return map;
  }, [tasks]);

  const canDragTask = useCallback(
    (t: BoardTask) => isManager || (isWorker && t.assignee_id === userId),
    [isManager, isWorker, userId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragStart(e: DragStartEvent) {
    setDragging(tasks.find((t) => t.id === e.active.id) ?? null);
  }

  async function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    const { active, over } = e;
    if (!over) return;

    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;

    // Target column: either a column droppable ("col-<status>") or another task's column.
    let toStatus: TaskStatus;
    let overTaskId: string | null = null;
    const overId = String(over.id);
    if (overId.startsWith("col-")) {
      toStatus = overId.slice(4) as TaskStatus;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;
      toStatus = overTask.status;
      overTaskId = overTask.id;
    }

    const column = (byColumn.get(toStatus) ?? []).filter((t) => t.id !== task.id);
    let newSort: number;
    if (overTaskId) {
      const idx = column.findIndex((t) => t.id === overTaskId);
      const prev = idx > 0 ? column[idx - 1].sort_order : null;
      newSort = sortBetween(prev, column[idx]?.sort_order ?? null);
    } else {
      const last = column[column.length - 1];
      newSort = sortBetween(last?.sort_order ?? null, null);
    }

    const fromStatus = task.status;
    if (fromStatus === toStatus && Math.abs(newSort - task.sort_order) < 1e-12) return;

    // Optimistic move with rollback (PRD edge case: network drop mid-drag).
    const before = tasks;
    setTasks((ts) =>
      ts.map((t) => (t.id === task.id ? { ...t, status: toStatus, sort_order: newSort } : t))
    );
    try {
      await moveTask(supabase, task, fromStatus, toStatus, newSort);
    } catch {
      setTasks(before);
      showToast("That move didn't stick — the board is back the way it was.");
    }
  }

  async function onClaim(task: BoardTask) {
    setClaimingId(task.id);
    try {
      const { won } = await claimTask(supabase, task, userId);
      if (won) track("claimed");
      else showToast("Already claimed — someone got there first.");
      await refetch();
    } catch {
      showToast("Couldn't claim the card — give it another tap.");
    } finally {
      setClaimingId(null);
    }
  }

  async function onCreate(v: NewCardValues) {
    const todo = byColumn.get("todo") ?? [];
    const sortOrder = sortBetween(todo[todo.length - 1]?.sort_order ?? null, null);
    await createTask(supabase, userId, {
      orgId,
      boardId,
      title: v.title,
      description: v.description,
      priority: v.priority,
      dueAt: v.dueAt,
      estimatedMinutes: v.estimatedMinutes,
      location: v.location,
      status: "todo",
      sortOrder,
    });
    track("card_created");
    await refetch();
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="flex h-[calc(100vh-64px)] gap-3 overflow-x-auto px-4 pb-6 md:px-6">
          {COLUMNS.map(({ status, label }) => (
            <BoardColumn
              key={status}
              status={status}
              label={label}
              tasks={byColumn.get(status) ?? []}
              isWorker={isWorker}
              canDragTask={canDragTask}
              onClaim={onClaim}
              claimingId={claimingId}
            />
          ))}
        </div>
        <DragOverlay>
          {dragging && (
            <div className="rotate-[-2deg]">
              <TaskCardBody task={dragging} canClaim={false} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {can(role, "createTask") && <NewCardComposer onCreate={onCreate} />}

      {toast && (
        <div className="fixed bottom-6 left-6 z-30 rounded-md bg-ink px-4 py-3 text-sm text-background shadow-raised">
          {toast}
        </div>
      )}
    </>
  );
}
