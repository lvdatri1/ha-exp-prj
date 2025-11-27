import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGasDailyTotals } from "@/lib/db";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("session_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const totals = getGasDailyTotals(parseInt(userId));
    return NextResponse.json(totals);
  } catch (error) {
    console.error("Error fetching gas daily totals:", error);
    return NextResponse.json({ error: "Failed to fetch gas daily totals" }, { status: 500 });
  }
}
