"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import clsx from "clsx";
import type { Task, TaskStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import TaskCard from "@/components/TaskCard";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  isOver?: boolean;
  onTaskClick?: (task: Task) => void;
  onAddTask?: () => void;
}

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  todo: "bg-text-tertiary",
  in_progress: "bg-info",
  in_review: "bg-warning",
  done: "bg-success",
};

const COLUMN_COUNT_COLOR: Record<TaskStatus, string> = {
  todo: "text-text-tertiary bg-surface",
  in_progress: "text-info bg-surface",
  in_review: "text-warning bg-surface",
  done: "text-success bg-surface",
};

export default function KanbanColumn({ status, tasks, isOver, onTaskClick, onAddTask }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: status });

  const taskIds = tasks.map((t) => t.id);

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-1">
      {/* Column header */}
      <div className="flex items-center gap-3 mb-3 px-1">
        {/* Status dot */}
        <div className={clsx("w-2 h-2 rounded-full shrink-0", COLUMN_ACCENT[status])} />
        <h2 className="text-sm font-semibold text-text-primary flex-1 tracking-wide uppercase">
          {STATUS_LABELS[status]}
        </h2>
        {/* Task count badge */}
        <span
          className={clsx(
            "text-xs font-semibold px-2 py-0.5 rounded-full border border-border",
            COLUMN_COUNT_COLOR[status]
          )}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={clsx(
          "flex-1 flex flex-col gap-2.5 rounded-xl p-2 min-h-[200px] transition-colors duration-150",
          isOver
            ? "bg-accent-muted border border-dashed border-accent"
            : "bg-surface border border-border-subtle"
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-text-tertiary">
              {isOver ? "Drop here" : "No tasks"}
            </p>
          </div>
        )}

        {/* Add task button */}
        {status === "todo" && onAddTask && (
          <button
            onClick={onAddTask}
            className="flex items-center gap-2 px-3 py-2 text-xs text-text-tertiary hover:text-text-secondary hover:bg-surface-hover rounded-lg transition-colors mt-1"
          >
            <Plus size={14} />
            업무 추가
          </button>
        )}
      </div>
    </div>
  );
}
