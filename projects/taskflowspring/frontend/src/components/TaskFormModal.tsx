import { useState } from 'react';
import type { Task, Member, TaskRequest, TaskPriority } from '../types';

interface Props {
  task: Task | null;
  members: Member[];
  onSubmit: (data: TaskRequest) => void;
  onClose: () => void;
}

export default function TaskFormModal({ task, members, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'MEDIUM');
  const [assigneeId, setAssigneeId] = useState<number | ''>(task?.assignee?.id ?? '');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('제목을 입력하세요'); return; }
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
      status: task?.status ?? 'TODO',
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-surface-card rounded-lg border border-border shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-[15px] font-semibold text-text-primary">
              {task ? '업무 편집' : '새 업무'}
            </h3>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">제목 *</label>
              <input
                value={title}
                onChange={e => { setTitle(e.target.value); setError(''); }}
                className="w-full px-3 py-2 text-[13px] border border-border rounded-md bg-white text-text-primary focus:outline-none focus:border-accent"
                placeholder="업무 제목"
              />
              {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
            </div>

            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">설명</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-[13px] border border-border rounded-md bg-white text-text-primary focus:outline-none focus:border-accent resize-none"
                placeholder="업무 설명"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">담당자</label>
                <select
                  value={assigneeId}
                  onChange={e => setAssigneeId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-[13px] border border-border rounded-md bg-white text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="">선택</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">우선순위</label>
                <div className="flex gap-2 mt-1">
                  {(['HIGH', 'MEDIUM', 'LOW'] as TaskPriority[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`px-2.5 py-1 text-[11px] rounded border transition-colors ${
                        priority === p
                          ? 'border-accent bg-accent/10 text-accent font-medium'
                          : 'border-border text-text-secondary hover:border-accent/40'
                      }`}
                    >
                      {p === 'HIGH' ? '높음' : p === 'MEDIUM' ? '중간' : '낮음'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-text-secondary mb-1">마감일</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-[13px] border border-border rounded-md bg-white text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[12px] text-text-secondary border border-border rounded-md hover:bg-surface-alt transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-[12px] font-medium bg-accent text-white rounded-md hover:bg-accent-hover transition-colors"
              >
                {task ? '저장하기' : '추가하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
