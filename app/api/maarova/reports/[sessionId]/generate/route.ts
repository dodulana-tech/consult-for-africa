export const maxDuration = 300;

import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { handler } from "@/lib/api-handler";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 100_000, // 100s max for API call
});


const MODULE_LABELS: Record<string, string> = {
  DISC: "Behavioural Style (DISC)",
  VALUES_DRIVERS: "Values and Motivational Drivers",
  EMOTIONAL_INTEL: "Emotional Intelligence",
  CILTI: "Clinical Leadership Transition",
  THREE_SIXTY: "360-Degree Feedback",
  CULTURE_TEAM: "Culture and Team Dynamics",
};

export const POST = handler(async function POST(
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

  const systemPrompt = `You are a senior organisational psychologist generating a Maarova Leadership Profile for an African healthcare leader. Never use em dashes. Write in British English, second person. Be personalised and specific, not generic. Reference Ubuntu, communal leadership, and African health system realities where relevant.

CRITICAL: You must ONLY reference information explicitly provided in the leader profile and scores below. Do NOT invent, assume, or hallucinate any biographical details such as years of experience, qualifications, certifications, fellowships, specialisations, institutional affiliations, or career history. If a detail is not provided, do not mention it. Base all interpretations solely on the assessment scores provided.`;

  const scoreContext = `LEADER: ${user.name}\n${demographicContext}\n\nSCORES (0-100):\n${scoreLines.join("\n")}`;

  // ─── TWO PARALLEL API CALLS for speed ───
  // Call A: Core report (~4K tokens, ~40s)
  // Call B: Module deep dives (~4K tokens, ~40s)
  // Running in parallel = ~40s total instead of ~90s sequential

  const callA = anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 5000,
    system: systemPrompt,
    messages: [{
      role: "user",
      content: `${scoreContext}

Return ONLY valid JSON. Each narrative field: 2 paragraphs of 3-4 sentences.

{
  "leadershipArchetype": "2-4 word archetype (e.g. 'The Strategic Clinician')",
  "archetypeNarrative": "3-4 sentences starting with 'Your leadership serves your community through...'",
  "signatureStrengths": [{"dimension":"name","title":"3-5 word label","description":"2 sentences"}],
  "executiveSummary": "3 paragraphs. Lead with archetype, contextualise in African healthcare, discuss interplay between dimensions.",
  "strengthsAnalysis": "2 paragraphs on what this leader does well. Observable behaviours, cross-module.",
  "nextLeadershipEdge": "2 paragraphs on where growth would be most catalytic. Strengths-based.",
  "blindSpotAnalysis": "2 paragraphs using Hogan overused-strengths frame.",
  "howOthersExperienceYou": "2 paragraphs on how colleagues experience this leader.",
  "leadershipUnderPressure": "2 paragraphs on stress patterns drawing from DISC, EQ, CILTI.",
  "coachingPriorities": [{"priority":1,"title":"title","description":"3 sentences","suggestedActions":["a1","a2","a3"],"timeframe":"timeframe"}],
  "dimensionInterpretations": {"DimensionName": "2 sentence interpretation per scored dimension."}
}

RULES: 3 signatureStrengths (top scoring). 4-5 coachingPriorities with varied timeframes. One dimensionInterpretation per dimension. Return ONLY raw JSON. No markdown fences, no explanation, no text outside the JSON object.`,
    }],
  });

  const callB = anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 6000,
    system: systemPrompt,
    messages: [{
      role: "user",
      content: `${scoreContext}

Return ONLY valid JSON with detailed module interpretations. Each narrative: 1-2 paragraphs of 3-4 sentences. Be specific and personalised.

{
  "disc": {
    "profileSummary": "2 paragraphs on DISC profile, primary/adapted styles, day-to-day impact.",
    "characterInsights": "2 paragraphs of personalised character insights. How colleagues experience this person.",
    "communicationDos": ["6 specific do's for communicating with this leader"],
    "communicationDonts": ["6 specific don'ts that would cause friction"],
    "valueToOrganisation": "1 paragraph on value this style brings to healthcare.",
    "idealEnvironment": "1 paragraph describing the work environment where this leader thrives. Be specific: type of team, pace, structure, autonomy level.",
    "underPressure": "1-2 paragraphs on behaviour under stress, triggers, and what colleagues observe.",
    "howToMotivateMe": ["8 specific statements starting with 'I need...' or 'I thrive when...' that describe what motivates and engages this leader based on their DISC+Values profile. Make each actionable for a manager."],
    "howToManageMe": ["8 specific statements starting with 'Manage me by...' or 'Give me...' that describe how a manager should lead this person for best results. Based on DISC+Values+EQ profile."],
    "selfPerception": "1 paragraph: 'When things are calm, you likely see yourself as...' describing how this leader views themselves at their best.",
    "othersPerception": "1 paragraph: 'Under moderate pressure, colleagues may experience you as...' describing how stress shifts others' perception.",
    "highStressPerception": "1 paragraph: 'Under significant stress, others may see you as...' describing the most challenging version of this leader."
  },
  "values": {
    "profileSummary": "2 paragraphs on values structure and motivational signature.",
    "topThree": [{"value":"Value name","rank":1,"interpretation":"2 paragraphs: what it means, strengths from this value, value to the organisation, tips for development."}],
    "middleValues": "1 paragraph on situation-dependent middle values and when they surface.",
    "lowerValues": "1 paragraph on lower values (not deficit, simply less pull) and awareness of blind spots.",
    "healthcareAlignment": "1-2 paragraphs on values alignment with African healthcare and Ubuntu philosophy."
  },
  "emotionalIntelligence": {
    "profileSummary": "2 paragraphs on overall EQ capability and how dimensions interact.",
    "dimensions": {
      "selfAwareness": "1-2 paragraphs: what it looks like in practice, how it serves leadership, growth edge.",
      "empathy": "1-2 paragraphs in context of healthcare, Ubuntu, and team relationships.",
      "socialSkills": "1-2 paragraphs on relationship management, influence, and conflict resolution.",
      "emotionalRegulation": "1-2 paragraphs on pressure handling, triggers, and resilience strategies."
    },
    "underPressure": "1-2 paragraphs on EQ under pressure with practical de-escalation strategies."
  },
  "cilti": {
    "profileSummary": "2 paragraphs on clinical-to-leadership identity transition journey.",
    "transitionStage": "'High Risk' or 'Transitioning' or 'Emerging Leader' or 'Established Leader'",
    "dimensions": {
      "clinicalIdentity": "1-2 paragraphs on clinical identity strength and what it means.",
      "leadershipIdentity": "1-2 paragraphs on how fully they have embraced leadership.",
      "transitionReadiness": "1-2 paragraphs on psychological readiness to lead.",
      "identityFriction": "1-2 paragraphs on tension between identities and how it manifests."
    },
    "transitionRoadmap": "1-2 paragraphs with specific next steps for the identity journey."
  },
  "cultureTeam": {
    "profileSummary": "2 paragraphs on culture preference and team dynamics.",
    "cvfInterpretation": "1-2 paragraphs on CVF quadrant dominance and tensions between quadrants.",
    "teamEffectiveness": "1-2 paragraphs on how they build teams and maintain effectiveness.",
    "engagementProfile": "1-2 paragraphs on what drives their engagement: autonomy, mastery, purpose, recognition, belonging."
  }${has360 ? `,
  "threeSixty": {
    "summary": "2 paragraphs on 360 feedback themes.",
    "blindSpots": "1-2 paragraphs on self-overestimation areas.",
    "hiddenStrengths": "1-2 paragraphs on strengths others see that self does not.",
    "stakeholderThemes": "1-2 paragraphs on common themes across rater groups."
  }` : ""}
}

RULES: topThree = 3 highest-scoring values with ranks 1,2,3. Return ONLY raw JSON. No markdown fences, no explanation, no text outside the JSON object.`,
    }],
  });

  let reportData: Record<string, unknown>;
  try {
    console.log("[Maarova] Starting PARALLEL AI report generation for session:", sessionId);
    const startTime = Date.now();

    const [resultA, resultB] = await Promise.all([callA, callB]);

    console.log("[Maarova] Both calls completed in", Date.now() - startTime, "ms");
    console.log("[Maarova] Call A:", resultA.stop_reason, resultA.usage.output_tokens, "tokens");
    console.log("[Maarova] Call B:", resultB.stop_reason, resultB.usage.output_tokens, "tokens");

    const parseJson = (text: string, stopReason: string) => {
      // Strip markdown code fences if present
      let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found");
      let str = match[0];
      if (stopReason === "max_tokens") {
        let braces = 0, brackets = 0, inStr = false;
        for (let i = 0; i < str.length; i++) {
          const ch = str[i];
          if (ch === '"' && str[i - 1] !== '\\') inStr = !inStr;
          if (!inStr) {
            if (ch === '{') braces++; else if (ch === '}') braces--;
            if (ch === '[') brackets++; else if (ch === ']') brackets--;
          }
        }
        if (inStr) str += '"';
        str = str.replace(/,\s*$/, '');
        for (let i = 0; i < brackets; i++) str += ']';
        for (let i = 0; i < braces; i++) str += '}';
      }
      return JSON.parse(str);
    };

    const coreReport = parseJson((resultA.content[0] as { text: string }).text, resultA.stop_reason ?? "end_turn");
    const moduleReport = parseJson((resultB.content[0] as { text: string }).text, resultB.stop_reason ?? "end_turn");

    // Merge: core report + module deep dives
    reportData = { ...coreReport, ...moduleReport };

    // Deep merge module objects (don't overwrite core disc/values with module disc/values)
    for (const key of ["disc", "values", "emotionalIntelligence", "cilti", "cultureTeam", "threeSixty"]) {
      if (moduleReport[key] && typeof moduleReport[key] === "object") {
        reportData[key] = { ...(coreReport[key] as Record<string, unknown> ?? {}), ...(moduleReport[key] as Record<string, unknown>) };
      }
    }

    console.log("[Maarova] Report merged successfully");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[Maarova] Report generation FAILED:", errMsg, err);
    // If the report had existing content, restore to READY instead of deleting
    if (existingReport?.fullReportContent) {
      await prisma.maarovaReport.update({
        where: { id: reportRecord.id },
        data: { status: "READY" },
      }).catch(() => {});
    } else {
      await prisma.maarovaReport.delete({
        where: { id: reportRecord.id },
      }).catch(() => {});
    }
    return NextResponse.json(
      { error: `Report generation failed: ${errMsg.slice(0, 100)}` },
      { status: 500 }
    );
  }

  // Dimension keys per module type (excludes raw scores and metadata)
  const DIMENSION_KEYS: Record<string, string[]> = {
    DISC: ["D", "I", "S", "C"],
    VALUES_DRIVERS: ["theoretical", "economic", "aesthetic", "social", "political", "regulatory"],
    EMOTIONAL_INTEL: ["selfAwareness", "empathy", "socialSkills", "emotionalRegulation", "overallEQ"],
    CILTI: ["clinicalIdentity", "leadershipIdentity", "transitionReadiness", "ciltiComposite"],
    CULTURE_TEAM: ["teamEffectiveness"],
  };

  // Build dimension scores for radar chart
  const dimensionScores: Record<string, number> = {};
  for (const mr of assessmentSession.moduleResponses) {
    const scores = mr.scaledScores as Record<string, unknown> | null;
    if (!scores) continue;

    const keys = DIMENSION_KEYS[mr.module.type];
    let values: number[];

    if (keys) {
      values = keys.map((k) => typeof scores[k] === "number" ? scores[k] as number : 0).filter((v) => v > 0);
    } else {
      // Fallback: grab all numeric values (for unknown module types)
      values = Object.values(scores).filter((v): v is number => typeof v === "number" && v >= 0 && v <= 100);
    }

    // For CULTURE_TEAM, also include the nested culture dimension scores
    if (mr.module.type === "CULTURE_TEAM" && typeof scores.culture === "object" && scores.culture !== null) {
      const culture = scores.culture as Record<string, unknown>;
      for (const k of ["collaborate", "create", "compete", "control"]) {
        if (typeof culture[k] === "number") values.push(culture[k] as number);
      }
    }

    // For THREE_SIXTY, extract overallOtherAvg from the nested dimensions array
    if (mr.module.type === "THREE_SIXTY" && Array.isArray(scores.dimensions)) {
      const dims = scores.dimensions as Array<{ overallOtherAvg?: number }>;
      values = dims
        .map((d) => typeof d.overallOtherAvg === "number" ? d.overallOtherAvg : 0)
        .filter((v) => v > 0);
    }

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

  // Compute overall score: weighted average of all dimensions
  const allDimScores = Object.values(dimensionScores);
  const overallScore = allDimScores.length > 0
    ? Math.round(allDimScores.reduce((a, b) => a + b, 0) / allDimScores.length)
    : null;

  const updatedReport = await prisma.maarovaReport.update({
    where: { id: reportRecord.id },
    data: {
      status: "READY",
      overallScore,
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
});

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
