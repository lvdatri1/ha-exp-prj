import { NextRequest, NextResponse } from "next/server";
import { getUserById, prisma } from "@/lib/db";

async function requireAdmin(request: NextRequest) {
  const userId = request.cookies.get("session_user_id")?.value;
  if (!userId) return null;

  const user = await getUserById(parseInt(userId));
  if (!user || !user.is_admin) return null;

  return user;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // Prevent admin from modifying themselves
  if (id === admin.id) {
    return NextResponse.json({ error: "Cannot modify your own admin status" }, { status: 400 });
  }

  try {
    const body = await request.json();

    // Support both isAdmin (boolean) and is_admin (number) for backward compatibility
    let isAdminValue: boolean;
    if (typeof body.isAdmin === "boolean") {
      isAdminValue = body.isAdmin;
    } else if (typeof body.is_admin === "number") {
      isAdminValue = body.is_admin === 1;
    } else {
      return NextResponse.json({ error: "isAdmin boolean or is_admin number required" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isAdmin: isAdminValue },
    });

    // Map to legacy format
    const mappedUser = {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      is_guest: updated.isGuest ? 1 : 0,
      is_admin: updated.isAdmin ? 1 : 0,
      created_at: updated.createdAt.toISOString(),
    };

    return NextResponse.json({ user: mappedUser });
  } catch (err) {
    console.error("Update user admin error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = parseInt(params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // Prevent admin from deleting themselves
  if (id === admin.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  try {
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete user error:", err);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
