"use client";

import { useEffect, useRef, useState } from "react";
import { X, Calendar, User, Flag, AlignLeft, AlertCircle } from "lucide-react";
import clsx from "clsx";
import type { Task, User as UserType, Priority } from "@/lib/types";
import { PRIORITY_LABELS } from "@/lib/types";

interface TaskFormProps {
  task?: Task;
  onSave: (task: Task) => void;
  onClose: () => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: "high", label: PRIORITY_LABELS.high, color: "text-priority-high" },
  { value: "medium", label: PRIORITY_LABELS.medium, color: "text-priority-medium" },
  { value: "low", label: PRIORITY_LABELS.low, color: "text-priority-low" },
];

export default function TaskForm({ task, onSave, onClose }: TaskFormProps) {
  const isEditing = !!task;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [assigneeId, setAssigneeId] = useState<number | "">(task?.assignee_id ?? "");
  const [users, setUsers] = useState<UserType[]>([]);
  const [titleError, setTitleError] = useState(false);
  const [saving, setSaving] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Fetch team members
  useEffect(() => {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: UserType[]) => setUsers(data))
      .catch(() => setUsers([]));
  }, []);

  // Auto-focus title on mount
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setTitleError(true);
      titleRef.current?.focus();
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description,
        priority,
        due_date: dueDate || null,
        assignee_id: assigneeId !== "" ? assigneeId : null,
      };

      let res: Response;
      if (isEditing) {
        res = await fetch(`/api/tasks/${task.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("API error:", err);
        setSaving(false);
        return;
      }

      const saved: Task = await res.json();
      onSave(saved);
    } catch (err) {
      console.error("Network error:", err);
      setSaving(false);
    }
  };

  const selectedUser = users.find((u) => u.id === assigneeId);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/70 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg mx-4 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
          <h2 className="text-base font-semibold text-text-primary">
            {isEditing ? "업무 수정" : "새 업무 추가"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-hover transition-colors"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider">
                제목 <span className="text-danger">*</span>
              </label>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (e.target.value.trim()) setTitleError(false);
                }}
                placeholder="업무 제목을 입력하세요"
                className={clsx(
                  "w-full px-3 py-2.5 rounded-lg bg-surface-raised border text-sm text-text-primary placeholder-text-tertiary",
                  "outline-none transition-colors",
                  titleError
                    ? "border-danger focus:border-danger"
                    : "border-border hover:border-text-tertiary focus:border-accent"
                )}
              />
              {titleError && (
                <p className="flex items-center gap-1.5 text-xs text-danger">
                  <AlertCircle size={12} />
                  제목은 필수 입력입니다
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider">
                <AlignLeft size={12} />
                설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="업무 설명을 입력하세요 (선택)"
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-raised border border-border hover:border-text-tertiary focus:border-accent text-sm text-text-primary placeholder-text-tertiary outline-none transition-colors resize-none"
              />
            </div>

            {/* Priority + Due date — side by side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  <Flag size={12} />
                  우선순위
                </label>
                <div className="flex flex-col gap-1">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      className={clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border",
                        priority === opt.value
                          ? "bg-surface-raised border-border text-text-primary"
                          : "border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                      )}
                    >
                      <span
                        className={clsx("w-2 h-2 rounded-full shrink-0", {
                          "bg-priority-high": opt.value === "high",
                          "bg-priority-medium": opt.value === "medium",
                          "bg-priority-low": opt.value === "low",
                        })}
                      />
                      <span className={priority === opt.value ? opt.color : ""}>{opt.label}</span>
                      {priority === opt.value && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due date */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider">
                  <Calendar size={12} />
                  마감일
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-raised border border-border hover:border-text-tertiary focus:border-accent text-sm text-text-primary outline-none transition-colors [color-scheme:dark]"
                />
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => setDueDate("")}
                    className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
                  >
                    마감일 제거
                  </button>
                )}
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider">
                <User size={12} />
                담당자
              </label>
              <div className="flex flex-wrap gap-2">
                {/* Unassigned option */}
                <button
                  type="button"
                  onClick={() => setAssigneeId("")}
                  className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors",
                    assigneeId === ""
                      ? "bg-surface-raised border-border text-text-primary"
                      : "border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                  )}
                >
                  <span className="w-6 h-6 rounded-full bg-surface-raised border border-border flex items-center justify-center text-xs text-text-tertiary">
                    —
                  </span>
                  미배정
                </button>

                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setAssigneeId(u.id)}
                    className={clsx(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-colors",
                      assigneeId === u.id
                        ? "bg-surface-raised border-border text-text-primary"
                        : "border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                    )}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-canvas shrink-0"
                      style={{ backgroundColor: u.avatar_color }}
                    >
                      {u.name.charAt(0)}
                    </span>
                    {u.name}
                    {assigneeId === u.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    )}
                  </button>
                ))}
              </div>

              {selectedUser && (
                <p className="text-xs text-text-tertiary">
                  {selectedUser.name} ({selectedUser.role})
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle bg-surface-raised/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className={clsx(
                "px-5 py-2 rounded-lg text-sm font-semibold transition-colors",
                saving
                  ? "bg-accent/50 text-canvas/70 cursor-not-allowed"
                  : "bg-accent hover:bg-accent-hover text-canvas"
              )}
            >
              {saving ? "저장 중…" : isEditing ? "수정 완료" : "업무 추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
