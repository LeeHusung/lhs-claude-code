"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, ChevronDown, RotateCcw, Filter } from "lucide-react";
import clsx from "clsx";
import type { User, Priority } from "@/lib/types";
import { PRIORITY_LABELS } from "@/lib/types";

export interface FilterState {
  search: string;
  assigneeId: number | null;
  priority: Priority | null;
}

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const PRIORITY_ORDER: Priority[] = ["high", "medium", "low"];

const PRIORITY_COLOR: Record<Priority, string> = {
  high: "text-priority-high",
  medium: "text-priority-medium",
  low: "text-priority-low",
};

const PRIORITY_DOT_COLOR: Record<Priority, string> = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
};

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);

  const assigneeRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  // Fetch users on mount
  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data: User[]) => setUsers(data))
      .catch(() => {});
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) {
        setAssigneeOpen(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setPriorityOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    onFilterChange({ ...filters, search: e.target.value });
  }

  function handleAssigneeSelect(id: number | null) {
    onFilterChange({ ...filters, assigneeId: id });
    setAssigneeOpen(false);
  }

  function handlePrioritySelect(p: Priority | null) {
    onFilterChange({ ...filters, priority: p });
    setPriorityOpen(false);
  }

  function handleReset() {
    onFilterChange({ search: "", assigneeId: null, priority: null });
  }

  function removeSearch() {
    onFilterChange({ ...filters, search: "" });
  }

  function removeAssignee() {
    onFilterChange({ ...filters, assigneeId: null });
  }

  function removePriority() {
    onFilterChange({ ...filters, priority: null });
  }

  const selectedUser = users.find((u) => u.id === filters.assigneeId) ?? null;
  const hasFilters =
    filters.search !== "" || filters.assigneeId !== null || filters.priority !== null;

  return (
    <div className="flex flex-col gap-2">
      {/* Main controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search bar */}
        <div className="relative flex items-center flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-3 text-text-tertiary pointer-events-none"
          />
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="업무 검색..."
            className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
          />
          {filters.search && (
            <button
              onClick={removeSearch}
              className="absolute right-2.5 text-text-tertiary hover:text-text-secondary transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Assignee dropdown */}
        <div ref={assigneeRef} className="relative">
          <button
            onClick={() => {
              setAssigneeOpen((v) => !v);
              setPriorityOpen(false);
            }}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors",
              filters.assigneeId !== null
                ? "border-accent bg-accent-muted text-accent"
                : "border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
          >
            <Filter size={13} />
            <span>{selectedUser ? selectedUser.name : "담당자"}</span>
            <ChevronDown
              size={12}
              className={clsx("transition-transform", assigneeOpen && "rotate-180")}
            />
          </button>

          {assigneeOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] bg-surface-raised border border-border rounded-lg shadow-xl shadow-black/40 overflow-hidden">
              <button
                onClick={() => handleAssigneeSelect(null)}
                className={clsx(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                  filters.assigneeId === null
                    ? "text-accent bg-accent-muted"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                )}
              >
                전체
              </button>
              <div className="border-t border-border-subtle" />
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAssigneeSelect(user.id)}
                  className={clsx(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                    filters.assigneeId === user.id
                      ? "text-accent bg-accent-muted"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                  )}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-canvas shrink-0"
                    style={{ backgroundColor: user.avatar_color }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  <span>{user.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority dropdown */}
        <div ref={priorityRef} className="relative">
          <button
            onClick={() => {
              setPriorityOpen((v) => !v);
              setAssigneeOpen(false);
            }}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors",
              filters.priority !== null
                ? "border-accent bg-accent-muted text-accent"
                : "border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
          >
            {filters.priority !== null && (
              <span
                className={clsx(
                  "inline-block w-2 h-2 rounded-full",
                  PRIORITY_DOT_COLOR[filters.priority]
                )}
              />
            )}
            <span>
              {filters.priority !== null
                ? PRIORITY_LABELS[filters.priority]
                : "우선순위"}
            </span>
            <ChevronDown
              size={12}
              className={clsx("transition-transform", priorityOpen && "rotate-180")}
            />
          </button>

          {priorityOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 min-w-[130px] bg-surface-raised border border-border rounded-lg shadow-xl shadow-black/40 overflow-hidden">
              <button
                onClick={() => handlePrioritySelect(null)}
                className={clsx(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                  filters.priority === null
                    ? "text-accent bg-accent-muted"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                )}
              >
                전체
              </button>
              <div className="border-t border-border-subtle" />
              {PRIORITY_ORDER.map((p) => (
                <button
                  key={p}
                  onClick={() => handlePrioritySelect(p)}
                  className={clsx(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                    filters.priority === p
                      ? "text-accent bg-accent-muted"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                  )}
                >
                  <span
                    className={clsx("inline-block w-2 h-2 rounded-full", PRIORITY_DOT_COLOR[p])}
                  />
                  <span className={filters.priority === p ? "text-accent" : PRIORITY_COLOR[p]}>
                    {PRIORITY_LABELS[p]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reset button — only when filters are active */}
        {hasFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-text-tertiary hover:text-text-secondary hover:bg-surface-hover text-sm transition-colors"
          >
            <RotateCcw size={12} />
            초기화
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.search && (
            <span className="inline-flex items-center gap-1 bg-surface border border-border rounded-full pl-2.5 pr-1.5 py-0.5 text-xs text-text-primary">
              <span className="text-text-tertiary mr-0.5">검색:</span>
              {filters.search}
              <button
                onClick={removeSearch}
                className="ml-0.5 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X size={11} />
              </button>
            </span>
          )}

          {selectedUser && (
            <span className="inline-flex items-center gap-1 bg-surface border border-border rounded-full pl-2 pr-1.5 py-0.5 text-xs text-text-primary">
              <div
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-canvas shrink-0"
                style={{ backgroundColor: selectedUser.avatar_color }}
              >
                {selectedUser.name.charAt(0)}
              </div>
              {selectedUser.name}
              <button
                onClick={removeAssignee}
                className="ml-0.5 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X size={11} />
              </button>
            </span>
          )}

          {filters.priority && (
            <span className="inline-flex items-center gap-1 bg-surface border border-border rounded-full pl-2.5 pr-1.5 py-0.5 text-xs text-text-primary">
              <span
                className={clsx(
                  "inline-block w-1.5 h-1.5 rounded-full",
                  PRIORITY_DOT_COLOR[filters.priority]
                )}
              />
              <span className={PRIORITY_COLOR[filters.priority]}>
                {PRIORITY_LABELS[filters.priority]}
              </span>
              <button
                onClick={removePriority}
                className="ml-0.5 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X size={11} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
