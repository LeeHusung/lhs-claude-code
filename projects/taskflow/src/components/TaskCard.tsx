"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Calendar, AlertCircle } from "lucide-react";
import clsx from "clsx";
import type { Task, Priority } from "@/lib/types";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const PRIORITY_BAR_COLOR: Record<Priority, string> = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
};

const PRIORITY_TEXT_COLOR: Record<Priority, string> = {
  high: "text-priority-high",
  medium: "text-priority-medium",
  low: "text-priority-low",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  high: "High",
  medium: "Med",
  low: "Low",
};

function isOverdue(dueDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function isDueSoon(dueDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffMs = due.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 2;
}

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < 0) return `${Math.abs(diffDays)}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div
      className="bg-surface-raised border border-accent rounded-xl shadow-2xl shadow-black/50 cursor-grabbing select-none opacity-95 rotate-2"
      style={{ width: "100%" }}
    >
      <div className="p-4">
        <div className={clsx("w-1 h-full absolute left-0 top-0 rounded-l-xl", PRIORITY_BAR_COLOR[task.priority])} />
        <div className="pl-3">
          <p className="text-sm font-medium text-text-primary leading-snug line-clamp-2">{task.title}</p>
        </div>
      </div>
    </div>
  );
}

export default function TaskCard({ task, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dueSoon = task.due_date ? isDueSoon(task.due_date) : false;
  const overdue = task.due_date ? isOverdue(task.due_date) : false;

  if (isSortableDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-surface-raised border border-border border-dashed rounded-xl h-[100px] opacity-40"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group relative bg-surface-raised border rounded-xl cursor-default select-none transition-all duration-150",
        isDragging
          ? "border-accent shadow-lg shadow-black/30"
          : "border-border hover:border-border hover:bg-surface-hover",
        (dueSoon || overdue) && !isDragging && "border-l-2 border-l-warning"
      )}
    >
      {/* Priority color bar */}
      <div
        className={clsx(
          "absolute left-0 top-3 bottom-3 w-[3px] rounded-full",
          PRIORITY_BAR_COLOR[task.priority]
        )}
      />

      <div className="pl-4 pr-3 py-3">
        {/* Drag handle + title row */}
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 shrink-0 text-text-tertiary hover:text-text-secondary cursor-grab active:cursor-grabbing transition-colors opacity-0 group-hover:opacity-100"
            tabIndex={-1}
          >
            <GripVertical size={14} />
          </button>
          <p className="flex-1 text-sm font-medium text-text-primary leading-snug line-clamp-2">
            {task.title}
          </p>
        </div>

        {/* Footer row: priority + assignee + due date */}
        <div className="flex items-center justify-between mt-3 gap-2">
          {/* Priority badge */}
          <span
            className={clsx(
              "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-surface border border-border",
              PRIORITY_TEXT_COLOR[task.priority]
            )}
          >
            {PRIORITY_LABEL[task.priority]}
          </span>

          <div className="flex items-center gap-2">
            {/* Due date */}
            {task.due_date && (
              <div
                className={clsx(
                  "flex items-center gap-1 text-[11px]",
                  overdue
                    ? "text-danger"
                    : dueSoon
                    ? "text-warning"
                    : "text-text-tertiary"
                )}
              >
                {(overdue || dueSoon) && <AlertCircle size={10} />}
                {!overdue && !dueSoon && <Calendar size={10} />}
                <span className="font-medium">{formatDueDate(task.due_date)}</span>
              </div>
            )}

            {/* Assignee avatar */}
            {task.assignee && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-canvas shrink-0 ring-2 ring-surface-raised"
                style={{ backgroundColor: task.assignee.avatar_color }}
                title={task.assignee.name}
              >
                {task.assignee.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
