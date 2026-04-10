import type { Task } from '../types';
import { PRIORITY_COLORS } from '../types';

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getInitials(name: string) {
  return name.slice(0, 1);
}

export default function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const days = daysUntil(task.dueDate);
  const isUrgent = days !== null && days <= 3 && days >= 0;
  const isOverdue = days !== null && days < 0;

  return (
    <div
      onClick={onClick}
      className="bg-surface-card border border-border rounded-md p-3 cursor-pointer hover:border-accent/40 transition-colors group"
    >
      <div className="flex items-start gap-2">
        <span
          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
        />
        <p className="text-[13px] font-medium text-text-primary leading-snug flex-1 group-hover:text-accent transition-colors">
          {task.title}
        </p>
      </div>
      <div className="flex items-center justify-between mt-2.5 pl-3.5">
        {task.assignee && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-sidebar flex items-center justify-center text-[9px] font-bold text-white">
              {getInitials(task.assignee.name)}
            </div>
            <span className="text-[11px] text-text-muted">{task.assignee.name}</span>
          </div>
        )}
        {task.dueDate && (
          <span className={`text-[11px] ${isOverdue ? 'text-danger font-medium' : isUrgent ? 'text-priority-high font-medium' : 'text-text-muted'}`}>
            {isOverdue ? `D+${Math.abs(days!)}` : days === 0 ? 'D-Day' : `D-${days}`}
          </span>
        )}
      </div>
    </div>
  );
}
