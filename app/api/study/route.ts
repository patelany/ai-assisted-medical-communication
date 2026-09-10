import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { participantId, demographics, responses } = body;

    if (!participantId || !demographics || !responses) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Extract scenario responses and debrief separately
    const scenarioResponses = responses.filter((r: any) => r.scenarioId);
    const debrief = responses.find((r: any) => r.debriefReaction !== undefined);

    // Insert one row per scenario per participant
    for (const scenario of scenarioResponses) {
      const { ratings, scenarioId, messageOrder } = scenario;

      const { error } = await supabase.from("study_responses").insert({
        participant_id: participantId,
        age_range: demographics.ageRange,
        medical_background: demographics.medicalBackground,
        prior_hospitalization: demographics.priorHospitalization,
        scenario_id: scenarioId,
        message_order: messageOrder,
        raw_understanding: ratings.raw?.understanding || null,
        raw_anxiety: ratings.raw?.anxiety || null,
        raw_notes: ratings.raw?.notes || null,
        hybrid_understanding: ratings.hybrid?.understanding || null,
        hybrid_anxiety: ratings.hybrid?.anxiety || null,
        hybrid_notes: ratings.hybrid?.notes || null,
        context_understanding: ratings.context?.understanding || null,
        context_anxiety: ratings.context?.anxiety || null,
        context_notes: ratings.context?.notes || null,
        debrief_reaction: debrief?.debriefReaction || null,
      });

            if (error) {
        console.error("Supabase insert error:", error);
        return NextResponse.json(
          { error: "Failed to save response", details: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Study route error:", error);
    return NextResponse.json(
      { error: "Failed to save response" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("study_responses")
      .select("*")
      .order("submitted_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to read responses" },
        { status: 500 }
      );
    }

    return NextResponse.json({ responses: data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read responses" },
      { status: 500 }
    );
  }
}