import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailHash } = body;

    if (!emailHash) {
      return NextResponse.json({ error: "Missing emailHash" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("email_hash", emailHash)
      .single();

    if (error || !data) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({ session: data });
  } catch (error) {
    console.error("Get progress route error:", error);
    return NextResponse.json({ error: "Failed to get progress" }, { status: 500 });
  }
}