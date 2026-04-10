import type { Member, MemberWithTaskCount, Task, TaskRequest, Notification, TaskStats } from './types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (res.status === 204 || res.headers.get('content-length') === '0') return null as T;
  return res.json();
}

export const api = {
  auth: {
    login: (memberId: number) => request<Member>('/auth/login', { method: 'POST', body: JSON.stringify({ memberId }) }),
  },
  members: {
    getAll: () => request<Member[]>('/members'),
    getById: (id: number) => request<Member>(`/members/${id}`),
    getTasks: (id: number) => request<Task[]>(`/members/${id}/tasks`),
    getAllWithTaskCount: () => request<MemberWithTaskCount[]>('/members/with-task-count'),
  },
  tasks: {
    getAll: () => request<Task[]>('/tasks'),
    getById: (id: number) => request<Task>(`/tasks/${id}`),
    getByStatus: () => request<Record<string, Task[]>>('/tasks/by-status'),
    create: (data: TaskRequest) => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<TaskRequest>) => request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    move: (id: number, status: string, position: number) => request<Task>(`/tasks/${id}/move`, { method: 'PATCH', body: JSON.stringify({ status, position }) }),
    delete: (id: number) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
    getStats: () => request<TaskStats>('/tasks/stats'),
  },
  notifications: {
    getByMember: (memberId: number) => request<Notification[]>(`/notifications/member/${memberId}`),
    getUnreadCount: (memberId: number) => request<{ count: number }>(`/notifications/member/${memberId}/unread-count`),
    markAsRead: (id: number) => request<Notification>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllAsRead: (memberId: number) => request<void>(`/notifications/member/${memberId}/read-all`, { method: 'PATCH' }),
  },
};
