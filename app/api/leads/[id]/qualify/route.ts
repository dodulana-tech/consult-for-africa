import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getNuruContext } from "@/lib/nuruContext";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const anthropic = new Anthropic();

/**
 * POST /api/leads/[id]/qualify
 * Nuru qualifies a lead based on available data.
 */
export const POST = handler(async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return Response.json({ error: "Not found" }, { status: 404 });

  const prompt = `You are Nuru, the internal intelligence system for Consult For Africa (C4A), a premium healthcare management consulting firm embedding execution teams inside hospitals across Africa.

Qualify this lead and provide research intelligence to help the team prepare for outreach.

LEAD DATA:
- Organization: ${lead.organizationName}
- Type: ${lead.organizationType ?? "Unknown"}
- Contact: ${lead.contactName} (${lead.contactRole ?? "role unknown"})
- Email: ${lead.contactEmail ?? "not provided"}
- Country: ${lead.country ?? "Unknown"}, City: ${lead.city ?? "Unknown"}
- Source: ${lead.source}
- Estimated Size: ${lead.estimatedSize ?? "Unknown"}
${lead.inboundMessage ? `\nINBOUND MESSAGE:\n${lead.inboundMessage.substring(0, 2000)}` : ""}
${lead.inboundProjectType ? `\nProject Type Interest: ${lead.inboundProjectType}` : ""}
${lead.maarovaStream ? `\nMaarova Stream Interest: ${lead.maarovaStream}` : ""}
${lead.maarovaLeaderCount ? `\nNumber of Leaders: ${lead.maarovaLeaderCount}` : ""}
${lead.knownPainPoints.length > 0 ? `\nKnown Pain Points:\n${lead.knownPainPoints.map((p) => `- ${p}`).join("\n")}` : ""}
${lead.serviceLineHook ? `\nService Line Hook: ${lead.serviceLineHook}` : ""}
${lead.outreachStrategy ? `\nOutreach Strategy: ${lead.outreachStrategy}` : ""}

C4A SERVICE LINES:
1. Hospital Turnaround & Financial Recovery
2. Strategy, Growth & Commercial Performance
3. Clinical Governance & Accreditation
4. Digital Health & Technology Leadership
5. Fractional Leadership & Executive Secondments
6. Health Systems & Public Sector Advisory
7. Healthcare HR Management (Maarova)

${await getNuruContext()}

Return ONLY valid JSON:
{
  "qualificationScore": "<HOT | WARM | COLD | NOT_FIT>",
  "qualificationRationale": "<2-3 sentences explaining the score>",
  "suggestedServiceLines": ["<matching service line 1>", "<service line 2>"],
  "suggestedPainPoints": ["<likely pain point based on org type and context>"],
  "suggestedDecisionMakers": ["<likely roles to target: e.g. CEO, MD, COO, Board Chair>"],
  "outreachAngle": "<1-2 sentences: how should C4A approach this org? What's the opening hook?>",
  "estimatedEngagementSize": "<SMALL (under N5M) | MEDIUM (N5M-20M) | LARGE (N20M+) | UNKNOWN>",
  "researchNotes": "<any relevant context about this type of org, common challenges, regulatory environment>"
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
      return Response.json({ error: "Qualification failed" }, { status: 500 });
    }

    const parsed = JSON.parse(text.slice(start, end + 1));

    // Update lead with qualification data
    await prisma.lead.update({
      where: { id },
      data: {
        qualificationScore: parsed.qualificationScore ?? null,
        qualificationNotes: parsed.qualificationRationale ?? null,
        knownPainPoints: Array.isArray(parsed.suggestedPainPoints)
          ? [...lead.knownPainPoints, ...parsed.suggestedPainPoints.filter((p: string) => !lead.knownPainPoints.includes(p))]
          : lead.knownPainPoints,
        serviceLineHook: lead.serviceLineHook || (Array.isArray(parsed.suggestedServiceLines) ? parsed.suggestedServiceLines[0] : null),
        estimatedSize: lead.estimatedSize || parsed.estimatedEngagementSize || null,
        decisionMakers: lead.decisionMakers || (Array.isArray(parsed.suggestedDecisionMakers)
          ? parsed.suggestedDecisionMakers.map((role: string) => ({ name: "", role }))
          : null),
        recentNews: lead.recentNews || parsed.researchNotes || null,
        outreachStrategy: lead.outreachStrategy || parsed.outreachAngle || null,
        status: lead.status === "NEW" ? "RESEARCHING" : lead.status,
      },
    });

    return Response.json({ qualification: parsed });
  } catch (err) {
    console.error("[leads/qualify] Nuru qualification failed", err);
    return Response.json({ error: "Qualification failed" }, { status: 500 });
  }
});
