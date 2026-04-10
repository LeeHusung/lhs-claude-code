import { NextResponse } from "next/server";
import getDb from "@/lib/db";

export async function GET() {
  const db = getDb();
  const users = db.prepare("SELECT * FROM users ORDER BY id").all();
  return NextResponse.json(users);
}
