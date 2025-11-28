import { NextRequest, NextResponse } from "next/server";
import { listPowerPlans, createPowerPlan, getUserById, PowerPlan } from "@/lib/db";

function requireAdmin(request: NextRequest) {
  const userId = request.cookies.get("session_user_id")?.value;
  if (!userId) return null;
  const user = getUserById(parseInt(userId));
  if (!user || user.is_admin !== 1) return null;
  return user;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const activeParam = searchParams.get("active");
  const activeOnly = activeParam === "1" || activeParam === "true";
  const plans = listPowerPlans(activeOnly);
  return NextResponse.json({ plans });
}

export async function POST(request: NextRequest) {
  // Admin only
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Partial<PowerPlan>;
    if (!body.retailer || !body.name) {
      return NextResponse.json({ error: "retailer and name are required" }, { status: 400 });
    }

    const plan = createPowerPlan({
      retailer: body.retailer,
      name: body.name,
      active: body.active ?? 1,
      is_flat_rate: body.is_flat_rate ?? 1,
      flat_rate: body.flat_rate ?? null,
      peak_rate: body.peak_rate ?? null,
      off_peak_rate: body.off_peak_rate ?? null,
      daily_charge: body.daily_charge ?? null,
      has_gas: body.has_gas ?? 0,
      gas_is_flat_rate: body.gas_is_flat_rate ?? 1,
      gas_flat_rate: body.gas_flat_rate ?? null,
      gas_peak_rate: body.gas_peak_rate ?? null,
      gas_off_peak_rate: body.gas_off_peak_rate ?? null,
      gas_daily_charge: body.gas_daily_charge ?? null,
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (err) {
    console.error("Create plan error:", err);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
}
