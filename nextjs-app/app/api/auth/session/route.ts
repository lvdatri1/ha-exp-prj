import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get("session_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const user = await getUserById(parseInt(userId));

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isGuest: user.is_guest === 1,
        isAdmin: user.is_admin === 1,
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ user: null });
  }
}
