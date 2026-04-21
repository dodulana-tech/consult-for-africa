import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getNuruContext } from "@/lib/nuruContext";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const anthropic = new Anthropic();

/**
 * POST /api/ai/suggest-track-deliverables
 * Nuru suggests deliverables for a specific track within an engagement.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canUse = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canUse) return new Response("Forbidden", { status: 403 });

  const { projectId, trackId } = await req.json();
  if (!projectId || !trackId) return new Response("projectId and trackId required", { status: 400 });

  const track = await prisma.engagementTrack.findFirst({
    where: { id: trackId, engagementId: projectId },
    include: {
      engagement: {
        include: {
          client: { select: { name: true, type: true } },
        },
      },
      deliverables: { select: { name: true, status: true } },
      assignments: {
        where: { status: { in: ["ACTIVE", "PENDING"] } },
        include: { consultant: { select: { name: true } } },
      },
    },
  });

  if (!track) return new Response("Track not found", { status: 404 });

  const nuruContext = await getNuruContext();

  const prompt = `You are Nuru, C4A's internal strategy advisor. Suggest deliverables for this specific workstream track.

ENGAGEMENT: ${track.engagement.name}
CLIENT: ${track.engagement.client.name} (${track.engagement.client.type})
SERVICE TYPE: ${track.engagement.serviceType}
ENGAGEMENT TYPE: ${track.engagement.engagementType}
PROJECT DESCRIPTION: ${track.engagement.description}

TRACK: ${track.name}
TRACK DESCRIPTION: ${track.description ?? "No description yet"}

${track.assignments.length > 0 ? `TEAM ON THIS TRACK:\n${track.assignments.map((a) => `- ${a.consultant.name} (${a.trackRole ?? a.role})`).join("\n")}` : "No team assigned yet."}

${track.deliverables.length > 0 ? `EXISTING DELIVERABLES ON THIS TRACK:\n${track.deliverables.map((d) => `- ${d.name} (${d.status})`).join("\n")}` : "No deliverables yet."}

${nuruContext}

INSTRUCTIONS:
- Suggest 4-8 deliverables specific to this track
- Each deliverable should be a concrete output (report, plan, framework, assessment, etc.)
- Order them logically (discovery/assessment first, then design, then implementation)
- For healthcare consulting, consider what a ${track.engagement.client.type} client would expect
- Be specific to the track scope, not generic project deliverables
- Suggest realistic due dates relative to track start (week offsets)

Return ONLY valid JSON:
{
  "deliverables": [
    {
      "name": "<deliverable name>",
      "description": "<1-2 sentences describing the output and its purpose>",
      "weekOffset": <number of weeks from track start>,
      "category": "<assessment | analysis | design | implementation | training | report>"
    }
  ]
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (response.content[0] as { type: string; text: string }).text.trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end <= start) {
      return Response.json({ error: "Failed to generate suggestions" }, { status: 500 });
    }

    const parsed = JSON.parse(text.slice(start, end + 1));
    return Response.json({ deliverables: parsed.deliverables ?? [] });
  } catch (err) {
    console.error("[ai/suggest-track-deliverables] failed", err);
    return Response.json({ error: "Failed to generate deliverable suggestions" }, { status: 500 });
  }
});
