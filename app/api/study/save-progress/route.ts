import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      emailHash,
      participantId,
      currentScenarioIndex,
      responses,
      versionAssignment,
      scenarioOrder,
      demographics,
      path,
    } = body;

    if (!emailHash) {
      return NextResponse.json({ error: "Missing emailHash" }, { status: 400 });
    }

    const { error } = await supabase
      .from("study_sessions")
      .upsert({
        email_hash: emailHash,
        participant_id: participantId,
        current_scenario_index: currentScenarioIndex,
        responses,
        version_assignment: versionAssignment,
        scenario_order: scenarioOrder,
        demographics,
        path,
        updated_at: new Date().toISOString(),
      }, { onConflict: "email_hash" });

    if (error) {
      console.error("Save progress error:", error);
      return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save progress route error:", error);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}