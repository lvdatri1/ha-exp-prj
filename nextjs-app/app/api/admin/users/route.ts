import { NextRequest, NextResponse } from "next/server";
import { getUserById, prisma } from "@/lib/db";

async function requireAdmin(request: NextRequest) {
  const userId = request.cookies.get("session_user_id")?.value;
  if (!userId) return null;

  const user = await getUserById(parseInt(userId));
  if (!user || !user.is_admin) return null;

  return user;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Map Prisma camelCase to legacy snake_case format
    const mappedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      is_guest: user.isGuest ? 1 : 0,
      is_admin: user.isAdmin ? 1 : 0,
      created_at: user.createdAt.toISOString(),
    }));

    return NextResponse.json({ users: mappedUsers });
  } catch (err) {
    console.error("List users error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
