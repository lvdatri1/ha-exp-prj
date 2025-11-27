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

export async function GET(request: NextRequest, { params }: { params: { date: string } }) {
  try {
    const userId = request.cookies.get("session_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const dateStr = params.date;
    const targetDate = new Date(dateStr);
    const dayOfWeek = targetDate.getDay();

    // Get all data
    const allData = getAllEnergyData(parseInt(userId));

    // Generate 48 time slots for the day
    const forecasts = [];

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const matchingRecords: number[] = [];

        allData.forEach((record) => {
          const recordDate = new Date(record.start_time);
          if (recordDate.getDay() === dayOfWeek && record.hour === hour && record.minute === minute) {
            matchingRecords.push(record.kwh);
          }
        });

        if (matchingRecords.length > 0) {
          const avgKwh = matchingRecords.reduce((a, b) => a + b, 0) / matchingRecords.length;
          const minKwh = Math.min(...matchingRecords);
          const maxKwh = Math.max(...matchingRecords);

          const timeSlot = new Date(targetDate);
          timeSlot.setHours(hour, minute, 0, 0);

          forecasts.push({
            time: timeSlot.toISOString(),
            averageKwh: parseFloat(avgKwh.toFixed(4)),
            minKwh: parseFloat(minKwh.toFixed(4)),
            maxKwh: parseFloat(maxKwh.toFixed(4)),
            sampleCount: matchingRecords.length,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      date: dateStr,
      dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek],
      forecasts,
      totalSlots: forecasts.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
