import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODULE_LABELS: Record<string, string> = {
  DISC: "Behavioural Style (DISC)",
  VALUES_DRIVERS: "Values and Motivational Drivers",
  EMOTIONAL_INTEL: "Emotional Intelligence",
  CILTI: "Clinical Leadership and Team Impact",
  THREE_SIXTY: "360-Degree Feedback",
  CULTURE_TEAM: "Culture and Team Dynamics",
};

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const maarovaSession = await getMaarovaSession();
  if (!maarovaSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  // Fetch the assessment session and verify ownership
  const assessmentSession = await prisma.maarovaAssessmentSession.findUnique({
    where: { id: sessionId },
    include: {
      user: true,
      moduleResponses: {
        include: {
          module: true,
        },
      },
    },
  });

  if (!assessmentSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (assessmentSession.userId !== maarovaSession.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (assessmentSession.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Assessment must be completed before generating a report" },
      { status: 400 }
    );
  }

  // Check for existing report
  const existingReport = await prisma.maarovaReport.findUnique({
    where: { sessionId },
  });

  if (existingReport && existingReport.status === "READY") {
    return NextResponse.json({ report: existingReport });
  }

  // Create or get the report record in GENERATING state
  const reportRecord = existingReport
    ? await prisma.maarovaReport.update({
        where: { id: existingReport.id },
        data: { status: "GENERATING" },
      })
    : await prisma.maarovaReport.create({
        data: {
          sessionId,
          userId: assessmentSession.userId,
          status: "GENERATING",
        },
      });

  // Build score summary for the prompt
  const user = assessmentSession.user;
  const scoreLines: string[] = [];

  for (const mr of assessmentSession.moduleResponses) {
    const label = MODULE_LABELS[mr.module.type] ?? mr.module.name;
    const scores = mr.scaledScores as Record<string, number> | null;
    if (!scores) continue;

    scoreLines.push(`\n${label}:`);
    for (const [dimension, score] of Object.entries(scores)) {
      scoreLines.push(`  - ${dimension}: ${score}/100`);
    }
  }

  const demographicContext = [
    user.title ? `Title: ${user.title}` : null,
    user.department ? `Department: ${user.department}` : null,
    user.clinicalBackground
      ? `Clinical Background: ${user.clinicalBackground}`
      : null,
    user.yearsInHealthcare != null
      ? `Years in Healthcare: ${user.yearsInHealthcare}`
      : null,
    user.yearsInRole != null ? `Years in Current Role: ${user.yearsInRole}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `You are a senior organisational psychologist at Consult for Africa generating a Maarova leadership profile report for an African healthcare leader. Your reports are psychometrically grounded, contextually sensitive to African healthcare, actionable, written in formal British English, and empathetic but honest. Never use em dashes in your writing. Use commas, semicolons, colons, or separate sentences instead.`;

  const userPrompt = `Generate a comprehensive leadership profile report for the following healthcare leader.

LEADER PROFILE:
Name: ${user.name}
${demographicContext}

ASSESSMENT SCORES (scaled 0-100):
${scoreLines.join("\n")}

Based on these assessment results, generate a detailed leadership profile report as JSON with this exact structure:

{
  "executiveSummary": "A 3-4 paragraph executive summary of the leader's overall profile. Lead with their dominant strengths, then contextualise within African healthcare leadership. Be specific about what the scores reveal.",
  "strengthsAnalysis": "A 3-4 paragraph analysis of the leader's key strengths based on their highest-scoring dimensions. Reference specific scores and explain how these strengths manifest in healthcare leadership contexts.",
  "developmentAreas": "A 3-4 paragraph analysis of the leader's development areas based on their lowest-scoring dimensions. Be constructive, specific, and contextualise within African healthcare settings.",
  "blindSpotAnalysis": "A 2-3 paragraph analysis of potential blind spots. Look for discrepancies between self-perception and capability scores, or areas where high scores in one domain may mask weaknesses in another.",
  "coachingPriorities": [
    {
      "priority": 1,
      "title": "Specific coaching priority title",
      "description": "2-3 sentence description of the coaching focus area",
      "suggestedActions": ["Action 1", "Action 2", "Action 3"],
      "timeframe": "30 days or 60 days or 90 days"
    }
  ],
  "leadershipArchetype": "A concise 2-4 word archetype name (e.g., 'The Strategic Clinician', 'The Empathetic Transformer', 'The Systems Builder')",
  "archetypeDescription": "A 2-3 sentence description of what this archetype means for the leader's style and approach.",
  "dimensionInterpretations": {
    "Dimension Name": "A 1-2 sentence interpretation of this specific score in context"
  },
  "overallScore": 75
}

Provide exactly 3-5 coaching priorities, ordered by urgency. The overallScore should be a weighted composite (0-100). The dimensionInterpretations should have one entry per dimension from the scores above.

Return ONLY the JSON object, no other text.`;

  let reportData: Record<string, unknown>;
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
    reportData = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("Maarova report generation error:", err);
    // Reset report status on failure
    await prisma.maarovaReport.update({
      where: { id: reportRecord.id },
      data: { status: "GENERATING" },
    });
    return NextResponse.json(
      { error: "Failed to generate report. Please try again." },
      { status: 500 }
    );
  }

  // Build dimension scores for radar chart
  const dimensionScores: Record<string, number> = {};
  for (const mr of assessmentSession.moduleResponses) {
    const scores = mr.scaledScores as Record<string, number> | null;
    if (!scores) continue;
    // Use the module-level average as the dimension score
    const values = Object.values(scores);
    if (values.length > 0) {
      const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      const label = MODULE_LABELS[mr.module.type] ?? mr.module.name;
      dimensionScores[label] = avg;
    }
  }

  // Build radar chart data
  const radarChartData = Object.entries(dimensionScores).map(([dimension, score]) => ({
    dimension,
    score,
    benchmark: 65, // Default benchmark; can be replaced with normative data later
  }));

  // Update the report with AI output
  const updatedReport = await prisma.maarovaReport.update({
    where: { id: reportRecord.id },
    data: {
      status: "READY",
      overallScore: (reportData.overallScore as number) ?? null,
      dimensionScores,
      radarChartData,
      executiveSummary: (reportData.executiveSummary as string) ?? null,
      strengthsAnalysis: (reportData.strengthsAnalysis as string) ?? null,
      developmentAreas: (reportData.developmentAreas as string) ?? null,
      blindSpotAnalysis: (reportData.blindSpotAnalysis as string) ?? null,
      coachingPriorities: reportData.coachingPriorities ? JSON.parse(JSON.stringify(reportData.coachingPriorities)) : undefined,
      leadershipArchetype: (reportData.leadershipArchetype as string) ?? null,
      fullReportContent: JSON.parse(JSON.stringify(reportData)),
      generatedAt: new Date(),
    },
  });

  return NextResponse.json({ report: updatedReport });
}
