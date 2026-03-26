import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getNuruContext } from "@/lib/nuruContext";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const anthropic = new Anthropic();

/**
 * POST /api/ai/suggest-tracks
 * Nuru suggests workstream tracks for an engagement based on its type, scope, and context.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canUse = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canUse) return new Response("Forbidden", { status: 403 });

  const { projectId } = await req.json();
  if (!projectId) return new Response("projectId required", { status: 400 });

  const engagement = await prisma.engagement.findUnique({
    where: { id: projectId },
    include: {
      client: { select: { name: true, type: true } },
      deliverables: { select: { name: true, status: true } },
      phases: { select: { name: true, status: true }, orderBy: { order: "asc" } },
      tracks: { select: { name: true } },
    },
  });

  if (!engagement) return new Response("Engagement not found", { status: 404 });

  const nuruContext = await getNuruContext();

  const prompt = `You are Nuru, CFA's internal strategy advisor. Suggest workstream tracks for this engagement.

ENGAGEMENT:
- Name: ${engagement.name}
- Client: ${engagement.client.name} (${engagement.client.type})
- Type: ${engagement.engagementType}
- Service: ${engagement.serviceType}
- Description: ${engagement.description}
- Timeline: ${engagement.startDate.toISOString().split("T")[0]} to ${engagement.endDate?.toISOString().split("T")[0] ?? "ongoing"}
- Budget: ${engagement.budgetAmount ? `${engagement.budgetCurrency} ${Number(engagement.budgetAmount).toLocaleString()}` : "Not set"}

${engagement.deliverables.length > 0 ? `EXISTING DELIVERABLES:\n${engagement.deliverables.map((d) => `- ${d.name} (${d.status})`).join("\n")}` : "No deliverables yet."}

${engagement.phases.length > 0 ? `EXISTING PHASES:\n${engagement.phases.map((p) => `- ${p.name} (${p.status})`).join("\n")}` : ""}

${engagement.tracks.length > 0 ? `EXISTING TRACKS (avoid duplicates):\n${engagement.tracks.map((t) => `- ${t.name}`).join("\n")}` : ""}

${nuruContext}

INSTRUCTIONS:
- Suggest 3-6 workstream tracks that organize the work logically
- Each track should be a parallel workstream (not sequential phases)
- Consider the client type, service type, and engagement scope
- For healthcare consulting, think about: clinical operations, financial performance, HR/talent, quality/accreditation, digital/IT, governance, patient experience, supply chain, etc.
- Each track should have a clear owner (single track lead) with possible support roles
- Suggest what kind of consultant each track needs (seniority, skills)

Return ONLY valid JSON:
{
  "tracks": [
    {
      "name": "<track name, e.g. Clinical Operations>",
      "description": "<1-2 sentences describing the workstream scope>",
      "suggestedRole": "<e.g. Senior Consultant - Clinical Operations>",
      "suggestedSkills": ["<skill1>", "<skill2>"],
      "suggestedDeliverables": ["<deliverable name 1>", "<deliverable name 2>"],
      "estimatedWeeks": <number>
    }
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (response.content[0] as { type: string; text: string }).text.trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end <= start) {
      return Response.json({ error: "Failed to generate suggestions" }, { status: 500 });
    }

    const parsed = JSON.parse(text.slice(start, end + 1));
    return Response.json({ tracks: parsed.tracks ?? [] });
  } catch (err) {
    console.error("[ai/suggest-tracks] failed", err);
    return Response.json({ error: "Failed to generate track suggestions" }, { status: 500 });
  }
}
