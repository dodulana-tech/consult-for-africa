export const maxDuration = 300;

import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 100_000, // 100s max for API call
});

// Log API key presence at module load
console.log("[Maarova] Anthropic SDK initialized, key present:", !!process.env.ANTHROPIC_API_KEY, "key prefix:", process.env.ANTHROPIC_API_KEY?.slice(0, 12));

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

  const has360 = assessmentSession.moduleResponses.some(
    (mr) => mr.module.type === "THREE_SIXTY" && mr.status === "COMPLETED"
  );

  const demographicContext = [
    user.title ? `Title: ${user.title}` : null,
    user.department ? `Department: ${user.department}` : null,
    user.clinicalBackground ? `Clinical Background: ${user.clinicalBackground}` : null,
    user.yearsInHealthcare != null ? `Years in Healthcare: ${user.yearsInHealthcare}` : null,
    user.yearsInRole != null ? `Years in Current Role: ${user.yearsInRole}` : null,
  ].filter(Boolean).join("\n");

  const systemPrompt = `You are a senior organisational psychologist generating a Maarova Leadership Profile. Never use em dashes. Write in British English, second person. Be concise and personalised.`;

  const userPrompt = `Generate a leadership profile report for the following healthcare leader.

LEADER PROFILE:
Name: ${user.name}
${demographicContext}

ASSESSMENT SCORES (scaled 0-100):
${scoreLines.join("\n")}

${has360 ? "This leader completed 360 Feedback. Include threeSixty section." : "Set threeSixty to null."}

Return ONLY valid JSON with this structure. Each narrative field should be 1 rich paragraph (4-6 sentences) unless specified otherwise.

{
  "leadershipArchetype": "2-4 word archetype",
  "archetypeNarrative": "3 sentences starting with 'Your leadership serves your community through...'",
  "signatureStrengths": [{"dimension":"name","title":"3-5 word label","description":"1-2 sentences"}],
  "executiveSummary": "2 paragraphs. Lead with archetype, contextualise in African healthcare.",
  "disc": {
    "profileSummary": "1 paragraph on DISC profile and leadership impact.",
    "communicationDos": ["5 specific do's for communicating with this leader"],
    "communicationDonts": ["5 specific don'ts"],
    "underPressure": "1 paragraph on behaviour under stress."
  },
  "values": {
    "profileSummary": "1 paragraph on values structure.",
    "topThree": [{"value":"Value name","rank":1,"interpretation":"1 paragraph each."}],
    "healthcareAlignment": "1 paragraph on values alignment with African healthcare and Ubuntu."
  },
  "emotionalIntelligence": {
    "profileSummary": "1 paragraph on EQ capability.",
    "underPressure": "1 paragraph on EQ under pressure."
  },
  "cilti": {
    "profileSummary": "1 paragraph on clinical-to-leadership transition.",
    "transitionStage": "'High Risk' or 'Transitioning' or 'Emerging Leader' or 'Established Leader'"
  },
  "cultureTeam": {
    "profileSummary": "1 paragraph on culture preference and team dynamics."
  },
  ${has360 ? `"threeSixty": {"summary":"1 paragraph","blindSpots":"1 paragraph","hiddenStrengths":"1 paragraph"},` : `"threeSixty": null,`}
  "strengthsAnalysis": "1 paragraph on strengths across modules.",
  "nextLeadershipEdge": "1 paragraph on catalytic growth areas.",
  "blindSpotAnalysis": "1 paragraph using Hogan overused-strengths frame.",
  "howOthersExperienceYou": "1 paragraph on how colleagues experience this leader.",
  "leadershipUnderPressure": "1 paragraph on stress patterns and de-escalation.",
  "coachingPriorities": [{"priority":1,"title":"title","description":"2 sentences","suggestedActions":["a1","a2","a3"],"timeframe":"timeframe"}],
  "dimensionInterpretations": {"DimensionName": "1 sentence interpretation."}
}

RULES: 3 signatureStrengths. 4 coachingPriorities with varied timeframes. topThree = 3 highest-scoring values. One dimensionInterpretation per dimension. Return ONLY JSON.`;

  let reportData: Record<string, unknown>;
  try {
    console.log("[Maarova] Starting AI report generation for session:", sessionId);
    const startTime = Date.now();

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 5000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    console.log("[Maarova] AI response received in", Date.now() - startTime, "ms, stop_reason:", message.stop_reason);

    const raw = (message.content[0] as { text: string }).text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response. Raw: " + raw.slice(0, 200));
    let jsonStr = jsonMatch[0];

    // If truncated (stop_reason=max_tokens), try to repair the JSON
    if (message.stop_reason === "max_tokens") {
      console.log("[Maarova] Response truncated, attempting JSON repair");
      // Close any open strings, arrays, objects
      let openBraces = 0, openBrackets = 0, inString = false;
      for (let i = 0; i < jsonStr.length; i++) {
        const ch = jsonStr[i];
        if (ch === '"' && jsonStr[i - 1] !== '\\') inString = !inString;
        if (!inString) {
          if (ch === '{') openBraces++;
          else if (ch === '}') openBraces--;
          else if (ch === '[') openBrackets++;
          else if (ch === ']') openBrackets--;
        }
      }
      if (inString) jsonStr += '"';
      // Trim trailing comma
      jsonStr = jsonStr.replace(/,\s*$/, '');
      for (let i = 0; i < openBrackets; i++) jsonStr += ']';
      for (let i = 0; i < openBraces; i++) jsonStr += '}';
    }

    reportData = JSON.parse(jsonStr);
    console.log("[Maarova] Report JSON parsed successfully");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Maarova] Report generation FAILED:", errMsg, err);
    await prisma.maarovaReport.delete({
      where: { id: reportRecord.id },
    }).catch(() => {});
    return NextResponse.json(
      { error: `Report generation failed: ${errMsg.slice(0, 100)}` },
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
