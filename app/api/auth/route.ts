import { rateLimit } from "@/lib/rateLimit";
import { validateCSRF } from "@/lib/csrf";
import { auditLog } from "@/lib/auditLog";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Rate limiting
    const { success } = rateLimit(`auth:${ip}`, 5, 15 * 60 * 1000);
    if (!success) {
      await auditLog("doctor_login", { success: false, reason: "rate_limited" }, ip);
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 15 minutes." },
        { status: 429 }
      );
    }

    // CSRF protection
    if (!validateCSRF(request)) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    const validUsername = process.env.RESEARCHER_USERNAME;
    const passwordHash = process.env.RESEARCHER_PASSWORD_HASH;

    if (!validUsername || !passwordHash) {
      return NextResponse.json(
        { error: "Server credentials not configured" },
        { status: 500 }
      );
    }

    const usernameMatch = username === validUsername;
    const passwordMatch = await bcrypt.compare(password || "", passwordHash);

    if (usernameMatch && passwordMatch) {
      await auditLog("doctor_login", { success: true, username }, ip);
      return NextResponse.json({ success: true });
    }

    await auditLog("doctor_login", { success: false, reason: "invalid_credentials" }, ip);
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}