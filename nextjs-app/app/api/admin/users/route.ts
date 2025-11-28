import { NextRequest, NextResponse } from "next/server";
import { listUsers, getUserById } from "@/lib/db";

function requireAdmin(request: NextRequest) {
  const userId = request.cookies.get("session_user_id")?.value;
  if (!userId) return null;
  const user = getUserById(parseInt(userId));
  if (!user || user.is_admin !== 1) return null;
  return user;
}

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = listUsers();
  return NextResponse.json({ users });
}
