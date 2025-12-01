import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/db";
import { generateGuestUsername } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Generate unique guest username
    const username = generateGuestUsername();

    // Create guest user (await async, pass boolean)
    const user = await createUser(username, null, null, true);

    // Create session
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        isGuest: true,
      },
    });

    // Set session cookie
    response.cookies.set("session_user_id", user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days for guest
    });

    return response;
  } catch (error) {
    console.error("Guest account error:", error);
    return NextResponse.json({ error: "Failed to create guest account" }, { status: 500 });
  }
}
