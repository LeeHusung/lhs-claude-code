"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Header from "@/components/Header";
import { User, Task, TaskStatus, STATUS_LABELS } from "@/lib/types";

interface TeamMemberStats {
  user: User;
  taskCounts: Record<TaskStatus, number>;
  totalTasks: number;
}

function Avatar({ user, size = "lg" }: { user: User; size?: "sm" | "lg" }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={clsx(
        "flex items-center justify-center rounded-full font-bold text-canvas shrink-0",
        size === "lg" ? "w-16 h-16 text-xl" : "w-8 h-8 text-sm"
      )}
      style={{ backgroundColor: user.avatar_color }}
    >
      {initials}
    </div>
  );
}

const STATUS_ORDER: TaskStatus[] = ["in_progress", "in_review", "todo", "done"];
const STATUS_COLORS: Record<TaskStatus, string> = {
  in_progress: "text-info",
  in_review:   "text-accent",
  todo:        "text-text-secondary",
  done:        "text-success",
};

export default function TeamPage() {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMemberStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [usersRes, tasksRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/tasks"),
        ]);

        if (!usersRes.ok || !tasksRes.ok) {
          throw new Error("데이터를 불러오지 못했습니다.");
        }

        const users: User[] = await usersRes.json();
        const tasks: Task[] = await tasksRes.json();

        const stats: TeamMemberStats[] = users.map((user) => {
          const userTasks = tasks.filter((t) => t.assignee_id === user.id);
          const taskCounts: Record<TaskStatus, number> = {
            todo: 0,
            in_progress: 0,
            in_review: 0,
            done: 0,
          };
          userTasks.forEach((t) => {
            taskCounts[t.status] = (taskCounts[t.status] ?? 0) + 1;
          });
          return { user, taskCounts, totalTasks: userTasks.length };
        });

        setMembers(stats);
      } catch (e) {
        setError(e instanceof Error ? e.message : "알 수 없는 오류");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function handleCardClick(userId: number) {
    router.push(`/board?assignee=${userId}`);
  }

  return (
    <>
      <Header title="Team" />
      <main className="flex-1 overflow-auto p-6">
        {loading && (
          <div className="flex items-center justify-center h-48 text-text-secondary">
            불러오는 중…
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-48 text-danger">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-text-secondary text-sm mb-6">
              {members.length}명의 팀원
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {members.map(({ user, taskCounts, totalTasks }) => (
                <button
                  key={user.id}
                  onClick={() => handleCardClick(user.id)}
                  className={clsx(
                    "bg-surface border border-border-subtle rounded-xl p-5",
                    "text-left transition-colors duration-150",
                    "hover:bg-surface-hover hover:border-border"
                  )}
                >
                  {/* Top row: avatar + name + role */}
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar user={user} size="lg" />
                    <div className="min-w-0">
                      <p className="text-text-primary font-semibold text-base leading-tight truncate">
                        {user.name}
                      </p>
                      <p className="text-text-secondary text-sm mt-0.5 truncate">
                        {user.role}
                      </p>
                      <p className="text-text-tertiary text-xs mt-0.5 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Task stats */}
                  {totalTasks === 0 ? (
                    <div className="flex items-center gap-2 pt-3 border-t border-border-subtle">
                      <span className="text-text-tertiary text-sm">
                        배정된 업무 없음
                      </span>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-border-subtle">
                      <p className="text-text-secondary text-xs mb-2">
                        총 <span className="text-text-primary font-medium">{totalTasks}</span>건 담당
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {STATUS_ORDER.map((status) => {
                          const count = taskCounts[status];
                          if (count === 0) return null;
                          return (
                            <span
                              key={status}
                              className={clsx(
                                "text-xs flex items-center gap-1",
                                STATUS_COLORS[status]
                              )}
                            >
                              <span className="font-semibold">{count}</span>
                              <span className="text-text-tertiary">
                                {STATUS_LABELS[status]}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
