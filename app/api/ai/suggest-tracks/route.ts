import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getNuruContext } from "@/lib/nuruContext";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const maxDuration = 30;

const anthropic = new Anthropic();

/**
 * POST /api/ai/suggest-tracks
 * Nuru suggests MECE workstream tracks for an engagement based on its type, scope, and context.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canUse = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canUse) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { projectId } = await req.json();
  if (!projectId) return Response.json({ error: "projectId required" }, { status: 400 });

  const engagement = await prisma.engagement.findUnique({
    where: { id: projectId },
    include: {
      client: { select: { name: true, type: true } },
      deliverables: { select: { name: true, status: true } },
      phases: { select: { name: true, status: true }, orderBy: { order: "asc" } },
      tracks: { select: { name: true } },
    },
  });

  if (!engagement) return Response.json({ error: "Engagement not found" }, { status: 404 });

  const nuruContext = await getNuruContext();

  const prompt = `You are Nuru, C4A's internal strategy advisor. Suggest MECE workstream tracks for this engagement.

ENGAGEMENT:
- Name: ${engagement.name}
- Client: ${engagement.client.name} (${engagement.client.type})
- Type: ${engagement.engagementType}
- Service: ${engagement.serviceType}
- Description: ${(engagement.description || "").substring(0, 500)}
- Timeline: ${engagement.startDate.toISOString().split("T")[0]} to ${engagement.endDate?.toISOString().split("T")[0] ?? "ongoing"}
- Budget: ${engagement.budgetAmount ? `${engagement.budgetCurrency} ${Number(engagement.budgetAmount).toLocaleString()}` : "Not set"}

${engagement.deliverables.length > 0 ? `DELIVERABLES:\n${engagement.deliverables.map((d) => `- ${d.name} (${d.status})`).join("\n")}` : "No deliverables yet."}

${engagement.phases.length > 0 ? `PHASES:\n${engagement.phases.map((p) => `- ${p.name} (${p.status})`).join("\n")}` : ""}

${engagement.tracks.length > 0 ? `EXISTING TRACKS (avoid duplicates):\n${engagement.tracks.map((t) => `- ${t.name}`).join("\n")}` : ""}

${nuruContext}

CRITICAL REQUIREMENTS - MECE TRACKS:
Your tracks MUST be MECE (Mutually Exclusive, Collectively Exhaustive):

1. MUTUALLY EXCLUSIVE: No two tracks should overlap in scope. Every deliverable, activity, and responsibility must belong to exactly one track. If "clinical governance" is a track, no other track should include clinical governance activities.

2. COLLECTIVELY EXHAUSTIVE: Together, the tracks must cover 100% of the engagement scope. Nothing in the project description, deliverables, or expected outcomes should fall outside of a track. Ask yourself: "If we completed all tracks, would the full engagement be delivered?"

3. VALIDATION CHECK before returning:
   - Can each deliverable be assigned to exactly one track? If not, tracks overlap.
   - Does the project description mention any work area not covered by a track? If so, tracks are incomplete.
   - Would a consulting engagement manager see gaps or overlaps? Fix them.

ADDITIONAL RULES:
- Suggest 4-7 workstream tracks that organize the work logically
- Each track is a parallel workstream (not sequential phases)
- Consider the client type, service type, and engagement scope
- For healthcare: clinical operations, financial performance, HR/talent, quality/accreditation, digital/IT, governance, patient experience, supply chain, etc.
- Name tracks clearly so scope boundaries are obvious
- No em dashes in any text

Return ONLY valid JSON:
{
  "tracks": [
    {
      "name": "<track name>",
      "description": "<1-2 sentences describing the workstream scope and boundaries>",
      "suggestedRole": "<e.g. Senior Consultant - Clinical Operations>",
      "suggestedSkills": ["<skill1>", "<skill2>"],
      "suggestedDeliverables": ["<deliverable 1>", "<deliverable 2>"],
      "estimatedWeeks": <number>
    }
  ],
  "meceValidation": "<1 sentence confirming tracks are MECE and any notes on boundary decisions>"
}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
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
    return Response.json({ tracks: parsed.tracks ?? [], meceValidation: parsed.meceValidation ?? null });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ai/suggest-tracks] failed", msg, err);
    return Response.json({ error: "Failed to generate track suggestions", detail: msg }, { status: 500 });
  }
});
