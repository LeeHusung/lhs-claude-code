export interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
}

export interface MemberWithTaskCount extends Member {
  taskCount: number;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: Member | null;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: number | null;
  dueDate?: string | null;
  position?: number;
}

export interface Notification {
  id: number;
  recipient: Member;
  message: string;
  type: 'DEADLINE' | 'ASSIGNMENT';
  isRead: boolean;
  relatedTask: Task | null;
  createdAt: string;
}

export interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byAssignee: { name: string; count: number }[];
  upcoming: Task[];
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  REVIEW: '#8b5cf6',
  DONE: '#10b981',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  HIGH: '높음',
  MEDIUM: '중간',
  LOW: '낮음',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  HIGH: '#f43f5e',
  MEDIUM: '#f59e0b',
  LOW: '#94a3b8',
};

export const COLUMNS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
