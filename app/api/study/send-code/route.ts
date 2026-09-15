import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/lib/rateLimit";
import crypto from "crypto";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "ClarityAI Research <onboarding@resend.dev>",
      to: email,
      subject: "Your ClarityAI Study Verification Code",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="font-size: 20px; font-weight: 600; color: #111; margin-bottom: 8px;">
            ClarityAI Research Study
          </h2>
          <p style="font-size: 14px; color: #6b7280; margin-bottom: 32px;">
            Enter the code below to verify your email and begin the study.
            This code expires in 10 minutes.
          </p>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
            <p style="font-size: 12px; color: #9ca3af; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.1em;">
              Verification code
            </p>
            <p style="font-size: 36px; font-weight: 700; font-family: monospace; color: #111; letter-spacing: 0.2em; margin: 0;">
              ${code}
            </p>
          </div>
          <p style="font-size: 12px; color: #9ca3af; line-height: 1.6;">
            If you did not request this code, you can safely ignore this email.
            This code is valid for 10 minutes only.
          </p>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
            Anonymous & Confidential · ClarityAI Research Study
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return NextResponse.json(
        { error: "Failed to send email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, code });
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json(
      { error: "Failed to send code." },
      { status: 500 }
    );
  }
}