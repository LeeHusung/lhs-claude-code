import type { Task } from '../types';
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from '../types';

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

function getInitials(name: string) {
  return name.slice(0, 1);
}

interface Props {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

export default function TaskDetailPanel({ task, onClose, onEdit, onDelete }: Props) {
  const days = daysUntil(task.dueDate);
  const isUrgent = days !== null && days <= 3 && days >= 0;
  const isOverdue = days !== null && days < 0;

  const handleDelete = () => {
    if (confirm('이 업무를 삭제하시겠습니까?')) {
      onDelete(task.id);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-30" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[400px] bg-surface-card border-l border-border z-40 flex flex-col shadow-lg animate-slide-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-[15px] font-semibold text-text-primary">업무 상세</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <h2 className="text-[18px] font-bold text-text-primary leading-snug">{task.title}</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-text-muted w-16">상태</span>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[12px] font-medium text-white"
                style={{ backgroundColor: STATUS_COLORS[task.status] }}
              >
                {STATUS_LABELS[task.status]}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-text-muted w-16">우선순위</span>
              <span className="inline-flex items-center gap-1.5 text-[12px] text-text-primary">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[task.priority] }} />
                {PRIORITY_LABELS[task.priority]}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-text-muted w-16">담당자</span>
              {task.assignee ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-sidebar flex items-center justify-center text-[9px] font-bold text-white">
                    {getInitials(task.assignee.name)}
                  </div>
                  <span className="text-[12px] text-text-primary">{task.assignee.name}</span>
                </div>
              ) : (
                <span className="text-[12px] text-text-muted">미지정</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-text-muted w-16">마감일</span>
              <span className={`text-[12px] ${isOverdue ? 'text-danger font-medium' : isUrgent ? 'text-priority-high font-medium' : 'text-text-primary'}`}>
                {task.dueDate ?? '없음'}
                {days !== null && (
                  <span className="ml-1.5">
                    ({isOverdue ? `D+${Math.abs(days)}` : days === 0 ? 'D-Day' : `D-${days}`})
                  </span>
                )}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-[12px] font-semibold text-text-secondary mb-2">설명</h4>
            {task.description ? (
              <p className="text-[13px] text-text-primary leading-relaxed">{task.description}</p>
            ) : (
              <p className="text-[13px] text-text-muted italic">설명이 없습니다</p>
            )}
          </div>

          <div className="pt-3 border-t border-border-light">
            <p className="text-[11px] text-text-muted">
              생성: {task.createdAt ? new Date(task.createdAt).toLocaleDateString('ko-KR') : '-'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 py-4 border-t border-border">
          <button
            onClick={() => onEdit(task)}
            className="px-4 py-1.5 text-[12px] font-medium bg-accent text-white rounded-md hover:bg-accent-hover transition-colors"
          >
            편집
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-1.5 text-[12px] font-medium text-danger border border-danger/30 rounded-md hover:bg-danger/5 transition-colors"
          >
            삭제
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in { animation: slideIn 0.2s ease-out; }
      `}</style>
    </>
  );
}
