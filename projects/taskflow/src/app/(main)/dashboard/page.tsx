"use client";

import Header from "@/components/Header";
import { Task, User, TaskStatus, STATUS_LABELS, Priority } from "@/lib/types";
import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  Users,
} from "lucide-react";
import clsx from "clsx";

// ── colour palette ────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "#8B949E",
  in_progress: "#58A6FF",
  in_review: "#D29922",
  done: "#3FB950",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "#F85149",
  medium: "#D29922",
  low: "#3FB950",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  high: "높음",
  medium: "중간",
  low: "낮음",
};

// ── helpers ───────────────────────────────────────────────────────────────────
function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDue(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days < 0) return `${Math.abs(days)}일 초과`;
  if (days === 0) return "오늘";
  if (days === 1) return "내일";
  return `${days}일 후`;
}

// ── custom tooltip ────────────────────────────────────────────────────────────
function DarkTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number; fill: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#21262D] border border-[#30363D] rounded-lg px-3 py-2 text-sm shadow-lg">
      {label && <p className="text-[#8B949E] mb-1">{label}</p>}
      <p className="text-[#E6EDF3] font-semibold">{payload[0].value}건</p>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ]).then(([taskData, userData]) => {
      setTasks(Array.isArray(taskData) ? taskData : []);
      setUsers(Array.isArray(userData) ? userData : []);
      setLoading(false);
    });
  }, []);

  // ── derived stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);

    const dueSoon = tasks.filter((t) => {
      if (!t.due_date || t.status === "done") return false;
      const due = new Date(t.due_date);
      due.setHours(0, 0, 0, 0);
      return due >= today && due <= in7Days;
    });

    // Status distribution
    const statusDist: { name: string; count: number; color: string; key: TaskStatus }[] =
      (["todo", "in_progress", "in_review", "done"] as TaskStatus[]).map((s) => ({
        key: s,
        name: STATUS_LABELS[s],
        count: tasks.filter((t) => t.status === s).length,
        color: STATUS_COLORS[s],
      }));

    // Assignee workload (excluding done)
    const assigneeMap = new Map<number, { name: string; count: number; color: string }>();
    tasks
      .filter((t) => t.status !== "done")
      .forEach((t) => {
        if (!t.assignee_id || !t.assignee) return;
        const existing = assigneeMap.get(t.assignee_id);
        if (existing) {
          existing.count += 1;
        } else {
          assigneeMap.set(t.assignee_id, {
            name: t.assignee.name,
            count: 1,
            color: t.assignee.avatar_color || "#E3B341",
          });
        }
      });
    const assigneeWorkload = Array.from(assigneeMap.values()).sort(
      (a, b) => b.count - a.count
    );

    // Due-soon sorted
    const dueSoonSorted = [...dueSoon].sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    return { total, done, inProgress, completionRate, dueSoon, dueSoonSorted, statusDist, assigneeWorkload };
  }, [tasks]);

  // ── loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <Header title="Dashboard" />
        <main className="flex-1 overflow-auto p-6 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-text-secondary text-sm">불러오는 중…</p>
          </div>
        </main>
      </>
    );
  }

  // ── empty state ──────────────────────────────────────────────────────────
  if (stats.total === 0) {
    return (
      <>
        <Header title="Dashboard" />
        <main className="flex-1 overflow-auto p-6 flex items-center justify-center">
          <div className="text-center">
            <ListTodo size={48} className="mx-auto mb-4 text-text-tertiary" />
            <p className="text-text-primary text-lg font-semibold mb-2">업무가 없습니다</p>
            <p className="text-text-secondary text-sm">칸반 보드에서 첫 업무를 추가해 보세요.</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 overflow-auto p-6 space-y-6">

        {/* ── 비대칭 지표 카드 ───────────────────────────────────────────── */}
        <section className="grid grid-cols-4 gap-4">
          {/* 큰 카드 — 전체 업무 수 (2열) */}
          <div className="col-span-2 bg-surface rounded-xl border border-border p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <ListTodo size={28} className="text-accent" />
            </div>
            <div>
              <p className="text-text-secondary text-sm mb-1">전체 업무</p>
              <p className="text-5xl font-bold text-text-primary leading-none">{stats.total}</p>
              <p className="text-text-tertiary text-xs mt-2">
                완료 {stats.done}건 · 미완 {stats.total - stats.done}건
              </p>
            </div>
          </div>

          {/* 완료율 */}
          <div className="bg-surface rounded-xl border border-border p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-secondary text-sm">완료율</p>
              <CheckCircle2 size={18} className="text-success" />
            </div>
            <p className="text-3xl font-bold text-success">{stats.completionRate}%</p>
            <div className="mt-3 h-1.5 bg-surface-raised rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>

          {/* 진행 중 */}
          <div className="bg-surface rounded-xl border border-border p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-secondary text-sm">진행 중</p>
              <Clock size={18} className="text-info" />
            </div>
            <p className="text-3xl font-bold text-info">{stats.inProgress}</p>
            <p className="text-text-tertiary text-xs mt-3">활성 업무</p>
          </div>

          {/* 마감 임박 — 추가 카드 (전체 폭) */}
          <div className="col-span-4 bg-surface rounded-xl border border-border p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-secondary text-xs">마감 임박 (7일 이내)</p>
              <p className="text-xl font-bold text-warning">{stats.dueSoon.length}건</p>
            </div>
            <div className="text-text-tertiary text-sm">
              {stats.dueSoon.length === 0 ? "이번 주 마감 없음" : "우측 목록 참조"}
            </div>
          </div>
        </section>

        {/* ── 상태별 분포 차트 ─────────────────────────────────────────────── */}
        <section className="bg-surface rounded-xl border border-border p-6">
          <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-accent inline-block" />
            상태별 업무 분포
          </h2>
          <div className="grid grid-cols-5 gap-6 items-center">
            {/* PieChart */}
            <div className="col-span-2 flex justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.statusDist}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {stats.statusDist.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend + counts */}
            <div className="col-span-3 grid grid-cols-2 gap-3">
              {stats.statusDist.map((s) => (
                <div
                  key={s.key}
                  className="bg-surface-raised rounded-lg p-3 flex items-center gap-3"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-text-secondary text-xs truncate">{s.name}</p>
                    <p className="text-text-primary font-bold text-lg leading-tight">{s.count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 하단 2열 ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-5 gap-4">

          {/* 좌측: 담당자별 업무량 (3/5) */}
          <section className="col-span-3 bg-surface rounded-xl border border-border p-6">
            <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
              <Users size={16} className="text-accent" />
              담당자별 업무량
              <span className="text-text-tertiary text-xs font-normal">(완료 제외)</span>
            </h2>

            {stats.assigneeWorkload.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-10">
                <p className="text-text-tertiary text-sm">담당자가 지정된 미완료 업무 없음</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(stats.assigneeWorkload.length * 44, 160)}>
                <BarChart
                  data={stats.assigneeWorkload}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: "#6E7681", fontSize: 11 }}
                    axisLine={{ stroke: "#30363D" }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={80}
                    tick={{ fill: "#8B949E", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {stats.assigneeWorkload.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </section>

          {/* 우측: 마감 임박 목록 (2/5) */}
          <section className="col-span-2 bg-surface rounded-xl border border-border p-6 flex flex-col">
            <h2 className="text-text-primary font-semibold mb-4 flex items-center gap-2 shrink-0">
              <AlertTriangle size={16} className="text-warning" />
              마감 임박
            </h2>

            {stats.dueSoonSorted.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                <CheckCircle2 size={32} className="text-success mb-3 opacity-60" />
                <p className="text-text-secondary text-sm">7일 이내 마감 업무 없음</p>
              </div>
            ) : (
              <ul className="space-y-2 overflow-y-auto flex-1">
                {stats.dueSoonSorted.map((task) => {
                  const days = task.due_date ? daysUntil(task.due_date) : null;
                  const isOverdue = days !== null && days < 0;
                  const isToday = days === 0;
                  return (
                    <li
                      key={task.id}
                      className="bg-surface-raised rounded-lg p-3 border border-border-subtle"
                    >
                      <div className="flex items-start gap-2">
                        {/* Priority dot */}
                        <span
                          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                          title={PRIORITY_LABELS[task.priority]}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-text-primary text-sm font-medium leading-snug line-clamp-1">
                            {task.title}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-text-tertiary text-xs">
                              {task.assignee?.name ?? "미배정"}
                            </span>
                            <span
                              className={clsx(
                                "text-xs font-medium",
                                isOverdue ? "text-danger" :
                                isToday ? "text-warning" :
                                days !== null && days <= 2 ? "text-warning" : "text-text-secondary"
                              )}
                            >
                              {task.due_date ? formatDue(task.due_date) : "-"}
                            </span>
                          </div>
                          {/* status badge */}
                          <span
                            className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              backgroundColor: STATUS_COLORS[task.status] + "22",
                              color: STATUS_COLORS[task.status],
                            }}
                          >
                            {STATUS_LABELS[task.status]}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

      </main>
    </>
  );
}
