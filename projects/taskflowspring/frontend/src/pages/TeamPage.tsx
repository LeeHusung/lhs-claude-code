import { useEffect, useState } from 'react';
import type { MemberWithTaskCount, Task } from '../types';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_COLORS } from '../types';
import { api } from '../api';

function getInitials(name: string) {
  return name.slice(0, 1);
}

const AVATAR_COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e'];

export default function TeamPage() {
  const [members, setMembers] = useState<MemberWithTaskCount[]>([]);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [memberTasks, setMemberTasks] = useState<Task[]>([]);

  useEffect(() => {
    api.members.getAllWithTaskCount().then(setMembers);
  }, []);

  useEffect(() => {
    if (selectedMember) {
      api.members.getTasks(selectedMember).then(setMemberTasks);
    } else {
      setMemberTasks([]);
    }
  }, [selectedMember]);

  return (
    <div className="p-6">
      <div className="bg-surface-card border border-border rounded-md">
        {members.map((m, i) => (
          <div key={m.id}>
            <div
              onClick={() => setSelectedMember(selectedMember === m.id ? null : m.id)}
              className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-surface-alt transition-colors"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              >
                {getInitials(m.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-text-primary">{m.name}</p>
                <p className="text-[11px] text-text-muted">{m.email}</p>
              </div>
              <span className="text-[12px] text-text-secondary px-3 py-0.5 bg-surface-alt rounded">{m.role}</span>
              <span className="text-[12px] text-text-muted">업무 {m.taskCount}개</span>
              <span className={`text-text-muted text-[12px] transition-transform ${selectedMember === m.id ? 'rotate-90' : ''}`}>▶</span>
            </div>

            {selectedMember === m.id && (
              <div className="px-5 pb-4">
                {memberTasks.length === 0 ? (
                  <p className="text-[12px] text-text-muted py-3 pl-14">할당된 업무가 없습니다</p>
                ) : (
                  <div className="ml-14 space-y-1.5">
                    {memberTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-3 px-3 py-2 bg-surface-alt rounded-md">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
                        <span className="text-[12px] text-text-primary flex-1">{task.title}</span>
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded text-white"
                          style={{ backgroundColor: STATUS_COLORS[task.status] }}
                        >
                          {STATUS_LABELS[task.status]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {i < members.length - 1 && <div className="border-b border-border-light mx-5" />}
          </div>
        ))}
      </div>
    </div>
  );
}
