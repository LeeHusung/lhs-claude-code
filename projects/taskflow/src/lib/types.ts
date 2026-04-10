export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_color: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  assignee_id: number | null;
  position: number;
  created_at: string;
  assignee?: User;
}

export interface Notification {
  id: number;
  user_id: number;
  task_id: number | null;
  type: "due_soon" | "assigned";
  message: string;
  read: number;
  created_at: string;
  task?: Task;
}

export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
export type Priority = "high" | "medium" | "low";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: "높음",
  medium: "중간",
  low: "낮음",
};

export const COLUMNS: TaskStatus[] = ["todo", "in_progress", "in_review", "done"];
