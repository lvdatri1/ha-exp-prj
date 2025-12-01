import { NextRequest, NextResponse } from "next/server";
import { listUsers, getUserById } from "@/lib/db";

async function requireAdmin(request: NextRequest) {
  const userId = request.cookies.get("session_user_id")?.value;
  if (!userId) return null;
  const user = await getUserById(parseInt(userId));
  if (!user || (user.is_admin !== true && user.is_admin !== 1)) return null;
  return user;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await listUsers();
  return NextResponse.json({ users });
}
