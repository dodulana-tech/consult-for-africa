export const maxDuration = 60;

import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODULE_LABELS: Record<string, string> = {
  DISC: "Behavioural Style (DISC)",
  VALUES_DRIVERS: "Values and Motivational Drivers",
  EMOTIONAL_INTEL: "Emotional Intelligence",
  CILTI: "Clinical Leadership Transition",
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

  const assessmentSession = await prisma.maarovaAssessmentSession.findUnique({
    where: { id: sessionId },
    include: {
      user: true,
      moduleResponses: { include: { module: true } },
    },
  });

  if (!assessmentSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (assessmentSession.userId !== maarovaSession.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const coreModules = assessmentSession.moduleResponses.filter(
    (mr) => mr.module.type !== "THREE_SIXTY"
  );
  const coreIncomplete = coreModules.filter((mr) => mr.status !== "COMPLETED");
  if (coreIncomplete.length > 0) {
    return NextResponse.json(
      { error: `Complete all core modules before generating a report. ${coreIncomplete.length} module(s) remaining.` },
      { status: 400 }
    );
  }

  const existingReport = await prisma.maarovaReport.findUnique({
    where: { sessionId },
  });

  const url = new URL(_req.url);
  const forceRegenerate = url.searchParams.get("regenerate") === "true";
  const enhanceOnly = url.searchParams.get("enhance") === "true";

  // If enhance-only, skip to phase 2
  if (enhanceOnly && existingReport?.status === "READY") {
    enhanceReport(existingReport.id, assessmentSession).catch(console.error);
    return NextResponse.json({ report: existingReport, enhancing: true });
  }

  if (existingReport && existingReport.status === "READY" && !forceRegenerate) {
    return NextResponse.json({ report: existingReport });
  }

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

  // Build score summary
  const user = assessmentSession.user;
  const scoreLines: string[] = [];

  for (const mr of assessmentSession.moduleResponses) {
    const label = MODULE_LABELS[mr.module.type] ?? mr.module.name;
    const scores = mr.scaledScores as Record<string, unknown> | null;
    if (!scores) continue;
    scoreLines.push(`\n${label}:`);
    for (const [dimension, score] of Object.entries(scores)) {
      if (typeof score === "number") {
        scoreLines.push(`  - ${dimension}: ${score}/100`);
      } else if (typeof score === "string") {
        scoreLines.push(`  - ${dimension}: ${score}`);
      }
    }
  }

  const demographicContext = [
    user.title ? `Title: ${user.title}` : null,
    user.department ? `Department: ${user.department}` : null,
    user.clinicalBackground ? `Clinical Background: ${user.clinicalBackground}` : null,
    user.yearsInHealthcare != null ? `Years in Healthcare: ${user.yearsInHealthcare}` : null,
    user.yearsInRole != null ? `Years in Current Role: ${user.yearsInRole}` : null,
  ].filter(Boolean).join("\n");

  /* ─── PHASE 1: Core report (same structure that worked before, plus module summaries) ─── */

  const systemPrompt = `You are a senior organisational psychologist at Consult for Africa generating a Maarova leadership profile report for an African healthcare leader. Your reports are psychometrically grounded, contextually sensitive to African healthcare (referencing Ubuntu, communal leadership, and African health system realities), actionable, written in formal British English, and empathetic but honest. Never use em dashes in your writing. Use commas, semicolons, colons, or separate sentences instead. Never use deficit language like "weakness" or "below average". Frame growth areas as "emerging capabilities" or "next leadership edge". Do not produce an overall composite score.`;

  const userPrompt = `Generate a comprehensive leadership profile report for the following healthcare leader.

LEADER PROFILE:
Name: ${user.name}
${demographicContext}

ASSESSMENT SCORES (scaled 0-100):
${scoreLines.join("\n")}

Based on these assessment results, generate a detailed leadership profile report as JSON with this exact structure:

{
  "leadershipArchetype": "A concise 2-4 word archetype name (e.g., 'The Strategic Clinician', 'The Empathetic Transformer')",
  "archetypeNarrative": "A 3-4 sentence narrative in second person. Begin with 'Your leadership serves your community through...'",
  "signatureStrengths": [
    {
      "dimension": "The dimension name",
      "title": "A memorable 3-5 word strength label",
      "description": "One sentence describing how this strength manifests in their healthcare leadership context"
    }
  ],
  "executiveSummary": "A 3-4 paragraph executive summary. Lead with archetype and strengths. Contextualise within African healthcare.",
  "strengthsAnalysis": "A 3-4 paragraph analysis of what this leader does well. Use 'others experience your leadership as...' framing.",
  "nextLeadershipEdge": "A 3-4 paragraph analysis of where growth would be most catalytic. Strengths-based language.",
  "blindSpotAnalysis": "A 2-3 paragraph analysis using the Hogan overused-strengths frame.",
  "howOthersExperienceYou": "A 2-3 paragraph synthesis of how colleagues experience this leader based on DISC, EQ, and values.",
  "leadershipUnderPressure": "A 2-3 paragraph synthesis of stress patterns from DISC, EQ regulation, CILTI friction, and values conflicts.",
  "disc": {
    "profileSummary": "2 paragraphs on their DISC behavioural profile and what it means in practice.",
    "communicationDos": ["5 specific do's for communicating with this leader"],
    "communicationDonts": ["5 specific don'ts"],
    "underPressure": "1 paragraph on behaviour changes under stress."
  },
  "values": {
    "profileSummary": "2 paragraphs on their values structure and motivational drivers.",
    "topThree": [
      {"value": "Value name", "rank": 1, "interpretation": "1 paragraph interpreting this value for this leader."}
    ],
    "healthcareAlignment": "1 paragraph on values alignment with African healthcare and Ubuntu."
  },
  "emotionalIntelligence": {
    "profileSummary": "2 paragraphs on overall EQ capability and how the four dimensions interact.",
    "underPressure": "1 paragraph on EQ under pressure with practical strategies."
  },
  "cilti": {
    "profileSummary": "2 paragraphs on clinical-to-leadership identity transition.",
    "transitionStage": "'High Risk' or 'Transitioning' or 'Emerging Leader' or 'Established Leader'"
  },
  "cultureTeam": {
    "profileSummary": "2 paragraphs on culture preference and team dynamics.",
    "engagementProfile": "1 paragraph on what drives their engagement."
  },
  "coachingPriorities": [
    {
      "priority": 1,
      "title": "Specific coaching priority title",
      "description": "2-3 sentence description of the coaching focus area",
      "suggestedActions": ["Action 1", "Action 2", "Action 3"],
      "timeframe": "30 days or 60 days or 90 days"
    }
  ],
  "dimensionInterpretations": {
    "Dimension Name": "A 2-3 sentence interpretation of this dimension in context."
  }
}

Provide exactly 3 signature strengths. Provide 3-5 coaching priorities ordered by impact. topThree = 3 highest-scoring values with ranks 1,2,3. One dimensionInterpretation per scored dimension. Return ONLY the JSON object, no other text.`;

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
    await prisma.maarovaReport.delete({
      where: { id: reportRecord.id },
    }).catch(() => {});
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
    const values = Object.values(scores).filter((v): v is number => typeof v === "number");
    if (values.length > 0) {
      const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      const label = MODULE_LABELS[mr.module.type] ?? mr.module.name;
      dimensionScores[label] = avg;
    }
  }

  const radarChartData = Object.entries(dimensionScores).map(([dimension, score]) => ({
    dimension,
    score,
    benchmark: 65,
  }));

  const updatedReport = await prisma.maarovaReport.update({
    where: { id: reportRecord.id },
    data: {
      status: "READY",
      dimensionScores,
      radarChartData,
      executiveSummary: (reportData.executiveSummary as string) ?? null,
      strengthsAnalysis: (reportData.strengthsAnalysis as string) ?? null,
      nextLeadershipEdge: (reportData.nextLeadershipEdge as string) ?? null,
      developmentAreas: (reportData.nextLeadershipEdge as string) ?? null,
      blindSpotAnalysis: (reportData.blindSpotAnalysis as string) ?? null,
      coachingPriorities: reportData.coachingPriorities ? JSON.parse(JSON.stringify(reportData.coachingPriorities)) : undefined,
      leadershipArchetype: (reportData.leadershipArchetype as string) ?? null,
      archetypeNarrative: (reportData.archetypeNarrative as string) ?? null,
      signatureStrengths: reportData.signatureStrengths ? JSON.parse(JSON.stringify(reportData.signatureStrengths)) : undefined,
      fullReportContent: JSON.parse(JSON.stringify(reportData)),
      generatedAt: new Date(),
    },
  });

  return NextResponse.json({ report: updatedReport });
}

/* ─── PHASE 2: Background enhancement with module deep dives ─── */
// This runs after the user already has their report. It adds detailed
// per-module content (character insights, communication guides, etc.)
// Called via ?enhance=true or can be triggered from the results page.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enhanceReport(reportId: string, session: any) {
  const report = await prisma.maarovaReport.findUnique({ where: { id: reportId } });
  if (!report) return;

  const existing = (report.fullReportContent ?? {}) as Record<string, unknown>;

  // Skip if already enhanced
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((existing.disc as any)?.characterInsights) return;

  const user = session.user;
  const scoreLines: string[] = [];
  for (const mr of session.moduleResponses) {
    const label = MODULE_LABELS[mr.module.type] ?? mr.module.name;
    const scores = mr.scaledScores as Record<string, unknown> | null;
    if (!scores) continue;
    scoreLines.push(`\n${label}:`);
    for (const [dim, score] of Object.entries(scores)) {
      if (typeof score === "number") scoreLines.push(`  - ${dim}: ${score}/100`);
    }
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 6000,
      system: `You are a senior organisational psychologist enhancing a Maarova leadership report with detailed module-level insights. Write in formal British English, second person. Never use em dashes. Context: African healthcare leadership.`,
      messages: [{
        role: "user",
        content: `Enhance the report for ${user.name} with detailed module interpretations.

SCORES:
${scoreLines.join("\n")}

Return JSON with ONLY these fields (to merge into existing report):
{
  "disc": {
    "characterInsights": "2 paragraphs of personalised character insights.",
    "valueToOrganisation": "1 paragraph on value this style brings.",
    "idealEnvironment": "1 paragraph on ideal work environment."
  },
  "values": {
    "middleValues": "1 paragraph on situation-dependent middle values.",
    "lowerValues": "1 paragraph on lower values and blind spots."
  },
  "emotionalIntelligence": {
    "dimensions": {
      "selfAwareness": "1 paragraph.",
      "empathy": "1 paragraph.",
      "socialSkills": "1 paragraph.",
      "emotionalRegulation": "1 paragraph."
    }
  },
  "cilti": {
    "dimensions": {
      "clinicalIdentity": "1 paragraph.",
      "leadershipIdentity": "1 paragraph.",
      "transitionReadiness": "1 paragraph.",
      "identityFriction": "1 paragraph."
    },
    "transitionRoadmap": "1 paragraph with specific next steps."
  },
  "cultureTeam": {
    "cvfInterpretation": "1-2 paragraphs on CVF quadrant dominance.",
    "teamEffectiveness": "1 paragraph on team building."
  }
}

Return ONLY valid JSON.`,
      }],
    });

    const raw = (message.content[0] as { text: string }).text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;
    const enhancement = JSON.parse(jsonMatch[0]);

    // Deep merge enhancement into existing fullReportContent
    const merged = { ...existing };
    for (const [key, val] of Object.entries(enhancement)) {
      if (typeof val === "object" && val !== null && typeof merged[key] === "object" && merged[key] !== null) {
        merged[key] = { ...(merged[key] as Record<string, unknown>), ...(val as Record<string, unknown>) };
      } else {
        merged[key] = val;
      }
    }

    await prisma.maarovaReport.update({
      where: { id: reportId },
      data: { fullReportContent: JSON.parse(JSON.stringify(merged)) },
    });
  } catch (err) {
    console.error("[enhance] Module deep dive generation failed:", err);
  }
}
