import { useState, useRef, useEffect } from 'react';
import type { Member, TaskPriority } from '../types';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '../types';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterAssignees: number[];
  onFilterAssigneesChange: (ids: number[]) => void;
  filterPriorities: string[];
  onFilterPrioritiesChange: (p: string[]) => void;
  members: Member[];
  onNewTask: () => void;
}

function Dropdown({ label, isOpen, toggle, children }: { label: string; isOpen: boolean; toggle: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) toggle(); };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, toggle]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="px-3 py-1.5 text-[12px] border border-border rounded-md text-text-secondary hover:border-accent/40 transition-colors"
      >
        {label} ▾
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-surface-card border border-border rounded-md shadow-md z-20 min-w-[160px] py-1">
          {children}
        </div>
      )}
    </div>
  );
}

export default function FilterBar({
  searchQuery, onSearchChange, filterAssignees, onFilterAssigneesChange,
  filterPriorities, onFilterPrioritiesChange, members, onNewTask,
}: FilterBarProps) {
  const [showAssignee, setShowAssignee] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const priorities: TaskPriority[] = ['HIGH', 'MEDIUM', 'LOW'];

  const toggleAssignee = (id: number) => {
    onFilterAssigneesChange(filterAssignees.includes(id) ? filterAssignees.filter(a => a !== id) : [...filterAssignees, id]);
  };
  const togglePriority = (p: string) => {
    onFilterPrioritiesChange(filterPriorities.includes(p) ? filterPriorities.filter(x => x !== p) : [...filterPriorities, p]);
  };
  const clearAll = () => { onSearchChange(''); onFilterAssigneesChange([]); onFilterPrioritiesChange([]); };
  const hasFilters = searchQuery || filterAssignees.length > 0 || filterPriorities.length > 0;

  return (
    <div className="px-6 py-3 space-y-2">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-[280px]">
          <input
            type="text"
            placeholder="검색..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-[12px] border border-border rounded-md bg-surface-card text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[12px]">🔍</span>
        </div>

        <Dropdown label="담당자" isOpen={showAssignee} toggle={() => setShowAssignee(!showAssignee)}>
          {members.map(m => (
            <label key={m.id} className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-alt cursor-pointer">
              <input type="checkbox" checked={filterAssignees.includes(m.id)} onChange={() => toggleAssignee(m.id)} className="accent-accent" />
              <span className="text-[12px] text-text-primary">{m.name}</span>
            </label>
          ))}
        </Dropdown>

        <Dropdown label="우선순위" isOpen={showPriority} toggle={() => setShowPriority(!showPriority)}>
          {priorities.map(p => (
            <label key={p} className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-alt cursor-pointer">
              <input type="checkbox" checked={filterPriorities.includes(p)} onChange={() => togglePriority(p)} className="accent-accent" />
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[p] }} />
              <span className="text-[12px] text-text-primary">{PRIORITY_LABELS[p]}</span>
            </label>
          ))}
        </Dropdown>

        {hasFilters && (
          <button onClick={clearAll} className="text-[11px] text-text-muted hover:text-danger transition-colors">✕ 초기화</button>
        )}

        <div className="flex-1" />

        <button
          onClick={onNewTask}
          className="px-3 py-1.5 text-[12px] font-medium bg-accent text-white rounded-md hover:bg-accent-hover transition-colors"
        >
          + 새 업무
        </button>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterAssignees.map(id => {
            const m = members.find(m => m.id === id);
            return m ? (
              <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-accent/10 text-accent rounded">
                {m.name} <button onClick={() => toggleAssignee(id)} className="hover:text-danger">✕</button>
              </span>
            ) : null;
          })}
          {filterPriorities.map(p => (
            <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-accent/10 text-accent rounded">
              {PRIORITY_LABELS[p as TaskPriority]} <button onClick={() => togglePriority(p)} className="hover:text-danger">✕</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
