import { NextRequest, NextResponse } from "next/server";
import getDb from "@/lib/db";

// GET /api/tasks/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const task = db
    .prepare(
      `SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_avatar_color, u.email as assignee_email, u.role as assignee_role
       FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.id = ?`
    )
    .get(Number(id)) as Record<string, unknown> | undefined;

  if (!task) {
    return NextResponse.json({ error: "업무를 찾을 수 없습니다" }, { status: 404 });
  }

  const result = {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date,
    assignee_id: task.assignee_id,
    position: task.position,
    created_at: task.created_at,
    assignee: task.assignee_id
      ? {
          id: task.assignee_id,
          name: task.assignee_name,
          email: task.assignee_email,
          avatar_color: task.assignee_avatar_color,
          role: task.assignee_role,
        }
      : null,
  };

  return NextResponse.json(result);
}

// PUT /api/tasks/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(Number(id));
  if (!existing) {
    return NextResponse.json({ error: "업무를 찾을 수 없습니다" }, { status: 404 });
  }

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  for (const key of ["title", "description", "status", "priority", "due_date", "assignee_id", "position"]) {
    if (key in body) {
      fields.push(`${key} = ?`);
      values.push(body[key] ?? null);
    }
  }

  if (fields.length === 0) {
    return NextResponse.json({ error: "수정할 필드가 없습니다" }, { status: 400 });
  }

  values.push(Number(id));
  db.prepare(`UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  const updated = db
    .prepare(
      `SELECT t.*, u.name as assignee_name, u.avatar_color as assignee_avatar_color, u.role as assignee_role
       FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.id = ?`
    )
    .get(Number(id)) as Record<string, unknown>;

  const result = {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    status: updated.status,
    priority: updated.priority,
    due_date: updated.due_date,
    assignee_id: updated.assignee_id,
    position: updated.position,
    created_at: updated.created_at,
    assignee: updated.assignee_id
      ? {
          id: updated.assignee_id,
          name: updated.assignee_name,
          avatar_color: updated.assignee_avatar_color,
          role: updated.assignee_role,
        }
      : null,
  };

  return NextResponse.json(result);
}

// DELETE /api/tasks/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(Number(id));
  if (!existing) {
    return NextResponse.json({ error: "업무를 찾을 수 없습니다" }, { status: 404 });
  }

  db.prepare("DELETE FROM tasks WHERE id = ?").run(Number(id));
  return NextResponse.json({ ok: true });
}
