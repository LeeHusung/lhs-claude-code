import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

// GET /api/tasks — list tasks with optional filters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const assigneeId = searchParams.get("assignee_id");
  const priority = searchParams.get("priority");
  const search = searchParams.get("search");

  const db = getDb();
  let query = `
    SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_avatar_color, u.role as assignee_role
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (status) {
    query += " AND t.status = ?";
    params.push(status);
  }
  if (assigneeId) {
    query += " AND t.assignee_id = ?";
    params.push(Number(assigneeId));
  }
  if (priority) {
    query += " AND t.priority = ?";
    params.push(priority);
  }
  if (search) {
    query += " AND (t.title LIKE ? OR t.description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY t.position ASC, t.created_at DESC";

  const tasks = db.prepare(query).all(...params) as Record<string, unknown>[];

  // Reshape to include assignee object
  const result = tasks.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    due_date: row.due_date,
    assignee_id: row.assignee_id,
    position: row.position,
    created_at: row.created_at,
    assignee: row.assignee_id
      ? {
          id: row.assignee_id,
          name: row.assignee_name,
          avatar_color: row.assignee_avatar_color,
          role: row.assignee_role,
        }
      : null,
  }));

  return NextResponse.json(result);
}

// POST /api/tasks — create task
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description, status, priority, due_date, assignee_id } = body;

  if (!title || !title.trim()) {
    return NextResponse.json({ error: "제목은 필수 입력입니다" }, { status: 400 });
  }

  const db = getDb();
  const targetStatus = status || "todo";

  // Get max position for the target column
  const maxPos = db
    .prepare("SELECT COALESCE(MAX(position), -1) as max_pos FROM tasks WHERE status = ?")
    .get(targetStatus) as { max_pos: number };

  const result = db
    .prepare(
      "INSERT INTO tasks (title, description, status, priority, due_date, assignee_id, position) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(
      title.trim(),
      description || "",
      targetStatus,
      priority || "medium",
      due_date || null,
      assignee_id || null,
      maxPos.max_pos + 1
    );

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
  return NextResponse.json(task, { status: 201 });
}
