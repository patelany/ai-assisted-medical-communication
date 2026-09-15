import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      participantId,
      emailHash,
      demographics,
      path,
      clinicianExperience,
      familyExperience,
      responses,
      postScenario,
      usability,
      debriefReaction,
      versionAssignment,
    } = body;

    if (!participantId || !demographics || !responses) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert one row per scenario
    for (const scenario of responses) {
      const { error } = await supabase.from("study_responses").insert({
        participant_id: participantId,
        age_range: demographics.ageRange,
        medical_background: demographics.medicalBackground,
        prior_hospitalization: demographics.priorHospitalization,
        communicated_updates: demographics.communicatedUpdates || null,
        path: path || null,
        scenario_id: scenario.scenarioId,
        version: scenario.version,
        understanding: scenario.understanding || null,
        anxiety: scenario.anxiety || null,
        trust: scenario.trust || null,
        action_tendency: scenario.actionTendency || null,
        reassurance: scenario.reassurance || null,
        perceived_completeness: scenario.perceivedCompleteness || null,
        notes: scenario.notes || null,
        ai_disclosure_effect: postScenario?.aiDisclosureEffect || null,
        decision_trust: postScenario?.decisionTrust || null,
        trust_decay_response: postScenario?.trustDecayResponse || null,
        would_want_this: usability?.wouldWantThis || null,
        ease_of_use: usability?.easeOfUse || null,
        open_feedback: usability?.openFeedback || null,
        compare_to_now: usability?.compareToNow || null,
        debrief_reaction: debriefReaction || null,
        version_assignment: versionAssignment ? JSON.stringify(versionAssignment) : null,
        clinician_ease_of_use: clinicianExperience?.easeOfUse || null,
        clinician_would_use: clinicianExperience?.wouldUse || null,
        clinician_feedback: clinicianExperience?.feedback || null,
        clinician_hipaa_interesting: clinicianExperience?.hipaaInteresting || null,
        family_ease_of_use: familyExperience?.easeOfUse || null,
        family_would_want: familyExperience?.wouldWant || null,
        family_feedback: familyExperience?.feedback || null,
        family_compare_to_now: familyExperience?.compareToNow || null,
      });

      if (error) {
        console.error("Supabase insert error:", error);
        return NextResponse.json(
          { error: "Failed to save response", details: error.message },
          { status: 500 }
        );
      }
    }

    // Record email as completed to prevent re-entry
    if (emailHash) {
      await supabase.from("study_completed_emails").insert({
        email_hash: emailHash,
        participant_id: participantId,
      });
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