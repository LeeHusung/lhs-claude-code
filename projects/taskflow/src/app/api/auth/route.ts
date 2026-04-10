import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import getDb from "@/lib/db";
import type { User } from "@/lib/types";

// POST /api/auth — login
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, email } = body;

  const db = getDb();
  let user: User | undefined;

  if (userId) {
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User | undefined;
  } else if (email) {
    user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;
    if (!user) {
      // Demo mode: create or pick first user for any email
      user = db.prepare("SELECT * FROM users LIMIT 1").get() as User | undefined;
    }
  }

  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set("taskflow_user_id", String(user.id), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json(user);
}

// GET /api/auth — get current user
export async function GET() {
  const cookieStore = await cookies();
  const userIdCookie = cookieStore.get("taskflow_user_id");

  if (!userIdCookie) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const db = getDb();
  const user = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(Number(userIdCookie.value)) as User | undefined;

  if (!user) {
    return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 401 });
  }

  return NextResponse.json(user);
}

// DELETE /api/auth — logout
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("taskflow_user_id");
  return NextResponse.json({ ok: true });
}
