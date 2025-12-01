import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUserAdmin, prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const userIdCookie = request.cookies.get("session_user_id")?.value;
  if (!userIdCookie) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const userId = parseInt(userIdCookie);
  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const adminCount = await prisma.user.count({
    where: { isAdmin: true },
  });
  if (adminCount > 0) {
    return NextResponse.json({ error: "Admin already exists" }, { status: 409 });
  }

  await updateUserAdmin(userId, true);
  const updated = await getUserById(userId);
  return NextResponse.json({ success: true, user: updated });
}
