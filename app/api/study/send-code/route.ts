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
    const { data: existing } = await supabase
      .from("study_completed_emails")
      .select("id")
      .eq("email_hash", emailHash)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This email has already been used to complete the study. Each person may only participate once." },
        { status: 409 }
      );
    }

        // Check if already verified (returning participant)
    const { data: alreadyVerified } = await supabase
      .from("study_email_verifications")
      .select("id")
      .eq("email_hash", emailHash)
      .eq("verified", true)
      .single();

    if (alreadyVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true, emailHash });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Delete any existing unverified codes for this email
    await supabase
      .from("study_email_verifications")
      .delete()
      .eq("email_hash", emailHash);

    // Store code
    const { error: insertError } = await supabase
      .from("study_email_verifications")
      .insert({
        email_hash: emailHash,
        code,
        expires_at: expiresAt,
        verified: false,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to generate code. Try again." },
        { status: 500 }
      );
    }

    // Skip email for now — return code directly
    // TODO: Add domain to Resend and re-enable email sending
    console.log(`Study verification code for ${email}: ${code}`);


    return NextResponse.json({ success: true, code });
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json(
      { error: "Failed to send code." },
      { status: 500 }
    );
  }
}