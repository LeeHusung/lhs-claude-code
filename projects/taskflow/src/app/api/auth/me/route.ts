import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import getDb from "@/lib/db";
import type { User } from "@/lib/types";

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
