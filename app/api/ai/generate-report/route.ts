import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeForPrompt } from "@/lib/sanitize";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { handler } from "@/lib/api-handler";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const REPORT_TYPE_LABELS: Record<string, string> = {
  operations_assessment: "Operations Assessment",
  revenue_cycle_audit: "Revenue Cycle Audit",
  clinical_governance: "Clinical Governance Review",
  health_systems: "Health Systems Strengthening",
  strategic_review: "Strategic Review",
  progress_update: "Progress Update Report",
};

const HOSPITAL_TYPE_LABELS: Record<string, string> = {
  private_elite: "Private Elite Hospital",
  private_midtier: "Private Mid-Tier Hospital",
  government: "Government / Public Hospital",
  faith_based: "Faith-Based Hospital",
  ngo_donor: "NGO / Donor-Funded Facility",
};

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const allowedRoles = ["CONSULTANT", "ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];
  if (!allowedRoles.includes(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const body: {
    projectId?: string;
    reportType: string;
    clientName: string;
    hospitalType: string;
    keyFindings: string;
    recommendations: string;
    timeline?: string;
    budget?: string;
  } = await req.json();

  const { projectId, reportType, clientName, hospitalType, keyFindings, recommendations, timeline, budget } = body;

  if (!reportType || !clientName || !hospitalType || !keyFindings || !recommendations) {
    return new Response("reportType, clientName, hospitalType, keyFindings, and recommendations are required", { status: 400 });
  }

  // If projectId provided, fetch project context
  let projectContext = "";
  if (projectId) {
    try {
      const project = await prisma.engagement.findUnique({
        where: { id: projectId },
        select: { name: true },
      });
      if (project) {
        projectContext = `\nPROJECT: ${project.name}`;
      }
    } catch {
      // Non-fatal: continue without project context
    }
  }

  const reportTypeLabel = REPORT_TYPE_LABELS[reportType] ?? reportType;
  const hospitalTypeLabel = HOSPITAL_TYPE_LABELS[hospitalType] ?? hospitalType;

  const systemPrompt = `You are a senior healthcare management consultant at Consult For Africa, generating a professional consulting report.

Your reports are:
- Executive-level: clear, concise, actionable
- Nigeria-specific: reference NHIS, MDCN, accreditation standards, NGN currency, local benchmarks
- Evidence-based: use numbers, percentages, and specific findings
- Solutions-focused: every problem paired with a concrete recommendation

Write in formal British English (this is a Nigerian professional context). Do not use markdown headers. Use numbered sections only.`;

  const userPrompt = `Generate a professional consulting report.

REPORT TYPE: ${reportTypeLabel}
CLIENT: ${clientName}
HOSPITAL TYPE: ${hospitalTypeLabel}${projectContext}${timeline ? `\nTIMELINE: ${timeline}` : ""}${budget ? `\nBUDGET CONTEXT: ${budget}` : ""}

CONSULTANT'S KEY FINDINGS:
${sanitizeForPrompt(keyFindings)}

CONSULTANT'S RECOMMENDATIONS:
${sanitizeForPrompt(recommendations)}

Generate a complete, polished report with this structure as JSON:
{
  "reportTitle": "specific title based on work done",
  "preparedFor": "${clientName}",
  "reportType": "${reportType}",
  "executiveSummary": "3-4 paragraph executive summary suitable for the CEO/board. Lead with the most important finding. Include financial impact where possible.",
  "situationAssessment": "Current state analysis in 3-4 paragraphs. Be specific about what was found.",
  "keyFindings": [
    {
      "finding": "specific finding title",
      "detail": "detailed explanation with specifics",
      "impact": "financial or operational impact",
      "severity": "critical|high|medium|low"
    }
  ],
  "recommendations": [
    {
      "title": "recommendation title",
      "rationale": "why this is needed",
      "actions": ["specific step 1", "specific step 2", "specific step 3"],
      "expectedOutcome": "measurable outcome",
      "priority": "immediate|30days|90days|6months",
      "estimatedImpact": "quantified impact if possible"
    }
  ],
  "implementationRoadmap": [
    { "phase": "Phase 1 (Month 1-2)", "activities": ["activity 1", "activity 2"], "milestone": "milestone description" },
    { "phase": "Phase 2 (Month 3-4)", "activities": ["activity 1", "activity 2"], "milestone": "milestone description" },
    { "phase": "Phase 3 (Month 5-6)", "activities": ["activity 1", "activity 2"], "milestone": "milestone description" }
  ],
  "conclusion": "1-2 paragraph closing statement",
  "appendixNotes": "any technical notes, data sources, or methodology"
}

Return ONLY the JSON object, no other text.`;

  let report: Record<string, unknown>;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw = (message.content[0] as { text: string }).text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    report = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("Claude report generation error:", err);
    return new Response("Failed to generate report. Please try again.", { status: 500 });
  }

  return Response.json({
    report,
    metadata: {
      clientName,
      reportType,
      reportTypeLabel,
      hospitalType,
      hospitalTypeLabel,
      generatedAt: new Date().toISOString(),
    },
  });
});
