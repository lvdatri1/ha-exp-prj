import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername, updateLastLogin } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 400 });
    }

    let parsed: any = null;
    try {
      parsed = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid or empty JSON body" }, { status: 400 });
    }

    const { username, password } = parsed || {};

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    // Find user
    const user = getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Verify password
    if (!user.password_hash || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Update last login
    updateLastLogin(user.id);

    // Create session
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isGuest: user.is_guest === 1,
      },
    });

    // Set session cookie
    response.cookies.set("session_user_id", user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    // Avoid noisy logs for JSON parse; other errors still logged
    if (!(error instanceof SyntaxError)) {
      console.error("Login error:", error);
    }
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
