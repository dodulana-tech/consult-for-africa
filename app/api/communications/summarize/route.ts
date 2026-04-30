import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { isCommsElevated, subjectFilterToWhere, type CommSubjectFilter } from "@/lib/communications";
import Anthropic from "@anthropic-ai/sdk";
import type { CommunicationSubjectType } from "@prisma/client";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface SummaryResult {
  summary: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  openQuestions: string[];
  suggestedNextAction: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  generatedAt: string;
  basedOnCommIds: string[];
}

/**
 * POST /api/communications/summarize
 *
 * Summarize a contact's communication history using Claude Haiku.
 * Cheap (~$0.0001 per call) and fast.
 *
 * Pass subject filter (consultantId, clientId, etc.) to scope.
 *
 * Note: results are NOT cached server-side; the client caches via
 * basedOnCommIds + generatedAt to know when to regenerate.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCommsElevated(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "AI summarization not configured" }, { status: 503 });
  }

  const body = await req.json();
  const filter: CommSubjectFilter = {
    subjectType: body.subjectType as CommunicationSubjectType | undefined,
    consultantId: body.consultantId,
    clientId: body.clientId,
    clientContactId: body.clientContactId,
    applicationId: body.applicationId,
    cadreProfessionalId: body.cadreProfessionalId,
    partnerFirmId: body.partnerFirmId,
    salesAgentId: body.salesAgentId,
    discoveryCallId: body.discoveryCallId,
    maarovaUserId: body.maarovaUserId,
  };

  const where = { ...subjectFilterToWhere(filter), isArchived: false };

  // Pull last 30 comms in occurredAt desc, then reverse for chronological order
  const comms = await prisma.communication.findMany({
    where,
    orderBy: { occurredAt: "desc" },
    take: 30,
    select: {
      id: true,
      type: true,
      direction: true,
      status: true,
      subject: true,
      body: true,
      outcome: true,
      sentiment: true,
      occurredAt: true,
      durationMinutes: true,
      loggedBy: { select: { name: true } },
    },
  });

  if (comms.length === 0) {
    return Response.json({ error: "No communications to summarize" }, { status: 400 });
  }

  // Reverse to chronological for the LLM
  const ordered = comms.slice().reverse();

  // Build the transcript
  const lines = ordered.map((c) => {
    const date = c.occurredAt.toISOString().slice(0, 10);
    const dir = c.direction === "OUTBOUND" ? "→" : c.direction === "INBOUND" ? "←" : "·";
    const author = c.loggedBy.name;
    const subj = c.subject ?? "";
    const bodyPreview = (c.body ?? "").slice(0, 800);
    const outcome = c.outcome ? ` [outcome: ${c.outcome}]` : "";
    return `${date} ${dir} ${c.type} (${author})${subj ? ` "${subj}"` : ""}${outcome}\n${bodyPreview}`;
  });

  const transcript = lines.join("\n\n---\n\n");

  const prompt = `You are an analyst summarizing the communication history between Consult For Africa (CFA, a healthcare management consulting firm) and a contact.

Below is the chronological transcript of their interactions (most recent at the bottom). The contact may be a consultant in CFA's network, a client, an applicant, or a healthcare professional.

Return ONLY valid JSON matching this exact structure:
{
  "summary": "<2-3 sentence summary of where the relationship currently stands>",
  "sentiment": "POSITIVE | NEUTRAL | NEGATIVE",
  "openQuestions": ["<question or pending item>", ...],
  "suggestedNextAction": "<concrete next step CFA should take>",
  "urgency": "LOW | MEDIUM | HIGH"
}

Rules:
- Be concise. Aim for executive briefing density, not narrative.
- "openQuestions" should list things still pending: their unanswered questions, our unmet promises, missed follow-ups.
- "suggestedNextAction" should be a single, specific action with timeframe if relevant.
- "urgency" HIGH only if there is an overdue commitment or active escalation.
- Use British English. Never use em dashes.

TRANSCRIPT:
${transcript}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const firstBlock = response.content[0];
    if (!firstBlock || firstBlock.type !== "text") {
      throw new Error("Unexpected AI response format");
    }

    const text = firstBlock.text.trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) {
      throw new Error("AI did not return JSON");
    }

    const parsed = JSON.parse(text.slice(start, end + 1));

    const result: SummaryResult = {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      sentiment: ["POSITIVE", "NEUTRAL", "NEGATIVE"].includes(parsed.sentiment)
        ? parsed.sentiment
        : "NEUTRAL",
      openQuestions: Array.isArray(parsed.openQuestions)
        ? parsed.openQuestions.slice(0, 6).map(String)
        : [],
      suggestedNextAction: typeof parsed.suggestedNextAction === "string"
        ? parsed.suggestedNextAction
        : "",
      urgency: ["LOW", "MEDIUM", "HIGH"].includes(parsed.urgency) ? parsed.urgency : "LOW",
      generatedAt: new Date().toISOString(),
      basedOnCommIds: comms.map((c) => c.id),
    };

    return Response.json(result);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[comm-summarize] failed:", errMsg);
    return Response.json({ error: `Summarization failed: ${errMsg.slice(0, 100)}` }, { status: 500 });
  }
});
