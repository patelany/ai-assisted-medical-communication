import { NextRequest, NextResponse } from "next/server";
import anthropic from "@/lib/anthropic";
import {
  ComprehendMedicalClient,
  DetectPHICommand,
} from "@aws-sdk/client-comprehendmedical";

const comprehendClient = new ComprehendMedicalClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function deidentifyWithComprehend(text: string): Promise<{
  cleanText: string;
  redactions: { original: string; replacement: string; type: string }[];
}> {
  try {
    const command = new DetectPHICommand({ Text: text });
    const response = await comprehendClient.send(command);

    const entities = response.Entities || [];
    const redactions: { original: string; replacement: string; type: string }[] = [];

    // Sort entities by begin offset in reverse so replacements don't shift positions
    const sorted = [...entities].sort(
      (a, b) => (b.BeginOffset ?? 0) - (a.BeginOffset ?? 0)
    );

    let cleanText = text;

    for (const entity of sorted) {
      const original = entity.Text || "";
      const type = entity.Type || "PHI";
      const replacement = `[${type.toLowerCase().replace(/_/g, " ")}]`;

      cleanText =
        cleanText.slice(0, entity.BeginOffset ?? 0) +
        replacement +
        cleanText.slice(entity.EndOffset ?? 0);

      redactions.push({ original, replacement, type });
    }

    return { cleanText, redactions };
  } catch (error) {
    console.error("Comprehend Medical error:", error);
    // If Comprehend fails, return original text and let Claude handle it
    return { cleanText: text, redactions: [] };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { status, action, change, reason } = body;

    // Combine all doctor input into one string for Comprehend to scan
    const fullInput = [
      action,
      change || "",
      reason || "",
    ]
      .filter(Boolean)
      .join(". ");

    // Layer 1 — AWS Comprehend Medical PHI detection
    const { cleanText, redactions } = await deidentifyWithComprehend(fullInput);

    // Layer 2 — Claude message transformation on clean text
        const prompt = `You are a medical AI with two tasks:

        1. SECONDARY PHI CHECK: The input has been partially de-identified by AWS Comprehend Medical but may still contain PHI that was missed — specifically room numbers, relative dates (tomorrow, next week, in 3 days), ages, and location identifiers. Find anything remaining and add it to the redactions list.

        2. MESSAGE TRANSFORMATION: Produce three versions using only the fully de-identified text.

        Input — Status: ${status} | Partially de-identified notes: ${cleanText}

        Return ONLY this JSON, no markdown:
        {
        "additional_redactions": [{"original": "exact text still containing PHI", "replacement": "[placeholder]", "type": "PHI type"}],
        "raw": "One clinical sentence a doctor would write, fully de-identified",
        "hybrid": "2-3 sentences combining plain English with key clinical values preserved (lab values, procedure names). Start plain, include clinical detail naturally.",
        "context": "2-3 warm fully plain language sentences: what happened, why it is safe, what comes next. No jargon."
        }

        If no additional PHI found, additional_redactions = [].`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");

    const clean = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(clean);

    // Combine Comprehend redactions with result
        const allRedactions = [
      ...redactions,
      ...(result.additional_redactions || []),
    ];

    return NextResponse.json({
      raw: result.raw,
      hybrid: result.hybrid,
      context: result.context,
      hipaa: allRedactions,
    });
  } catch (error) {
    console.error("Generate route error:", error);
    return NextResponse.json(
      { error: "Failed to generate", details: String(error) },
      { status: 500 }
    );
  }
}