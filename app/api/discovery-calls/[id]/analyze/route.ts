import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getNuruContext } from "@/lib/nuruContext";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const anthropic = new Anthropic();

/**
 * POST /api/discovery-calls/[id]/analyze
 * Nuru analyzes the discovery call notes and generates structured insights.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const call = await prisma.discoveryCall.findUnique({ where: { id } });
  if (!call) return Response.json({ error: "Not found" }, { status: 404 });

  if (!call.rawNotes && call.problemsIdentified.length === 0 && call.goalsStated.length === 0) {
    return Response.json({ error: "No notes to analyze. Add notes or problems/goals first." }, { status: 400 });
  }

  const prompt = `You are Nuru, the internal intelligence system for Consult For Africa (CFA), a premium healthcare management consulting firm that embeds execution teams inside hospitals and health systems across Africa.

Analyze the following discovery call notes and produce structured insights to help CFA determine the right engagement approach.

DISCOVERY CALL DATA:
- Organization: ${call.organizationName}
- Contact: ${call.contactName}
- Organization Type: ${call.organizationType ?? "Not specified"}
${call.currentState ? `- Current State: ${call.currentState}` : ""}
${call.budgetSignals ? `- Budget Signals: ${call.budgetSignals}` : ""}
${call.urgencyLevel ? `- Urgency: ${call.urgencyLevel}` : ""}

${call.rawNotes ? `RAW NOTES:\n${call.rawNotes.substring(0, 5000)}` : ""}

${call.problemsIdentified.length > 0 ? `PROBLEMS IDENTIFIED:\n${call.problemsIdentified.map((p, i) => `${i + 1}. ${p}`).join("\n")}` : ""}

${call.goalsStated.length > 0 ? `GOALS STATED:\n${call.goalsStated.map((g, i) => `${i + 1}. ${g}`).join("\n")}` : ""}

${call.stakeholders.length > 0 ? `STAKEHOLDERS MENTIONED:\n${call.stakeholders.join(", ")}` : ""}

CFA SERVICE LINES (match problems to these):
1. Hospital Turnaround & Financial Recovery: Revenue capture, cost discipline, theatre/clinic productivity, cashflow stabilization
2. Strategy, Growth & Commercial Performance: Service-line alignment, referral networks, commercial strategy, revenue diversification
3. Clinical Governance & Accreditation: JCI/COHSASA/SafeCare readiness, patient safety systems, clinical audit frameworks
4. Digital Health & Technology Leadership: HIS selection, EMR workflows, CTO-as-a-Service, digital strategy
5. Fractional Leadership & Executive Secondments: Interim CEO/COO/CMO/CTO placements (6-18 months)
6. Health Systems & Public Sector Advisory: Hospital network planning, policy-to-implementation, NGO/development partner work
7. Healthcare HR Management (Maarova): Physician/nurse retention, executive search, leadership development

${await getNuruContext()}

Return ONLY valid JSON:
{
  "summary": "<3-4 sentence executive summary of the potential engagement opportunity>",
  "serviceLineMatches": ["<service line 1>", "<service line 2>"],
  "suggestedScope": "<2-3 paragraph suggested engagement scope, including estimated duration and team composition>",
  "followUpActions": ["<next step 1>", "<next step 2>", "<next step 3>"],
  "suggestedQuestions": ["<question the consultant should still ask>", "<question 2>"],
  "redFlags": ["<any concerns or risks noted>"],
  "estimatedEngagementSize": "<SMALL (under N5M) | MEDIUM (N5M-20M) | LARGE (N20M+) | UNKNOWN>",
  "readinessScore": <integer 1-10 representing how ready this prospect is to engage>
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
      return Response.json({ error: "Analysis failed to produce structured output" }, { status: 500 });
    }

    const parsed = JSON.parse(text.slice(start, end + 1));

    // Update the discovery call with Nuru's analysis
    const updated = await prisma.discoveryCall.update({
      where: { id },
      data: {
        aiSummary: parsed.summary ?? null,
        aiServiceLineMatch: Array.isArray(parsed.serviceLineMatches) ? parsed.serviceLineMatches : [],
        aiSuggestedScope: parsed.suggestedScope ?? null,
        aiFollowUpActions: Array.isArray(parsed.followUpActions) ? parsed.followUpActions : [],
        aiRedFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
      },
    });

    return Response.json({
      analysis: {
        summary: parsed.summary,
        serviceLineMatches: parsed.serviceLineMatches,
        suggestedScope: parsed.suggestedScope,
        followUpActions: parsed.followUpActions,
        suggestedQuestions: parsed.suggestedQuestions,
        redFlags: parsed.redFlags,
        estimatedEngagementSize: parsed.estimatedEngagementSize,
        readinessScore: parsed.readinessScore,
      },
      call: updated,
    });
  } catch (err) {
    console.error("[discovery-calls/analyze] Nuru analysis failed", err);
    return Response.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
