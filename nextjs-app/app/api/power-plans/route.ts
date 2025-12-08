import { NextRequest, NextResponse } from "next/server";
import { listPowerPlans, createPowerPlan, getUserById, PowerPlan } from "@/lib/db";

async function requireAdmin(request: NextRequest) {
  const userId = request.cookies.get("session_user_id")?.value;
  if (!userId) return null;
  const user = await getUserById(parseInt(userId));
  if (!user || user.is_admin !== true) return null;
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeParam = searchParams.get("active");
    const activeOnly = activeParam === "1" || activeParam === "true";
    const plans = await listPowerPlans(activeOnly);
    // Normalize booleans to numeric flags for backward-compatible tests
    const normalized = plans.map((p: any) => ({
      ...p,
      active: p.active ? 1 : 0,
      is_flat_rate: p.is_flat_rate ? 1 : 0,
      has_gas: p.has_gas ? 1 : 0,
      gas_is_flat_rate: p.gas_is_flat_rate ? 1 : 0,
    }));
    return NextResponse.json({ plans: normalized });
  } catch (err) {
    console.error("Get plans error:", err);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Admin only
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Partial<PowerPlan>;
    if (!body.retailer || !body.name) {
      return NextResponse.json({ error: "retailer and name are required" }, { status: 400 });
    }

    const toBool = (v: any, def: boolean = false) => {
      if (v === undefined || v === null) return def;
      if (typeof v === "boolean") return v;
      if (typeof v === "number") return v === 1;
      if (typeof v === "string") return v === "1" || v.toLowerCase() === "true";
      return def;
    };

    const plan = await createPowerPlan({
      retailer: body.retailer,
      name: body.name,
      active: toBool(body.active, true),
      is_flat_rate: toBool(body.is_flat_rate, true),
      flat_rate: body.flat_rate ?? null,
      peak_rate: body.peak_rate ?? null,
      off_peak_rate: body.off_peak_rate ?? null,
      daily_charge: body.daily_charge ?? null,
      has_gas: toBool(body.has_gas, false),
      gas_is_flat_rate: toBool(body.gas_is_flat_rate, true),
      gas_flat_rate: body.gas_flat_rate ?? null,
      gas_peak_rate: body.gas_peak_rate ?? null,
      gas_off_peak_rate: body.gas_off_peak_rate ?? null,
      gas_daily_charge: body.gas_daily_charge ?? null,
    });

    const normalized = {
      ...plan,
      active: plan.active ? 1 : 0,
      is_flat_rate: plan.is_flat_rate ? 1 : 0,
      has_gas: plan.has_gas ? 1 : 0,
      gas_is_flat_rate: plan.gas_is_flat_rate ? 1 : 0,
    };

    return NextResponse.json({ plan: normalized }, { status: 201 });
  } catch (err) {
    console.error("Create plan error:", err);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}
