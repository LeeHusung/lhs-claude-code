import { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus, Member, TaskRequest } from '../types';
import { COLUMNS, STATUS_LABELS, STATUS_COLORS } from '../types';
import { api } from '../api';
import SortableCard from '../components/SortableCard';
import TaskCard from '../components/TaskCard';
import TaskDetailPanel from '../components/TaskDetailPanel';
import TaskFormModal from '../components/TaskFormModal';
import FilterBar from '../components/FilterBar';

export default function BoardPage() {
  const [columns, setColumns] = useState<Record<string, Task[]>>({
    TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [],
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignees, setFilterAssignees] = useState<number[]>([]);
  const [filterPriorities, setFilterPriorities] = useState<string[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadData = useCallback(async () => {
    const [data, mems] = await Promise.all([api.tasks.getByStatus(), api.members.getAll()]);
    setColumns(data);
    setMembers(mems);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filterTasks = (tasks: Task[]): Task[] => {
    return tasks.filter(t => {
      if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(t.description?.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      if (filterAssignees.length > 0 && (!t.assignee || !filterAssignees.includes(t.assignee.id))) return false;
      if (filterPriorities.length > 0 && !filterPriorities.includes(t.priority)) return false;
      return true;
    });
  };

  const findColumn = (id: string): TaskStatus | null => {
    for (const col of COLUMNS) {
      if (columns[col]?.some(t => String(t.id) === id)) return col;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const id = String(event.active.id);
    for (const col of COLUMNS) {
      const task = columns[col]?.find(t => String(t.id) === id);
      if (task) { setActiveTask(task); return; }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeCol = findColumn(activeId);
    const overCol = COLUMNS.includes(overId as TaskStatus) ? overId as TaskStatus : findColumn(overId);

    if (!activeCol || !overCol || activeCol === overCol) return;

    setColumns(prev => {
      const task = prev[activeCol].find(t => String(t.id) === activeId);
      if (!task) return prev;
      return {
        ...prev,
        [activeCol]: prev[activeCol].filter(t => String(t.id) !== activeId),
        [overCol]: [...prev[overCol], { ...task, status: overCol }],
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = String(active.id);
    const overCol = COLUMNS.includes(String(over.id) as TaskStatus) ? String(over.id) as TaskStatus : findColumn(String(over.id));
    if (!overCol) return;

    const col = columns[overCol];
    const taskIndex = col.findIndex(t => String(t.id) === activeId);
    if (taskIndex === -1) return;

    try {
      await api.tasks.move(Number(activeId), overCol, taskIndex);
    } catch {
      loadData();
    }
  };

  const handleCreateTask = async (data: TaskRequest) => {
    await api.tasks.create(data);
    setShowForm(false);
    loadData();
  };

  const handleUpdateTask = async (id: number, data: TaskRequest) => {
    await api.tasks.update(id, data);
    setEditingTask(null);
    setSelectedTask(null);
    loadData();
  };

  const handleDeleteTask = async (id: number) => {
    await api.tasks.delete(id);
    setSelectedTask(null);
    loadData();
  };

  const hasActiveFilters = searchQuery || filterAssignees.length > 0 || filterPriorities.length > 0;

  return (
    <div className="h-full flex flex-col">
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterAssignees={filterAssignees}
        onFilterAssigneesChange={setFilterAssignees}
        filterPriorities={filterPriorities}
        onFilterPrioritiesChange={setFilterPriorities}
        members={members}
        onNewTask={() => setShowForm(true)}
      />

      <div className="flex-1 overflow-x-auto px-6 pb-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map(status => {
              const tasks = filterTasks(columns[status] || []);
              const allTasks = columns[status] || [];
              return (
                <div key={status} className="w-[280px] flex flex-col">
                  <div className="flex items-center gap-2 px-1 py-3">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                    <span className="text-[13px] font-semibold text-text-primary">{STATUS_LABELS[status]}</span>
                    <span className="text-[11px] text-text-muted ml-1">
                      {hasActiveFilters ? `${tasks.length}/${allTasks.length}` : allTasks.length}
                    </span>
                  </div>
                  <SortableContext
                    id={status}
                    items={tasks.map(t => String(t.id))}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex-1 space-y-2 min-h-[60px] p-1 rounded-lg bg-surface-alt/50">
                      {tasks.length === 0 ? (
                        <div className="text-center py-8 text-[12px] text-text-muted">
                          {hasActiveFilters ? '필터 결과 없음' : '업무가 없습니다'}
                        </div>
                      ) : (
                        tasks.map(task => (
                          <SortableCard key={task.id} id={String(task.id)}>
                            <TaskCard task={task} onClick={() => setSelectedTask(task)} />
                          </SortableCard>
                        ))
                      )}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="opacity-90 rotate-2">
                <TaskCard task={activeTask} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onEdit={(t) => { setEditingTask(t); setSelectedTask(null); }}
          onDelete={handleDeleteTask}
          onRefresh={loadData}
        />
      )}

      {(showForm || editingTask) && (
        <TaskFormModal
          task={editingTask}
          members={members}
          onSubmit={(data) => editingTask ? handleUpdateTask(editingTask.id, data) : handleCreateTask(data)}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}
