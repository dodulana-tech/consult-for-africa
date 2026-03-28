import { auth } from "@/auth";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ELEVATED_ROLES = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

/**
 * POST /api/proposals/assist
 * Takes free-text (discovery call notes, meeting brief, etc.) and uses
 * Claude Haiku to structure it into proposal form fields.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ELEVATED_ROLES.includes(session.user.role)) {
    return Response.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const freeText = typeof body.freeText === "string" ? body.freeText.trim() : "";
  if (!freeText || freeText.length < 20) {
    return Response.json(
      { error: "Please provide at least a short description (20+ characters)." },
      { status: 400 },
    );
  }

  const systemPrompt = `You are a senior consultant at Consult For Africa, a healthcare management consulting firm operating across Nigeria and Africa. Your job is to parse free-text notes from discovery calls, meeting briefs, or rough descriptions and extract structured proposal fields.

Rules:
- Never use em dashes in any text output. Use commas, colons, or semicolons instead.
- Be specific and professional.
- If a field cannot be inferred from the text, return an empty string or empty array as appropriate.
- For serviceType, pick the best match from this list: HOSPITAL_OPERATIONS, TURNAROUND, EMBEDDED_LEADERSHIP, CLINICAL_GOVERNANCE, DIGITAL_HEALTH, HEALTH_SYSTEMS, DIASPORA_EXPERTISE, EM_AS_SERVICE. If unsure, leave empty string.
- For clientType, pick from: PRIVATE_ELITE, PRIVATE_MIDTIER, GOVERNMENT, DEVELOPMENT. If unsure, leave empty string.
- Return ONLY a valid JSON object, no other text.`;

  const userPrompt = `Parse the following free-text into structured proposal fields. Return a JSON object with these exact keys:

{
  "clientName": "Name of the client organisation",
  "contactName": "Primary contact person name and title if mentioned",
  "clientType": "One of PRIVATE_ELITE, PRIVATE_MIDTIER, GOVERNMENT, DEVELOPMENT or empty string",
  "serviceType": "One of HOSPITAL_OPERATIONS, TURNAROUND, EMBEDDED_LEADERSHIP, CLINICAL_GOVERNANCE, DIGITAL_HEALTH, HEALTH_SYSTEMS, DIASPORA_EXPERTISE, EM_AS_SERVICE or empty string",
  "projectName": "Suggested project name based on the engagement",
  "budgetRange": "Budget if mentioned, e.g. NGN 40-50M",
  "timeline": "Timeline if mentioned, e.g. 12 weeks",
  "problems": ["Array of key problems/challenges identified"],
  "goals": ["Array of client goals/objectives"]
}

FREE TEXT:
${freeText}

Return ONLY the JSON object.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = (message.content[0] as { text: string }).text;
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "");
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[proposals/assist] No JSON found in response:", raw.slice(0, 500));
      return Response.json({ error: "Failed to parse response" }, { status: 500 });
    }

    const structured = JSON.parse(jsonMatch[0]);

    // Validate and sanitize output
    const result = {
      clientName: typeof structured.clientName === "string" ? structured.clientName : "",
      contactName: typeof structured.contactName === "string" ? structured.contactName : "",
      clientType: typeof structured.clientType === "string" ? structured.clientType : "",
      serviceType: typeof structured.serviceType === "string" ? structured.serviceType : "",
      projectName: typeof structured.projectName === "string" ? structured.projectName : "",
      budgetRange: typeof structured.budgetRange === "string" ? structured.budgetRange : "",
      timeline: typeof structured.timeline === "string" ? structured.timeline : "",
      problems: Array.isArray(structured.problems)
        ? structured.problems.filter((p: unknown) => typeof p === "string" && p.trim())
        : [],
      goals: Array.isArray(structured.goals)
        ? structured.goals.filter((g: unknown) => typeof g === "string" && g.trim())
        : [],
    };

    return Response.json(result);
  } catch (err) {
    console.error("[proposals/assist] Error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: `Failed to process: ${msg}` }, { status: 500 });
  }
}
