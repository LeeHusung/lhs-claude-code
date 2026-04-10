"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Calendar,
  User,
  Flag,
  AlignLeft,
  CheckCircle2,
  Trash2,
  Save,
  Pencil,
  Loader2,
  ChevronDown,
} from "lucide-react";
import clsx from "clsx";
import {
  Task,
  User as UserType,
  TaskStatus,
  Priority,
  STATUS_LABELS,
  PRIORITY_LABELS,
} from "@/lib/types";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updated: Task) => void;
  onDelete: (taskId: number) => void;
}

const PRIORITY_STYLES: Record<Priority, string> = {
  high: "text-priority-high bg-priority-high/10 border-priority-high/30",
  medium: "text-priority-medium bg-priority-medium/10 border-priority-medium/30",
  low: "text-priority-low bg-priority-low/10 border-priority-low/30",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: "text-text-secondary bg-surface-raised border-border",
  in_progress: "text-info bg-info/10 border-info/30",
  in_review: "text-warning bg-warning/10 border-warning/30",
  done: "text-success bg-success/10 border-success/30",
};

function UserAvatar({ user, size = "sm" }: { user: UserType; size?: "sm" | "md" }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className={clsx(
        "rounded-full flex items-center justify-center font-semibold flex-shrink-0",
        size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"
      )}
      style={{ backgroundColor: user.avatar_color + "33", color: user.avatar_color }}
    >
      {initials}
    </div>
  );
}

export default function TaskDetailPanel({
  task,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailPanelProps) {
  const [visible, setVisible] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [assigneeId, setAssigneeId] = useState<number | null>(task.assignee_id);

  const panelRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Slide-in animation
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Fetch users
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {});
  }, []);

  // Track changes
  useEffect(() => {
    const changed =
      title !== task.title ||
      description !== (task.description ?? "") ||
      status !== task.status ||
      priority !== task.priority ||
      dueDate !== (task.due_date ?? "") ||
      assigneeId !== task.assignee_id;
    setHasChanges(changed);
  }, [title, description, status, priority, dueDate, assigneeId, task]);

  // ESC key handler
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showDeleteDialog) handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose, showDeleteDialog]);

  // Focus title input when editing
  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  // Focus description textarea when editing
  useEffect(() => {
    if (editingDescription) descriptionInputRef.current?.focus();
  }, [editingDescription]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const handleSave = async () => {
    if (!hasChanges || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          status,
          priority,
          due_date: dueDate || null,
          assignee_id: assigneeId,
        }),
      });
      if (!res.ok) throw new Error("저장 실패");
      const updated: Task = await res.json();
      setHasChanges(false);
      onUpdate(updated);
    } catch {
      // silently handle error; could add toast here
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("삭제 실패");
      setShowDeleteDialog(false);
      setVisible(false);
      setTimeout(() => onDelete(task.id), 300);
    } catch {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const assignedUser = users.find((u) => u.id === assigneeId) ?? task.assignee ?? null;

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className={clsx(
          "fixed inset-0 z-40 bg-canvas/60 backdrop-blur-sm transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`업무 상세: ${task.title}`}
        className={clsx(
          "fixed right-0 top-0 h-full z-50 w-full max-w-lg flex flex-col",
          "bg-surface border-l border-border shadow-2xl",
          "transition-transform duration-300 ease-out",
          visible ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={16} className="text-accent" />
            </div>
            <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              업무 상세
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors",
                  "bg-accent text-canvas hover:bg-accent-hover",
                  isSaving && "opacity-60 cursor-not-allowed"
                )}
              >
                {isSaving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Save size={13} />
                )}
                저장
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
              aria-label="패널 닫기"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Title */}
          <div>
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setEditingTitle(false);
                  if (e.key === "Escape") {
                    setTitle(task.title);
                    setEditingTitle(false);
                  }
                }}
                className={clsx(
                  "w-full text-xl font-bold text-text-primary bg-surface-raised",
                  "border border-accent/50 rounded-lg px-3 py-2 outline-none",
                  "focus:border-accent transition-colors"
                )}
              />
            ) : (
              <div
                className="group flex items-start gap-2 cursor-pointer"
                onClick={() => setEditingTitle(true)}
              >
                <h2 className="flex-1 text-xl font-bold text-text-primary leading-snug break-words">
                  {title}
                </h2>
                <Pencil
                  size={14}
                  className="mt-1 flex-shrink-0 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            )}
          </div>

          {/* Status & Priority row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                <CheckCircle2 size={12} />
                상태
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className={clsx(
                    "w-full appearance-none pl-3 pr-8 py-2 rounded-lg border text-sm font-medium",
                    "bg-surface-raised cursor-pointer outline-none transition-colors",
                    "focus:border-accent",
                    STATUS_STYLES[status]
                  )}
                >
                  {(["todo", "in_progress", "in_review", "done"] as TaskStatus[]).map((s) => (
                    <option key={s} value={s} className="bg-surface text-text-primary">
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary"
                />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                <Flag size={12} />
                우선순위
              </label>
              <div className="flex gap-1.5">
                {(["high", "medium", "low"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={clsx(
                      "flex-1 py-2 rounded-lg border text-xs font-semibold transition-all",
                      priority === p
                        ? PRIORITY_STYLES[p]
                        : "text-text-tertiary bg-surface-raised border-border hover:border-border-subtle hover:text-text-secondary"
                    )}
                  >
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary uppercase tracking-wider">
              <User size={12} />
              담당자
            </label>
            <div className="relative">
              <div className="flex items-center gap-2 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {assignedUser ? (
                  <UserAvatar user={assignedUser} size="sm" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-surface-raised border border-border flex items-center justify-center">
                    <User size={12} className="text-text-tertiary" />
                  </div>
                )}
              </div>
              <select
                value={assigneeId ?? ""}
                onChange={(e) =>
                  setAssigneeId(e.target.value ? Number(e.target.value) : null)
                }
                className={clsx(
                  "w-full appearance-none pl-10 pr-8 py-2.5 rounded-lg border border-border",
                  "bg-surface-raised text-sm text-text-primary cursor-pointer outline-none",
                  "hover:border-border-subtle focus:border-accent transition-colors"
                )}
              >
                <option value="" className="bg-surface text-text-secondary">
                  담당자 없음
                </option>
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-surface text-text-primary">
                    {u.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary"
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary uppercase tracking-wider">
              <Calendar size={12} />
              마감일
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={clsx(
                "w-full px-3 py-2.5 rounded-lg border border-border",
                "bg-surface-raised text-sm text-text-primary outline-none cursor-pointer",
                "hover:border-border-subtle focus:border-accent transition-colors",
                "[color-scheme:dark]"
              )}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-text-tertiary uppercase tracking-wider">
              <AlignLeft size={12} />
              설명
            </label>
            {editingDescription ? (
              <textarea
                ref={descriptionInputRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => setEditingDescription(false)}
                rows={6}
                placeholder="업무 설명을 입력하세요..."
                className={clsx(
                  "w-full px-3 py-2.5 rounded-lg border border-accent/50 resize-none",
                  "bg-surface-raised text-sm text-text-primary outline-none",
                  "focus:border-accent transition-colors placeholder:text-text-tertiary"
                )}
              />
            ) : (
              <div
                className="group relative cursor-pointer min-h-[80px] px-3 py-2.5 rounded-lg border border-border bg-surface-raised hover:border-border-subtle transition-colors"
                onClick={() => setEditingDescription(true)}
              >
                {description ? (
                  <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                    {description}
                  </p>
                ) : (
                  <p className="text-sm text-text-tertiary italic">
                    설명을 추가하려면 클릭하세요...
                  </p>
                )}
                <Pencil
                  size={13}
                  className="absolute top-2.5 right-2.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            )}
          </div>

          {/* Created at */}
          <div className="pb-2">
            <p className="text-xs text-text-tertiary">
              생성일:{" "}
              {new Date(task.created_at).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-subtle flex-shrink-0 bg-surface-raised/40">
          <button
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              "text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20",
              isDeleting && "opacity-50 cursor-not-allowed"
            )}
          >
            {isDeleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            삭제
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              닫기
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={clsx(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                hasChanges && !isSaving
                  ? "bg-accent text-canvas hover:bg-accent-hover shadow-sm"
                  : "bg-surface-raised text-text-tertiary cursor-not-allowed border border-border"
              )}
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              저장
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirm dialog */}
      {showDeleteDialog && (
        <DeleteConfirmDialog
          taskTitle={title}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </>
  );
}
