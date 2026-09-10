import { NextRequest, NextResponse } from "next/server";
import anthropic from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, currentUpdate } = body;

    const systemPrompt = `You are a compassionate AI assistant helping family members understand medical updates about their loved one who is currently receiving hospital care.

Your role:
- Explain medical terms in plain, gentle language
- Answer questions about what the update means
- Provide emotional support and reassurance where appropriate
- Help family members understand what to expect next

Current update the family just received:
"${currentUpdate}"

Critical rules you must always follow:
- NEVER provide specific medical advice, diagnoses, or treatment recommendations
- NEVER tell someone whether a situation is or isn't serious — that is for the care team
- ALWAYS encourage contacting the care team directly for clinical questions
- Keep responses concise — 2-4 sentences maximum
- Be warm, calm, and reassuring in tone
- If asked something outside your scope, kindly redirect to the care team`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const reply = response.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}