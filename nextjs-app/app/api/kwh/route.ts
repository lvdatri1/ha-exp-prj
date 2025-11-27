import { NextRequest, NextResponse } from "next/server";
import { getEnergyByTimeRange } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("session_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const timeParam = searchParams.get("time");

    if (!timeParam) {
      return NextResponse.json({ success: false, error: "Missing time parameter" }, { status: 400 });
    }

    const targetTime = new Date(timeParam);

    // Search within ±1 minute
    const startRange = new Date(targetTime.getTime() - 60000);
    const endRange = new Date(targetTime.getTime() + 60000);

    const records = getEnergyByTimeRange(startRange.toISOString(), endRange.toISOString(), parseInt(userId));

    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        kwh: 0,
        unit: "kWh",
        time: targetTime.toISOString(),
        message: "No data found for this time",
      });
    }

    // Return the closest match
    const closest = records.reduce((prev, curr) => {
      const prevDiff = Math.abs(new Date(prev.start_time).getTime() - targetTime.getTime());
      const currDiff = Math.abs(new Date(curr.start_time).getTime() - targetTime.getTime());
      return currDiff < prevDiff ? curr : prev;
    });

    return NextResponse.json({
      success: true,
      kwh: parseFloat(closest.kwh.toFixed(4)),
      unit: "kWh",
      time: closest.start_time,
      requestedTime: targetTime.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
