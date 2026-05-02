import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { emailMaarovaInviteRaters } from "@/lib/email";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://consultforafrica.com";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 100_000,
});

const MODULE_LABELS: Record<string, string> = {
  DISC: "Behavioural Style (DISC)",
  VALUES_DRIVERS: "Values and Motivational Drivers",
  EMOTIONAL_INTEL: "Emotional Intelligence",
  CILTI: "Clinical Leadership Transition",
  THREE_SIXTY: "360-Degree Feedback",
  CULTURE_TEAM: "Culture and Team Dynamics",
};

const DIMENSION_KEYS: Record<string, string[]> = {
  DISC: ["D", "I", "S", "C"],
  VALUES_DRIVERS: ["theoretical", "economic", "aesthetic", "social", "political", "regulatory"],
  EMOTIONAL_INTEL: ["selfAwareness", "empathy", "socialSkills", "emotionalRegulation", "overallEQ"],
  CILTI: ["clinicalIdentity", "leadershipIdentity", "transitionReadiness", "ciltiComposite"],
  CULTURE_TEAM: ["teamEffectiveness"],
};

export interface GenerateReportResult {
  ok: boolean;
  reportId?: string;
  error?: string;
  alreadyReady?: boolean;
}

/**
 * Generate a Maarova leadership report for a completed assessment session.
 * Server-only helper. Performs no auth - caller must verify access.
 *
 * Returns { ok: true, reportId } on success, { ok: false, error } on failure.
 * Idempotent: returns alreadyReady=true if a READY report already exists.
 */
export async function generateMaarovaReport(
  sessionId: string,
  opts: { force?: boolean } = {},
): Promise<GenerateReportResult> {
  const assessmentSession = await prisma.maarovaAssessmentSession.findUnique({
    where: { id: sessionId },
    include: {
      user: true,
      moduleResponses: { include: { module: true } },
    },
  });

  if (!assessmentSession) return { ok: false, error: "session not found" };

  // Require all core modules complete
  const coreModules = assessmentSession.moduleResponses.filter(
    (mr) => mr.module.type !== "THREE_SIXTY",
  );
  const coreIncomplete = coreModules.filter((mr) => mr.status !== "COMPLETED");
  if (coreIncomplete.length > 0) {
    return { ok: false, error: `${coreIncomplete.length} core module(s) incomplete` };
  }

  const existingReport = await prisma.maarovaReport.findUnique({ where: { sessionId } });

  if (existingReport && existingReport.status === "READY" && !opts.force) {
    return { ok: true, reportId: existingReport.id, alreadyReady: true };
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
    (mr) => mr.module.type === "THREE_SIXTY" && mr.status === "COMPLETED",
  );

  const demographicContext = [
    user.title ? `Title: ${user.title}` : null,
    user.department ? `Department: ${user.department}` : null,
    user.clinicalBackground ? `Clinical Background: ${user.clinicalBackground}` : null,
    user.yearsInHealthcare != null ? `Years in Healthcare: ${user.yearsInHealthcare}` : null,
    user.yearsInRole != null ? `Years in Current Role: ${user.yearsInRole}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `You are a senior organisational psychologist generating a Maarova Leadership Profile for an African healthcare leader. Never use em dashes. Write in British English, second person. Be personalised and specific, not generic. Reference Ubuntu, communal leadership, and African health system realities where relevant.

CRITICAL: You must ONLY reference information explicitly provided in the leader profile and scores below. Do NOT invent, assume, or hallucinate any biographical details such as years of experience, qualifications, certifications, fellowships, specialisations, institutional affiliations, or career history. If a detail is not provided, do not mention it. Base all interpretations solely on the assessment scores provided.`;

  const scoreContext = `LEADER: ${user.name}\n${demographicContext}\n\nSCORES (0-100):\n${scoreLines.join("\n")}`;

  const callA = anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 5000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `${scoreContext}\n\nReturn ONLY valid JSON. Each narrative field: 2 paragraphs of 3-4 sentences.\n\n{\n  "leadershipArchetype": "2-4 word archetype (e.g. 'The Strategic Clinician')",\n  "archetypeNarrative": "3-4 sentences starting with 'Your leadership serves your community through...'",\n  "signatureStrengths": [{"dimension":"name","title":"3-5 word label","description":"2 sentences"}],\n  "executiveSummary": "3 paragraphs. Lead with archetype, contextualise in African healthcare, discuss interplay between dimensions.",\n  "strengthsAnalysis": "2 paragraphs on what this leader does well. Observable behaviours, cross-module.",\n  "nextLeadershipEdge": "2 paragraphs on where growth would be most catalytic. Strengths-based.",\n  "blindSpotAnalysis": "2 paragraphs using Hogan overused-strengths frame.",\n  "howOthersExperienceYou": "2 paragraphs on how colleagues experience this leader.",\n  "leadershipUnderPressure": "2 paragraphs on stress patterns drawing from DISC, EQ, CILTI.",\n  "coachingPriorities": [{"priority":1,"title":"title","description":"3 sentences","suggestedActions":["a1","a2","a3"],"timeframe":"timeframe"}],\n  "dimensionInterpretations": {"DimensionName": "2 sentence interpretation per scored dimension."}\n}\n\nRULES: 3 signatureStrengths (top scoring). 4-5 coachingPriorities with varied timeframes. One dimensionInterpretation per dimension. Return ONLY raw JSON. No markdown fences, no explanation, no text outside the JSON object.`,
      },
    ],
  });

  const callB = anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 6000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `${scoreContext}\n\nReturn ONLY valid JSON with detailed module interpretations.\n\n{\n  "disc": {"profileSummary": "2 paragraphs", "characterInsights": "2 paragraphs", "communicationDos": ["6 dos"], "communicationDonts": ["6 donts"], "valueToOrganisation": "1 paragraph", "idealEnvironment": "1 paragraph", "underPressure": "1-2 paragraphs", "howToMotivateMe": ["8 statements"], "howToManageMe": ["8 statements"], "selfPerception": "1 paragraph", "othersPerception": "1 paragraph", "highStressPerception": "1 paragraph"},\n  "values": {"profileSummary": "2 paragraphs", "topThree": [{"value":"name","rank":1,"interpretation":"2 paragraphs"}], "middleValues": "1 paragraph", "lowerValues": "1 paragraph", "healthcareAlignment": "1-2 paragraphs"},\n  "emotionalIntelligence": {"profileSummary": "2 paragraphs", "dimensions": {"selfAwareness": "1-2 paragraphs", "empathy": "1-2 paragraphs", "socialSkills": "1-2 paragraphs", "emotionalRegulation": "1-2 paragraphs"}, "underPressure": "1-2 paragraphs"},\n  "cilti": {"profileSummary": "2 paragraphs", "transitionStage": "stage", "dimensions": {"clinicalIdentity": "1-2 paragraphs", "leadershipIdentity": "1-2 paragraphs", "transitionReadiness": "1-2 paragraphs", "identityFriction": "1-2 paragraphs"}, "transitionRoadmap": "1-2 paragraphs"},\n  "cultureTeam": {"profileSummary": "2 paragraphs", "cvfInterpretation": "1-2 paragraphs", "teamEffectiveness": "1-2 paragraphs", "engagementProfile": "1-2 paragraphs"}${has360 ? ',\n  "threeSixty": {"summary": "2 paragraphs", "blindSpots": "1-2 paragraphs", "hiddenStrengths": "1-2 paragraphs", "stakeholderThemes": "1-2 paragraphs"}' : ""}\n}\n\nRULES: topThree = 3 highest-scoring values with ranks 1,2,3. Return ONLY raw JSON.`,
      },
    ],
  });

  let reportData: Record<string, unknown>;
  try {
    const [resultA, resultB] = await Promise.all([callA, callB]);

    const parseJson = (text: string, stopReason: string) => {
      let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found");
      let str = match[0];
      if (stopReason === "max_tokens") {
        let braces = 0,
          brackets = 0,
          inStr = false;
        for (let i = 0; i < str.length; i++) {
          const ch = str[i];
          if (ch === '"' && str[i - 1] !== "\\") inStr = !inStr;
          if (!inStr) {
            if (ch === "{") braces++;
            else if (ch === "}") braces--;
            if (ch === "[") brackets++;
            else if (ch === "]") brackets--;
          }
        }
        if (inStr) str += '"';
        str = str.replace(/,\s*$/, "");
        for (let i = 0; i < brackets; i++) str += "]";
        for (let i = 0; i < braces; i++) str += "}";
      }
      return JSON.parse(str);
    };

    const coreReport = parseJson((resultA.content[0] as { text: string }).text, resultA.stop_reason ?? "end_turn");
    const moduleReport = parseJson((resultB.content[0] as { text: string }).text, resultB.stop_reason ?? "end_turn");

    reportData = { ...coreReport, ...moduleReport };

    for (const key of ["disc", "values", "emotionalIntelligence", "cilti", "cultureTeam", "threeSixty"]) {
      if (moduleReport[key] && typeof moduleReport[key] === "object") {
        reportData[key] = {
          ...((coreReport[key] as Record<string, unknown>) ?? {}),
          ...(moduleReport[key] as Record<string, unknown>),
        };
      }
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[generateMaarovaReport] FAILED:", errMsg);
    if (existingReport?.fullReportContent) {
      await prisma.maarovaReport
        .update({ where: { id: reportRecord.id }, data: { status: "READY" } })
        .catch(() => {});
    } else {
      await prisma.maarovaReport.delete({ where: { id: reportRecord.id } }).catch(() => {});
    }
    return { ok: false, error: errMsg.slice(0, 200) };
  }

  // Build dimension scores for radar
  const dimensionScores: Record<string, number> = {};
  for (const mr of assessmentSession.moduleResponses) {
    const scores = mr.scaledScores as Record<string, unknown> | null;
    if (!scores) continue;

    const keys = DIMENSION_KEYS[mr.module.type];
    let values: number[];

    if (keys) {
      values = keys.map((k) => (typeof scores[k] === "number" ? (scores[k] as number) : 0)).filter((v) => v > 0);
    } else {
      values = Object.values(scores).filter((v): v is number => typeof v === "number" && v >= 0 && v <= 100);
    }

    if (mr.module.type === "CULTURE_TEAM" && typeof scores.culture === "object" && scores.culture !== null) {
      const culture = scores.culture as Record<string, unknown>;
      for (const k of ["collaborate", "create", "compete", "control"]) {
        if (typeof culture[k] === "number") values.push(culture[k] as number);
      }
    }

    if (mr.module.type === "THREE_SIXTY" && Array.isArray(scores.dimensions)) {
      const dims = scores.dimensions as Array<{ overallOtherAvg?: number }>;
      values = dims.map((d) => (typeof d.overallOtherAvg === "number" ? d.overallOtherAvg : 0)).filter((v) => v > 0);
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

  const allDimScores = Object.values(dimensionScores);
  const overallScore =
    allDimScores.length > 0 ? Math.round(allDimScores.reduce((a, b) => a + b, 0) / allDimScores.length) : null;

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
      coachingPriorities: reportData.coachingPriorities
        ? JSON.parse(JSON.stringify(reportData.coachingPriorities))
        : undefined,
      leadershipArchetype: (reportData.leadershipArchetype as string) ?? null,
      archetypeNarrative: (reportData.archetypeNarrative as string) ?? null,
      signatureStrengths: reportData.signatureStrengths ? JSON.parse(JSON.stringify(reportData.signatureStrengths)) : undefined,
      fullReportContent: JSON.parse(JSON.stringify(reportData)),
      generatedAt: new Date(),
    },
  });

  // Auto-create a 360 request (idempotent) so the leader has a place to invite
  // raters into. Skip if a 360 module response is already COMPLETED.
  const has360Complete = assessmentSession.moduleResponses.some(
    (mr) => mr.module.type === "THREE_SIXTY" && mr.status === "COMPLETED",
  );
  let threeSixtyRequestId: string | null = null;
  if (!has360Complete) {
    try {
      const existing360 = await prisma.maarova360Request.findFirst({
        where: { subjectId: assessmentSession.userId, status: { in: ["COLLECTING", "PROCESSING"] } },
      });
      if (existing360) {
        threeSixtyRequestId = existing360.id;
      } else {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 14);
        const newRequest = await prisma.maarova360Request.create({
          data: {
            subjectId: assessmentSession.userId,
            deadline,
            minRaters: 5,
            status: "COLLECTING",
          },
        });
        threeSixtyRequestId = newRequest.id;
      }
    } catch (err) {
      console.error("[generateMaarovaReport] failed to create 360 request:", err);
    }

    // Email the leader prompting them to invite raters. Best-effort - if it
    // fails the report is still readable in the portal.
    try {
      await emailMaarovaInviteRaters({
        email: user.email,
        name: user.name,
        reportUrl: `${BASE_URL}/maarova/portal/results/${sessionId}`,
        inviteUrl: `${BASE_URL}/maarova/portal/three-sixty`,
      });
    } catch (err) {
      console.error("[generateMaarovaReport] failed to send invite-raters email:", err);
    }
  }

  return { ok: true, reportId: updatedReport.id };
}
