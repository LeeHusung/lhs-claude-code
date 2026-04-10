import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import getDb from "@/lib/db";

// GET /api/notifications
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("taskflow_user_id");

  if (!userIdCookie) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const userId = Number(userIdCookie.value);
  const { searchParams } = new URL(request.url);

  // Just return unread count
  if (searchParams.get("unread_count") === "true") {
    const db = getDb();
    const result = db
      .prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0")
      .get(userId) as { count: number };
    return NextResponse.json({ count: result.count });
  }

  const db = getDb();
  const notifications = db
    .prepare(
      `SELECT n.*, t.title as task_title
       FROM notifications n
       LEFT JOIN tasks t ON n.task_id = t.id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC`
    )
    .all(userId);

  return NextResponse.json(notifications);
}

// PUT /api/notifications — mark all as read
export async function PUT() {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("taskflow_user_id");

  if (!userIdCookie) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const db = getDb();
  db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(
    Number(userIdCookie.value)
  );

  return NextResponse.json({ ok: true });
}
