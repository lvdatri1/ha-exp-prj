import { NextRequest, NextResponse } from "next/server";
import { getPowerPlanById, updatePowerPlan, deletePowerPlan, getUserById } from "@/lib/db";

async function requireAdmin(request: NextRequest) {
  const userId = request.cookies.get("session_user_id")?.value;
  if (!userId) return null;
  const user = await getUserById(parseInt(userId));
  if (!user || !user.is_admin) return null;
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
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = parseInt(params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const body = await request.json();

    const toBool = (v: any, def: boolean = false) => {
      if (v === undefined || v === null) return def;
      if (typeof v === "boolean") return v;
      if (typeof v === "number") return v === 1;
      if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
      return def;
    };

    const normalized: any = { ...body };
    if ("active" in normalized) normalized.active = toBool(normalized.active, true);
    if ("is_flat_rate" in normalized) normalized.is_flat_rate = toBool(normalized.is_flat_rate, true);
    if ("has_gas" in normalized) normalized.has_gas = toBool(normalized.has_gas, false);
    if ("gas_is_flat_rate" in normalized) normalized.gas_is_flat_rate = toBool(normalized.gas_is_flat_rate, true);

    const updated = await updatePowerPlan(id, normalized);
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
