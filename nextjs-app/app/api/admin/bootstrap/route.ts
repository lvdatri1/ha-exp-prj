import { NextRequest, NextResponse } from "next/server";
import { getDb, getUserById } from "@/lib/db";

export async function POST(request: NextRequest) {
  const userIdCookie = request.cookies.get("session_user_id")?.value;
  if (!userIdCookie) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = parseInt(userIdCookie);
  const user = getUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const db = getDb();
  const adminCountRow = db.prepare(`SELECT COUNT(*) as c FROM users WHERE is_admin = 1`).get() as { c: number };
  if (adminCountRow.c > 0) {
    return NextResponse.json({ error: "Admin already exists" }, { status: 409 });
  }

  db.prepare(`UPDATE users SET is_admin = 1 WHERE id = ?`).run(userId);
  const updated = getUserById(userId);
  return NextResponse.json({ success: true, user: updated });
}
