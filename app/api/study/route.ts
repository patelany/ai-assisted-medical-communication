import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const STUDY_DB_PATH = path.join(process.cwd(), ".study-responses.json");

function readResponses(): any[] {
  try {
    if (fs.existsSync(STUDY_DB_PATH)) {
      const data = fs.readFileSync(STUDY_DB_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading study responses:", e);
  }
  return [];
}

function writeResponses(responses: any[]) {
  try {
    fs.writeFileSync(STUDY_DB_PATH, JSON.stringify(responses, null, 2));
  } catch (e) {
    console.error("Error writing study responses:", e);
  }
}

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

    const existing = readResponses();

    existing.push({
      participantId,
      demographics,
      responses,
      submittedAt: new Date().toISOString(),
    });

    writeResponses(existing);

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
    const responses = readResponses();
    return NextResponse.json({ responses });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read responses" },
      { status: 500 }
    );
  }
}