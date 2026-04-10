import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { TaskStats, Task } from '../types';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from '../types';
import { api } from '../api';

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const [stats, setStats] = useState<TaskStats | null>(null);

  useEffect(() => {
    api.tasks.getStats().then(setStats);
  }, []);

  if (!stats) return <div className="p-6 text-[13px] text-text-muted">로딩 중...</div>;

  const statusData = Object.entries(stats.byStatus).map(([key, value]) => ({
    name: STATUS_LABELS[key as keyof typeof STATUS_LABELS],
    value,
    color: STATUS_COLORS[key as keyof typeof STATUS_COLORS],
  }));

  const assigneeData = stats.byAssignee.map(a => ({ name: a.name, count: a.count }));
  const inProgress = (stats.byStatus.IN_PROGRESS || 0) + (stats.byStatus.REVIEW || 0);
  const done = stats.byStatus.DONE || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '전체', value: stats.total, color: '#0f172a' },
          { label: '진행중', value: inProgress, color: STATUS_COLORS.IN_PROGRESS },
          { label: '완료', value: done, color: STATUS_COLORS.DONE },
          { label: '마감 임박', value: stats.upcoming.length, color: '#f43f5e' },
        ].map(c => (
          <div key={c.label} className="bg-surface-card border border-border rounded-md p-4">
            <p className="text-[12px] text-text-muted mb-1">{c.label}</p>
            <p className="text-[28px] font-bold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-card border border-border rounded-md p-4">
          <h3 className="text-[13px] font-semibold text-text-primary mb-4">상태별 분포</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}건`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[11px] text-text-secondary">{s.name} {s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-card border border-border rounded-md p-4">
          <h3 className="text-[13px] font-semibold text-text-primary mb-4">담당자별 업무량</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={assigneeData} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={(value) => [`${value}건`]} />
              <Bar dataKey="count" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming tasks */}
      <div className="bg-surface-card border border-border rounded-md p-4">
        <h3 className="text-[13px] font-semibold text-text-primary mb-3">마감 임박 업무</h3>
        {stats.upcoming.length === 0 ? (
          <p className="text-[12px] text-text-muted py-4 text-center">마감 임박 업무가 없습니다</p>
        ) : (
          <div className="space-y-0">
            {stats.upcoming.map((task: Task) => {
              const days = daysUntil(task.dueDate);
              return (
                <div key={task.id} className="flex items-center gap-3 py-2.5 border-b border-border-light last:border-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
                  <span className="text-[13px] text-text-primary flex-1">{task.title}</span>
                  <span className="text-[12px] text-text-secondary">{task.assignee?.name ?? '-'}</span>
                  <span className={`text-[12px] font-medium ${days !== null && days <= 1 ? 'text-danger' : 'text-priority-medium'}`}>
                    {days !== null ? (days <= 0 ? 'D-Day' : `D-${days}`) : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
