import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  if (!sessionCookie) {
    return null;
  }

  const sessionData = JSON.parse(sessionCookie.value);
  const user = await prisma.user.findUnique({
    where: { id: sessionData.userId },
  });

  if (!user || user.is_admin !== 1) {
    return null;
  }

  return user;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
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
    let isAdminValue: number;
    if (typeof body.isAdmin === "boolean") {
      isAdminValue = body.isAdmin ? 1 : 0;
    } else if (typeof body.is_admin === "number") {
      isAdminValue = body.is_admin;
    } else {
      return NextResponse.json({ error: "isAdmin boolean or is_admin number required" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { is_admin: isAdminValue },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    console.error("Update user admin error:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
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
