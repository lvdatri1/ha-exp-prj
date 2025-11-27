import { NextRequest, NextResponse } from "next/server";
import { getAllEnergyData } from "@/lib/db";

function roundUpTo30Minutes(date: Date): Date {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();

  if (minutes === 0 || minutes === 30) {
    return rounded;
  } else if (minutes < 30) {
    rounded.setMinutes(30, 0, 0);
  } else {
    rounded.setMinutes(0, 0, 0);
    rounded.setHours(rounded.getHours() + 1);
  }

  return rounded;
}

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

    const requestedTime = new Date(timeParam);
    const roundedTime = roundUpTo30Minutes(requestedTime);

    // Get all data for forecast calculation
    const allData = getAllEnergyData(parseInt(userId));

    // Group by day of week and time slot
    const dayOfWeek = roundedTime.getDay();
    const targetHour = roundedTime.getHours();
    const targetMinute = roundedTime.getMinutes();

    const matchingRecords: number[] = [];

    allData.forEach((record) => {
      const recordDate = new Date(record.start_time);
      if (recordDate.getDay() === dayOfWeek && record.hour === targetHour && record.minute === targetMinute) {
        matchingRecords.push(record.kwh);
      }
    });

    if (matchingRecords.length === 0) {
      return NextResponse.json({
        success: true,
        kwh: 0,
        unit: "kWh",
        time: roundedTime.toISOString(),
        requestedTime: requestedTime.toISOString(),
        roundedTime: roundedTime.toISOString(),
        sampleCount: 0,
        message: "No historical data found for this time slot",
      });
    }

    const avgKwh = matchingRecords.reduce((a, b) => a + b, 0) / matchingRecords.length;

    return NextResponse.json({
      success: true,
      kwh: parseFloat(avgKwh.toFixed(4)),
      unit: "kWh",
      time: roundedTime.toISOString(),
      requestedTime: requestedTime.toISOString(),
      roundedTime: roundedTime.toISOString(),
      sampleCount: matchingRecords.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
