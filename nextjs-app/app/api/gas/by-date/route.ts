import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGasByDate } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    const data = getGasByDate(date, parseInt(userId));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching gas data by date:", error);
    return NextResponse.json({ error: "Failed to fetch gas data" }, { status: 500 });
  }
}
