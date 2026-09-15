import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rateLimit";
import { validateCSRF } from "@/lib/csrf";
import { auditLog } from "@/lib/auditLog";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { success } = rateLimit(`doctor-login:${ip}`, 5, 15 * 60 * 1000);
    if (!success) {
      await auditLog("doctor_login", { success: false, reason: "rate_limited" }, ip);
      return NextResponse.json(
        { error: "Too many login attempts. Please wait 15 minutes." },
        { status: 429 }
      );
    }

    if (!validateCSRF(request)) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const { data: doctor } = await supabase
      .from("doctors")
      .select("id, email, password_hash, name")
      .eq("email", email.toLowerCase().trim())
      .single();

    const passwordMatch = doctor
      ? await bcrypt.compare(password, doctor.password_hash)
      : await bcrypt.compare(
          password,
          "$2a$12$placeholder.hash.to.prevent.timing.attacks"
        );

    if (!doctor || !passwordMatch) {
      await auditLog(
        "doctor_login",
        { success: false, reason: "invalid_credentials" },
        ip
      );
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    await auditLog(
      "doctor_login",
      { success: true, doctorId: doctor.id },
      ip
    );

    return NextResponse.json({
      success: true,
      doctor: { id: doctor.id, email: doctor.email, name: doctor.name },
    });
  } catch (error: any) {
    console.error("Doctor login error:", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}