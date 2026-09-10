import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, accessCode } = body;

    if (!phoneNumber || !accessCode) {
      return NextResponse.json(
        { error: "Phone number and access code are required" },
        { status: 400 }
      );
    }

    // Format phone number — ensure it starts with +1
    const formatted = phoneNumber.startsWith("+1")
      ? phoneNumber
      : phoneNumber.startsWith("1")
      ? `+${phoneNumber}`
      : `+1${phoneNumber.replace(/\D/g, "")}`;

    const message = await client.messages.create({
      body: `Hi, you can follow live updates about your loved one here:\n\nSite: clarityai.app/view\nCode: ${accessCode}\n\nNo account needed — just enter the code. Reply STOP to unsubscribe.`,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: formatted,
    });

    return NextResponse.json({
      success: true,
      messageSid: message.sid,
    });
  } catch (error: any) {
    console.error("SMS error:", error);
    return NextResponse.json(
      { error: "Failed to send SMS", details: error.message },
      { status: 500 }
    );
  }
}