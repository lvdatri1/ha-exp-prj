import { NextRequest, NextResponse } from "next/server";
import { getAllEnergyData } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("session_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const data = getAllEnergyData(parseInt(userId));

    const formatted = data.map((record) => ({
      startTime: record.start_time,
      endTime: record.end_time,
      kwh: record.kwh,
      date: record.date,
      hour: record.hour,
      minute: record.minute,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
