import { NextRequest, NextResponse } from "next/server";
import { getPowerPlanById, updatePowerPlan, deletePowerPlan, getUserById } from "@/lib/db";

function requireAdmin(request: NextRequest) {
  const userId = request.cookies.get("session_user_id")?.value;
  if (!userId) return null;
  const user = getUserById(parseInt(userId));
  if (!user || user.is_admin !== 1) return null;
  return user;
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const plan = getPowerPlanById(id);
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ plan });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = parseInt(params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const body = await request.json();
    const updated = updatePowerPlan(id, body);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ plan: updated });
  } catch (err) {
    console.error("Update plan error:", err);
    return NextResponse.json({ error: "Failed to update plan" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = parseInt(params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    deletePowerPlan(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete plan error:", err);
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 });
  }
}
