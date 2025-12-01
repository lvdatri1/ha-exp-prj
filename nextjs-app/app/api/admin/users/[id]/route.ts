import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateUserAdmin } from "@/lib/db";

async function requireAdmin(request: NextRequest) {
  const userId = request.cookies.get("session_user_id")?.value;
  if (!userId) return null;
  const user = await getUserById(parseInt(userId));
  if (!user || (user.is_admin !== true && user.is_admin !== 1)) return null;
  return user;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const id = parseInt(params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const body = await request.json();
    if (typeof body.isAdmin !== "boolean") {
      return NextResponse.json({ error: "isAdmin boolean required" }, { status: 400 });
    }
    await updateUserAdmin(id, body.isAdmin);
    const updated = await getUserById(id);
    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("Update user admin error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
