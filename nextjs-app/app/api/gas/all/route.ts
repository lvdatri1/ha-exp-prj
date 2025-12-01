import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAllGasData } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getAllGasData(parseInt(userId));

    const formatted = (Array.isArray(data) ? data : []).map((record) => ({
      startTime: record.start_time,
      endTime: record.end_time,
      kwh: record.kwh,
      date: record.date,
      hour: record.hour,
      minute: record.minute,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error fetching gas data:", error);
    return NextResponse.json({ error: "Failed to fetch gas data" }, { status: 500 });
  }
}
