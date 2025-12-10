import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername, updateLastLogin, verifyPassword } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    console.log("[LOGIN] Request received");
    const contentType = request.headers.get("content-type") || "";
    console.log("[LOGIN] Content-Type:", contentType);

    if (!contentType.includes("application/json")) {
      console.log("[LOGIN] Invalid content type");
      return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 400 });
    }

    let parsed: any = null;
    try {
      parsed = await request.json();
    } catch {
      console.log("[LOGIN] JSON parse failed");
      return NextResponse.json({ error: "Invalid or empty JSON body" }, { status: 400 });
    }

    const { username, password } = parsed || {};
    console.log("[LOGIN] Username:", username, "Password length:", password?.length);

    if (!username || !password) {
      console.log("[LOGIN] Missing username or password");
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    // Find user
    const user = await getUserByUsername(username);
    console.log("[LOGIN] User found:", user?.username, "ID:", user?.id);

    if (!user) {
      console.log("[LOGIN] User not found");
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Verify password
    const isValid = await verifyPassword(user.id, password);
    console.log("[LOGIN] Password valid:", isValid);

    if (!isValid) {
      console.log("[LOGIN] Invalid password");
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Update last login
    await updateLastLogin(user.id);
    console.log("[LOGIN] Updated last login");

    // Create session
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isGuest: user.is_guest,
      },
    });

    // Set session cookie
    console.log("[LOGIN] Setting cookie with user ID:", user.id);
    response.cookies.set("session_user_id", user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    console.log(
      "[LOGIN] Cookie set. NODE_ENV:",
      process.env.NODE_ENV,
      "secure:",
      process.env.NODE_ENV === "production"
    );
    console.log("[LOGIN] Returning success response");

    return response;
  } catch (error) {
    // Avoid noisy logs for JSON parse; other errors still logged
    if (!(error instanceof SyntaxError)) {
      console.error("Login error:", error);
    }
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
