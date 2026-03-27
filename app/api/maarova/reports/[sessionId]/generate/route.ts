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
      moduleResponses: {
        include: { module: true },
      },
    },
  });

  if (!assessmentSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (assessmentSession.userId !== maarovaSession.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check that all core modules (excluding 360) are completed
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

  // Check for existing report
  const existingReport = await prisma.maarovaReport.findUnique({
    where: { sessionId },
  });

  const url = new URL(_req.url);
  const forceRegenerate = url.searchParams.get("regenerate") === "true";

  if (existingReport && existingReport.status === "READY" && !forceRegenerate) {
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
  const rawScoreData: Record<string, Record<string, unknown>> = {};

  for (const mr of assessmentSession.moduleResponses) {
    const label = MODULE_LABELS[mr.module.type] ?? mr.module.name;
    const scores = mr.scaledScores as Record<string, unknown> | null;
    const raw = mr.rawScores as Record<string, unknown> | null;
    if (!scores) continue;

    rawScoreData[mr.module.type] = { scaled: scores, raw: raw ?? {} };

    scoreLines.push(`\n${label}:`);
    for (const [dimension, score] of Object.entries(scores)) {
      if (typeof score === "number") {
        scoreLines.push(`  - ${dimension}: ${score}/100`);
      } else if (typeof score === "string") {
        scoreLines.push(`  - ${dimension}: ${score}`);
      }
    }
  }

  // Check if 360 module is completed
  const threeSixtyResponse = assessmentSession.moduleResponses.find(
    (mr) => mr.module.type === "THREE_SIXTY" && mr.status === "COMPLETED"
  );
  const has360 = !!threeSixtyResponse;

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

  const systemPrompt = `You are a senior organisational psychologist at Consult for Africa generating a comprehensive Maarova Leadership Profile report for an African healthcare leader. This report will be rendered as a professional 20-page PDF document, so you must generate substantial, detailed content for each section.

Your reports are:
- Psychometrically grounded, referencing validated frameworks (DISC, Schwartz values, MSCEIT EQ, Competing Values Framework)
- Contextually sensitive to African healthcare (referencing Ubuntu philosophy, communal leadership traditions, and African health system realities)
- Written in formal British English with empathetic but honest framing
- Actionable with specific, practical guidance

Rules:
- Never use em dashes. Use commas, semicolons, colons, or separate sentences instead.
- Never use deficit language like "weakness" or "below average". Frame growth areas as "emerging capabilities" or "next leadership edge".
- Do not produce an overall composite score.
- Do not state raw numerical scores in narrative text. You may reference relative standing (e.g., "one of your strongest dimensions", "an area with significant room for growth").
- Write in second person ("you", "your") when addressing the leader directly.
- Each narrative section should be substantial: 3-5 rich paragraphs minimum.`;

  const userPrompt = `Generate a comprehensive leadership profile report for the following healthcare leader. This report must be VERY detailed as it will fill a 20-page professional PDF.

LEADER PROFILE:
Name: ${user.name}
${demographicContext}

ASSESSMENT SCORES (scaled 0-100):
${scoreLines.join("\n")}

${has360 ? "Note: This leader has completed the 360-Degree Feedback module. Include the threeSixty section." : "Note: This leader has NOT completed the 360-Degree Feedback module. Set threeSixty to null."}

Generate the report as JSON with this exact structure. Every narrative field must be substantial (3-5 paragraphs). Do NOT be brief.

{
  "leadershipArchetype": "A concise 2-4 word archetype name grounded in leadership identity (e.g., 'The Strategic Clinician', 'The Empathetic Transformer', 'The Systems Builder')",

  "archetypeNarrative": "A 4-5 sentence narrative in second person describing how this leader's community experiences their leadership. Begin with 'Your leadership serves your community through...' Frame relationally, not evaluatively. Reference their strongest dimensions.",

  "signatureStrengths": [
    {
      "dimension": "The dimension name",
      "title": "A memorable 3-5 word strength label",
      "description": "2-3 sentences describing how this strength manifests in their healthcare leadership context"
    }
  ],

  "executiveSummary": "4-5 paragraphs. Lead with their archetype and signature strengths. Contextualise within African healthcare leadership. Reference how their profile serves their teams and communities. Discuss the interplay between their different assessment dimensions. This is the most important narrative section.",

  "disc": {
    "profileSummary": "3-4 paragraphs describing their DISC behavioural profile. Explain what their primary and adapted styles mean in practice. Describe how this shows up in day-to-day healthcare leadership. Reference the interaction between their D, I, S, and C scores.",
    "characterInsights": "3-4 paragraphs of specific, personalised character insights. Describe how colleagues experience this person. Include both strengths and potential friction points. Be specific and behavioural, not generic.",
    "communicationDos": ["5-7 specific do's for how others should communicate with this leader based on their DISC profile"],
    "communicationDonts": ["5-7 specific don'ts that would cause friction when communicating with this leader"],
    "valueToOrganisation": "2-3 paragraphs describing the specific value this behavioural style brings to a healthcare organisation. Be concrete and specific to their scores.",
    "idealEnvironment": "1-2 paragraphs describing the work environment where this leader would thrive based on their DISC profile.",
    "underPressure": "2-3 paragraphs describing how this leader's behaviour changes under stress. What do others see? What triggers the shift? How can they manage it?"
  },

  "values": {
    "profileSummary": "3-4 paragraphs providing an overview of their values structure. Explain what drives them out of bed in the morning. How their top values interact and create their motivational signature.",
    "topThree": [
      {
        "value": "Value name (e.g., Social, Economic, Theoretical)",
        "rank": 1,
        "interpretation": "3-4 paragraphs interpreting what this value means for this leader. Include: what the score means, strengths from this value, value to the organisation, and tips for development. Be specific to their score level and healthcare context."
      }
    ],
    "middleValues": "2-3 paragraphs explaining the situation-dependent middle values and when they surface.",
    "lowerValues": "2-3 paragraphs explaining the lower values and what this means (not deficit; simply less motivational pull). Include how to be aware of blind spots from lower values.",
    "healthcareAlignment": "2-3 paragraphs on how their values structure aligns with or creates tension within African healthcare leadership. Reference Ubuntu, community-centred care, and health system realities."
  },

  "emotionalIntelligence": {
    "profileSummary": "3-4 paragraphs providing an overview of their EQ capability. Describe their overall emotional intelligence landscape and how the four dimensions interact.",
    "dimensions": {
      "selfAwareness": "2-3 paragraphs interpreting their self-awareness score. What does it look like in practice? How does it serve their leadership? Where is the growth edge?",
      "empathy": "2-3 paragraphs interpreting their empathy score in the context of healthcare leadership and Ubuntu.",
      "socialSkills": "2-3 paragraphs on their social skills, relationship management, and influence capability.",
      "emotionalRegulation": "2-3 paragraphs on their emotional regulation. How do they handle pressure? What are their triggers? How can they build resilience?"
    },
    "underPressure": "2-3 paragraphs synthesising how their EQ profile manifests under pressure. What do others observe? What triggers emotional reactions? Practical strategies for regulation."
  },

  "cilti": {
    "profileSummary": "3-4 paragraphs on their clinical-to-leadership identity transition. Where are they on the journey? What is their transition stage? How does identity friction show up?",
    "transitionStage": "A single label: 'High Risk', 'Transitioning', 'Emerging Leader', or 'Established Leader'",
    "dimensions": {
      "clinicalIdentity": "2-3 paragraphs on the strength of their clinical identity and what it means for their leadership.",
      "leadershipIdentity": "2-3 paragraphs on how fully they have embraced a leadership identity.",
      "transitionReadiness": "2-3 paragraphs on their psychological readiness to lead.",
      "identityFriction": "2-3 paragraphs on the tension between their clinical and leadership selves. How it manifests and how to resolve it."
    },
    "transitionRoadmap": "2-3 paragraphs with specific next steps for their identity transition journey."
  },

  "cultureTeam": {
    "profileSummary": "3-4 paragraphs on their culture and team dynamics profile. Describe their dominant culture preference and what it means for how they build and lead teams.",
    "cvfInterpretation": "2-3 paragraphs interpreting their Competing Values Framework scores. Which quadrant dominates? What tensions exist between quadrants?",
    "teamEffectiveness": "2-3 paragraphs on their approach to team building and effectiveness.",
    "engagementProfile": "2-3 paragraphs on what drives their engagement (autonomy, mastery, purpose, recognition, belonging) and how leaders can keep them motivated."
  },

  ${has360 ? `"threeSixty": {
    "summary": "3-4 paragraphs summarising the 360 feedback. How do others experience this leader versus how they see themselves?",
    "blindSpots": "2-3 paragraphs on areas where self-perception exceeds others' ratings.",
    "hiddenStrengths": "2-3 paragraphs on areas where others rate higher than self-perception.",
    "stakeholderThemes": "2-3 paragraphs synthesising common themes across rater groups."
  },` : `"threeSixty": null,`}

  "strengthsAnalysis": "4-5 paragraphs of what this leader does well across all modules. Describe observable behaviours, not scores. Use 'others experience your leadership as...' framing. Cross-reference across modules.",

  "nextLeadershipEdge": "4-5 paragraphs framed as 'where focused growth would have the most catalytic impact on your leadership and your community'. Be constructive, specific, and contextualise within African healthcare. Use strengths-based language throughout. Cross-reference emerging areas across modules.",

  "blindSpotAnalysis": "3-4 paragraphs on areas where others may experience the leader differently from how they see themselves. Use the Hogan 'overused strengths' frame: high scores can tip into overextension under stress. Cross-reference DISC under-pressure patterns with EQ regulation and CILTI friction.",

  "howOthersExperienceYou": "3-4 paragraphs synthesising how colleagues, teams, and stakeholders likely experience this leader based on the combined DISC, EQ, and values profile. Paint a vivid picture of what it is like to work with and for this person.",

  "leadershipUnderPressure": "3-4 paragraphs synthesising how this leader transforms under stress. Draw from DISC adapted style, EQ emotional regulation, CILTI identity friction, and values conflicts. Describe observable behaviours and practical de-escalation strategies.",

  "coachingPriorities": [
    {
      "priority": 1,
      "title": "Specific coaching priority title",
      "description": "3-4 sentence description of the coaching focus area with context for why it matters",
      "suggestedActions": ["Specific action 1", "Specific action 2", "Specific action 3", "Specific action 4"],
      "timeframe": "Zero to thirty days, or One to three months, or Three to six months, or Six to twelve months, or Twelve to twenty-four months"
    }
  ],

  "dimensionInterpretations": {
    "DimensionName": "2-3 sentence interpretation of this dimension in context."
  }
}

IMPORTANT INSTRUCTIONS:
- Provide exactly 3 signature strengths (top 3 scoring dimensions).
- Provide 4-5 coaching priorities ordered by impact, with varied timeframes.
- The dimensionInterpretations should have one entry per scored dimension.
- The topThree in values must be the 3 highest-scoring values, each with rank 1, 2, 3.
- Every narrative field must be SUBSTANTIAL. This fills a 20-page PDF. Do not be brief. Each paragraph should be 3-5 sentences.
- Return ONLY the JSON object, no other text.`;

  let reportData: Record<string, unknown>;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
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

  // Update the report with AI output
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
