import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canGenerate = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canGenerate) return new Response("Forbidden", { status: 403 });

  const {
    clientName,
    contactName,
    clientType,
    problems,
    goals,
    budgetRange,
    timeline,
    serviceType,
    projectName,
  }: {
    clientName: string;
    contactName: string;
    clientType?: string;
    problems: string[];
    goals: string[];
    budgetRange: string;
    timeline: string;
    serviceType?: string;
    projectName?: string;
  } = await req.json();

  if (!clientName || !problems?.length || !goals?.length) {
    return new Response("clientName, problems, and goals are required", { status: 400 });
  }

  const systemPrompt = `You are a senior management consultant at Consult For Africa, specializing in healthcare operations, hospital management, and health systems strengthening across Nigeria and Africa.

Your proposals are:
- Direct and results-focused
- Grounded in Nigerian healthcare context (use Naira NGN, reference Lagos/Abuja/Port Harcourt contexts)
- Specific with quantified outcomes where possible
- Professional but accessible
- Never use em dashes (use commas or colons instead)

Write in sections. Be concise but substantive.`;

  const userPrompt = `Generate a professional consulting proposal with the following details:

CLIENT: ${clientName}
CONTACT: ${contactName || "Management Team"}
CLIENT TYPE: ${clientType?.replace(/_/g, " ") || "Private Hospital"}
SERVICE TYPE: ${serviceType?.replace(/_/g, " ") || "Hospital Operations"}
PROJECT: ${projectName || `${clientName} Consulting Engagement`}

KEY PROBLEMS IDENTIFIED:
${problems.map((p, i) => `${i + 1}. ${p}`).join("\n")}

CLIENT GOALS:
${goals.map((g, i) => `${i + 1}. ${g}`).join("\n")}

BUDGET RANGE: ${budgetRange}
TIMELINE: ${timeline}

Generate a JSON object with these exact keys:
{
  "executiveSummary": "2-3 paragraphs, compelling, client-focused, quantify potential outcomes",
  "challengeStatement": "1-2 paragraphs diagnosing the core problem",
  "proposedApproach": "3-4 phases, each with: phase name, duration, key activities (3-5 bullets), deliverables",
  "teamComposition": "Description of team structure: Lead Consultant, domain specialists, support roles",
  "keyDeliverables": ["list", "of", "4-6", "specific", "deliverables"],
  "investmentSummary": "Explanation of value for ${budgetRange}, payment structure suggestion (30/40/30 milestone-based), ROI framing",
  "whyConsultForAfrica": "2-3 sentences on unique value proposition for this specific engagement",
  "nextSteps": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
}

The proposedApproach should be a structured string describing phases clearly.
Return ONLY the JSON object, no other text.`;

  let content: Record<string, unknown>;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = (message.content[0] as { text: string }).text;
    // Extract JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    content = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("Claude proposal generation error:", err);
    return new Response("Failed to generate proposal. Please try again.", { status: 500 });
  }

  // Save proposal
  const saved = await prisma.generatedProposal.create({
    data: {
      clientName,
      projectName: projectName || `${clientName} Engagement`,
      inputData: JSON.parse(JSON.stringify({ clientName, contactName, clientType, problems, goals, budgetRange, timeline, serviceType })),
      content: JSON.parse(JSON.stringify(content)),
      createdById: session.user.id,
    },
  });

  return Response.json({
    proposalId: saved.id,
    content,
    metadata: {
      clientName,
      projectName: projectName || `${clientName} Engagement`,
      budgetRange,
      timeline,
      generatedAt: new Date().toISOString(),
    },
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canView = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canView) return new Response("Forbidden", { status: 403 });

  const proposals = await prisma.generatedProposal.findMany({
    where: { createdById: session.user.id },
    select: {
      id: true, clientName: true, projectName: true, status: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return Response.json({ proposals: proposals.map((p) => ({
    ...p, createdAt: p.createdAt.toISOString(),
  })) });
}
