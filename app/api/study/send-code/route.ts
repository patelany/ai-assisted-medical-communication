import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function hashEmail(email: string): string {
  return crypto
    .createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { success } = rateLimit(`study-send-code:${ip}`, 20, 60 * 60 * 1000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const emailHash = hashEmail(email);

    // Check if already completed
    const { data: completed } = await supabase
      .from("study_completed_emails")
      .select("id")
      .eq("email_hash", emailHash)
      .single();

    if (completed) {
      return NextResponse.json(
        { error: "This email has already been used to complete the study. Each person may only participate once." },
        { status: 409 }
      );
    }

    // Check if returning participant with saved session
    const { data: session } = await supabase
      .from("study_sessions")
      .select("id")
      .eq("email_hash", emailHash)
      .single();

    // Mark email as verified so they can return
    await supabase
      .from("study_email_verifications")
      .upsert({
        email_hash: emailHash,
        code: "bypass",
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        verified: true,
      }, { onConflict: "email_hash" });

    return NextResponse.json({
      success: true,
      emailHash,
      returning: !!session,
    });
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json(
      { error: "Failed to process email." },
      { status: 500 }
    );
  }
}