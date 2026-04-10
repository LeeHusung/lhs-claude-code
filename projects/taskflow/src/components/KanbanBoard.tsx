"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Loader2, RefreshCw } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { COLUMNS } from "@/lib/types";
import KanbanColumn from "@/components/KanbanColumn";
import TaskCard, { TaskCardOverlay } from "@/components/TaskCard";

type ColumnMap = Record<TaskStatus, Task[]>;

function groupByStatus(tasks: Task[]): ColumnMap {
  const map: ColumnMap = { todo: [], in_progress: [], in_review: [], done: [] };
  for (const task of tasks) {
    if (map[task.status]) {
      map[task.status].push(task);
    }
  }
  // Ensure sorted by position
  for (const col of COLUMNS) {
    map[col].sort((a, b) => a.position - b.position);
  }
  return map;
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState<ColumnMap>({
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumnId, setOverColumnId] = useState<TaskStatus | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to load tasks");
      const tasks: Task[] = await res.json();
      setColumns(groupByStatus(tasks));
    } catch {
      setError("업무를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  // Find which column a task id belongs to
  function findColumn(taskId: number): TaskStatus | undefined {
    for (const col of COLUMNS) {
      if (columns[col].some((t) => t.id === taskId)) return col;
    }
    return undefined;
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = active.data.current?.task as Task | undefined;
    if (task) setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }

    const activeId = active.id as number;
    const overId = over.id;

    // over could be a column id (string) or a task id (number)
    const overIsColumn = COLUMNS.includes(overId as TaskStatus);
    const targetColumn: TaskStatus | undefined = overIsColumn
      ? (overId as TaskStatus)
      : findColumn(overId as number);

    if (!targetColumn) {
      setOverColumnId(null);
      return;
    }

    setOverColumnId(targetColumn);

    const sourceColumn = findColumn(activeId);
    if (!sourceColumn || sourceColumn === targetColumn) return;

    // Move the card optimistically across columns
    setColumns((prev) => {
      const sourceTasks = [...prev[sourceColumn]];
      const targetTasks = [...prev[targetColumn]];
      const taskIndex = sourceTasks.findIndex((t) => t.id === activeId);
      if (taskIndex === -1) return prev;

      const [movedTask] = sourceTasks.splice(taskIndex, 1);
      const updatedTask = { ...movedTask, status: targetColumn };

      // Insert before the over element (if over is a task in target col)
      if (!overIsColumn) {
        const overIndex = targetTasks.findIndex((t) => t.id === (overId as number));
        if (overIndex !== -1) {
          targetTasks.splice(overIndex, 0, updatedTask);
        } else {
          targetTasks.push(updatedTask);
        }
      } else {
        targetTasks.push(updatedTask);
      }

      return {
        ...prev,
        [sourceColumn]: sourceTasks,
        [targetColumn]: targetTasks,
      };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    setOverColumnId(null);

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    const overIsColumn = COLUMNS.includes(overId as TaskStatus);
    const targetColumn: TaskStatus | undefined = overIsColumn
      ? (overId as TaskStatus)
      : findColumn(overId as number);

    if (!targetColumn) return;

    const sourceColumn = findColumn(activeId);
    if (!sourceColumn) return;

    // Handle same-column reorder
    if (sourceColumn === targetColumn && !overIsColumn) {
      setColumns((prev) => {
        const tasks = [...prev[sourceColumn]];
        const oldIndex = tasks.findIndex((t) => t.id === activeId);
        const newIndex = tasks.findIndex((t) => t.id === (overId as number));
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
        const reordered = arrayMove(tasks, oldIndex, newIndex);
        return { ...prev, [sourceColumn]: reordered };
      });
    }

    // Persist to server
    setSaving(true);
    try {
      // Get current state to determine positions
      setColumns((prev) => {
        const colTasks = prev[targetColumn];
        const taskIndex = colTasks.findIndex((t) => t.id === activeId);
        const newPosition = taskIndex !== -1 ? taskIndex : colTasks.length - 1;

        // Fire and forget the API call with the latest state
        fetch(`/api/tasks/${activeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: targetColumn, position: newPosition }),
        })
          .then(async (res) => {
            if (!res.ok) throw new Error("Save failed");
          })
          .catch(() => {
            // Revert on error
            fetchTasks();
          })
          .finally(() => {
            setSaving(false);
          });

        return prev;
      });
    } catch {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-secondary">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading tasks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-danger text-sm mb-3">{error}</p>
          <button
            onClick={fetchTasks}
            className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg border border-border hover:bg-surface-hover transition-colors mx-auto"
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-5 h-full">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={columns[status]}
            isOver={overColumnId === status}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-surface border border-border px-3 py-2 rounded-lg shadow-lg text-xs text-text-secondary">
          <Loader2 size={12} className="animate-spin" />
          Saving...
        </div>
      )}
    </DndContext>
  );
}
