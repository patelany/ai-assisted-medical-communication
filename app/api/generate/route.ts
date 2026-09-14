import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { validateCSRF } from "@/lib/csrf";
import { auditLog } from "@/lib/auditLog";
import {
  ComprehendMedicalClient,
  DetectPHICommand,
} from "@aws-sdk/client-comprehendmedical";
import Anthropic from "@anthropic-ai/sdk";

const comprehendClient = new ComprehendMedicalClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const anthropicClient = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MEDICAL_WHITELIST = new Set([
  "ICU", "ER", "OR", "ED", "CCU", "NICU", "PICU", "MICU",
  "IV", "BP", "HR", "SpO2", "O2", "CO2", "INR", "WBC",
  "RBC", "CBC", "EKG", "ECG", "MRI", "CT", "PET", "NPO",
  "PRN", "DNR", "DNI", "CPR", "AED", "EEG", "EMG",
]);

function sanitizeInput(input: string): string {
  return input
    .replace(/\[INST\]/gi, "")
    .replace(/\[\/INST\]/gi, "")
    .replace(/<s>/gi, "")
    .replace(/<\/s>/gi, "")
    .replace(/###/g, "")
    .replace(/system:/gi, "")
    .replace(/assistant:/gi, "")
    .replace(/human:/gi, "")
    .replace(/ignore previous instructions/gi, "")
    .replace(/ignore all previous/gi, "")
    .trim()
    .slice(0, 2000);
}

async function deidentifyWithComprehend(text: string): Promise<{
  deidentified: string;
  redactions: { original: string; replacement: string; type: string }[];
}> {
  const command = new DetectPHICommand({ Text: text });
  const response = await comprehendClient.send(command);

  const entities = response.Entities || [];
  const redactions: { original: string; replacement: string; type: string }[] = [];

  const sorted = [...entities].sort(
    (a, b) => (b.BeginOffset || 0) - (a.BeginOffset || 0)
  );

  let result = text;

  for (const entity of sorted) {
    const original = entity.Text || "";
    const type = entity.Type || "PHI";

    if (MEDICAL_WHITELIST.has(original.toUpperCase().trim())) {
      continue;
    }

    const replacement = `[${type.toLowerCase().replace(/_/g, " ")}]`;
    redactions.push({ original, replacement, type });

    result =
      result.slice(0, entity.BeginOffset) +
      replacement +
      result.slice(entity.EndOffset);
  }

  return { deidentified: result, redactions };
}

async function secondaryDeidentify(text: string): Promise<string> {
  const response = await anthropicClient.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are a HIPAA de-identification assistant. Review the following clinical text and remove any remaining identifying information that was missed, including:
- Relative dates ("tomorrow", "next Tuesday", "in 3 days")
- Room numbers or specific locations within a facility
- Any other implicit identifiers

Replace removed items with generic placeholders like [date] or [location].
Medical terms, abbreviations, and clinical values (like INR 2.8, WBC 8.2) should NOT be removed.

Return ONLY the de-identified text with no explanation.

Text: ${text}`,
      },
    ],
  });

  return response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");
}

async function generateMessages(
  deidentifiedText: string,
  status: string
): Promise<{ raw: string; hybrid: string; context: string }> {
  const response = await anthropicClient.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a medical communication assistant. Generate three versions of a family update based on this de-identified clinical information:

Clinical Input: ${deidentifiedText}
Patient Status: ${status}

Generate exactly three versions:

VERSION_RAW: Write a precise clinical update using medical terminology. Be accurate and detailed. Keep clinical values (INR 2.8, WBC 8.2, etc.).

VERSION_HYBRID: Write a plain-language update that a non-medical family member can understand, but preserve key clinical values (like "INR of 2.8" or "WBC count of 8.2"). Balance clarity with clinical accuracy.

VERSION_CONTEXT: Write a warm, reassuring update in fully plain language with no medical jargon or clinical values. Focus on what the family needs to know emotionally and practically.

Format your response exactly like this:
VERSION_RAW: [text]
VERSION_HYBRID: [text]
VERSION_CONTEXT: [text]`,
      },
    ],
  });

  const content = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");

  const rawMatch = content.match(/VERSION_RAW:\s*([\s\S]*?)(?=VERSION_HYBRID:|$)/);
  const hybridMatch = content.match(/VERSION_HYBRID:\s*([\s\S]*?)(?=VERSION_CONTEXT:|$)/);
  const contextMatch = content.match(/VERSION_CONTEXT:\s*([\s\S]*?)$/);

  return {
    raw: rawMatch?.[1]?.trim() || "",
    hybrid: hybridMatch?.[1]?.trim() || "",
    context: contextMatch?.[1]?.trim() || "",
  };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting — 10 requests per minute per IP
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const { success } = rateLimit(`generate:${ip}`, 10, 60 * 1000);
    if (!success) {
      await auditLog("update_generated", { success: false, reason: "rate_limited" }, ip);
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    // CSRF protection
    if (!validateCSRF(request)) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, action, change, reason } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Planned action is required" },
        { status: 400 }
      );
    }

    const sanitizedAction = sanitizeInput(action || "");
    const sanitizedChange = sanitizeInput(change || "");
    const sanitizedReason = sanitizeInput(reason || "");

    const combinedInput = [
      sanitizedAction,
      sanitizedChange && `Change in plan: ${sanitizedChange}`,
      sanitizedReason && `Reason: ${sanitizedReason}`,
    ]
      .filter(Boolean)
      .join(". ");

    const { deidentified, redactions } = await deidentifyWithComprehend(combinedInput);
    const fullyDeidentified = await secondaryDeidentify(deidentified);
    const messages = await generateMessages(fullyDeidentified, status);

    await auditLog(
      "update_generated",
      {
        success: true,
        status,
        redactionCount: redactions.length,
        hasChange: !!sanitizedChange,
        hasReason: !!sanitizedReason,
      },
      ip
    );

    return NextResponse.json({
      raw: messages.raw,
      hybrid: messages.hybrid,
      context: messages.context,
      hipaa: redactions,
    });
  } catch (error: any) {
    console.error("Generate route error:", error);
    return NextResponse.json(
      { error: "Failed to generate messages", details: error.message },
      { status: 500 }
    );
  }
}