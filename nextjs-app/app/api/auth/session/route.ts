import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("session_user_id")?.value;
    console.log("[SESSION] Cookie userId:", userId);

    if (!userId) {
      console.log("[SESSION] No userId cookie found");
      return NextResponse.json({ user: null });
    }

    const user = await getUserById(parseInt(userId));
    console.log("[SESSION] User from DB:", user?.username, "ID:", user?.id);

    if (!user) {
      console.log("[SESSION] User not found in DB");
      return NextResponse.json({ user: null });
    }

    console.log("[SESSION] Returning user:", user.username);
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isGuest: user.is_guest,
        isAdmin: user.is_admin,
      },
    });
  } catch (error) {
    console.error("[SESSION] Error:", error);
    return NextResponse.json({ user: null });
  }
}
