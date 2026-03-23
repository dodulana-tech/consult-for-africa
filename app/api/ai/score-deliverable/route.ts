import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canScore = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canScore) return new Response("Forbidden", { status: 403 });

  const { deliverableId } = await req.json();
  if (!deliverableId) return new Response("deliverableId required", { status: 400 });

  const deliverable = await prisma.deliverable.findUnique({
    where: { id: deliverableId },
    include: {
      engagement: {
        select: {
          name: true, serviceType: true, description: true,
          client: { select: { name: true, type: true } },
        },
      },
      assignment: {
        include: {
          consultant: {
            select: {
              name: true,
              consultantProfile: { select: { title: true, yearsExperience: true, expertiseAreas: true } },
            },
          },
        },
      },
    },
  });

  if (!deliverable) return new Response("Deliverable not found", { status: 404 });

  const consultant = deliverable.assignment?.consultant;
  const profile = consultant?.consultantProfile;

  const prompt = `You are an expert management consulting reviewer at Consult For Africa. Evaluate this deliverable submission.

PROJECT: ${deliverable.engagement.name} (${deliverable.engagement.serviceType.replace(/_/g, " ")})
CLIENT: ${deliverable.engagement.client.name} (${deliverable.engagement.client.type.replace(/_/g, " ")})
PROJECT CONTEXT: ${deliverable.engagement.description}

DELIVERABLE NAME: ${deliverable.name}
DELIVERABLE DESCRIPTION: ${deliverable.description}
CONSULTANT: ${consultant?.name ?? "Unknown"} ${profile ? `(${profile.title}, ${profile.yearsExperience} yrs exp, expertise: ${profile.expertiseAreas.join(", ")})` : ""}
VERSION: v${deliverable.version}
${deliverable.fileUrl ? "FILE: Attached (not parseable in this context)" : "NOTE: No file attached yet, assess based on deliverable description only"}

Score this deliverable on the following criteria (1-5 each). For each criterion, provide:
- A score (integer 1-5)
- One sentence of specific, actionable feedback

Also identify any red flags that would require revision before client delivery.

Return ONLY a JSON object with this exact structure:
{
  "scores": {
    "technical": { "score": 4, "feedback": "..." },
    "actionability": { "score": 3, "feedback": "..." },
    "nigerianContext": { "score": 4, "feedback": "..." },
    "clientReady": { "score": 3, "feedback": "..." }
  },
  "overallScore": 3.5,
  "overallAssessment": "2-3 sentence summary of the deliverable quality",
  "redFlags": ["issue 1", "issue 2"],
  "recommendation": "APPROVE" | "REVISE" | "NEEDS_WORK",
  "suggestedImprovements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"]
}

Scoring guide:
5 = Exceptional, exceeds expectations
4 = Good, meets expectations with minor gaps
3 = Adequate, needs some improvement
2 = Below standard, significant revision needed
1 = Unacceptable, major rework required

Recommendation guide:
APPROVE = Overall 4+, no red flags
REVISE = 3-4 average, minor issues to fix
NEEDS_WORK = Below 3 or critical red flags`;

  let aiScore: {
    scores: Record<string, { score: number; feedback: string }>;
    overallScore: number;
    overallAssessment: string;
    redFlags: string[];
    recommendation: string;
    suggestedImprovements: string[];
  };

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { text: string }).text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    aiScore = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("AI scoring error:", err);
    return new Response("Failed to score deliverable. Please try again.", { status: 500 });
  }

  return Response.json({ score: aiScore, deliverableId });
}
