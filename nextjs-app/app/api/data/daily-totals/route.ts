import { NextRequest, NextResponse } from "next/server";
import { getDailyTotals } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("session_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const dailyTotals = await getDailyTotals(parseInt(userId));

    return NextResponse.json({
      success: true,
      dailyTotals,
      count: Object.keys(dailyTotals).length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
