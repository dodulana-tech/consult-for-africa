import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getQuestionBank } from "@/lib/consultantAssessment/questions";
import { handler } from "@/lib/api-handler";

const anthropic = new Anthropic();

interface ScoringResult {
  contentScore: number;
  integrityScore: number;
  breakdown: {
    scenario: { score: number; feedback: string };
    experience: { score: number; feedback: string };
    quickfire: { score: number; feedback: string };
    overall: string;
    strengths: string[];
    concerns: string[];
    recommendedTier: string;
  };
}

async function scoreWithAI(
  specialty: string,
  responses: Array<{
    part: string;
    questionId: string;
    questionText: string;
    answer: string;
    timeSpentSec: number | null;
    pasteEvents: number;
    tabSwitches: number;
    wordCount: number | null;
  }>,
  integrityData: {
    tabSwitchCount: number;
    pasteEventCount: number;
    suspiciousFlags: unknown;
  }
): Promise<ScoringResult> {
  const questionBank = getQuestionBank(specialty);

  const scenarioResponses = responses.filter((r) => r.part === "scenario");
  const experienceResponses = responses.filter((r) => r.part === "experience");
  const quickfireResponses = responses.filter((r) => r.part === "quickfire");

  const prompt = `You are an expert assessor for Consult for Africa (C4A), an African healthcare consulting firm. You are evaluating a consultant applicant for the ${specialty} specialty.

Evaluate the following assessment responses and provide scoring. Be rigorous but fair. This is a vetting assessment, not a training exercise.

ASSESSMENT DATA:
================

SPECIALTY: ${specialty}

PART 1 - SCENARIO RESPONSE (15 min allowed):
${scenarioResponses
  .map(
    (r) => `Question: ${r.questionText}
Answer: ${r.answer}
Time spent: ${r.timeSpentSec ? Math.round(r.timeSpentSec / 60) + " minutes" : "unknown"}
Word count: ${r.wordCount || "unknown"}
Paste events: ${r.pasteEvents}`
  )
  .join("\n\n")}

PART 2 - EXPERIENCE DEEP-DIVE (5 min each):
${experienceResponses
  .map(
    (r) => `Question: ${r.questionText}
Answer: ${r.answer}
Time spent: ${r.timeSpentSec ? Math.round(r.timeSpentSec / 60) + " minutes" : "unknown"}
Word count: ${r.wordCount || "unknown"}
Paste events: ${r.pasteEvents}`
  )
  .join("\n\n")}

PART 3 - QUICK-FIRE (60 sec each):
${quickfireResponses
  .map(
    (r) => `Question: ${r.questionText}
Answer: ${r.answer}
Time spent: ${r.timeSpentSec ? r.timeSpentSec + " seconds" : "unknown"}
Paste events: ${r.pasteEvents}`
  )
  .join("\n\n")}

INTEGRITY SIGNALS:
Total tab switches: ${integrityData.tabSwitchCount}
Total paste events: ${integrityData.pasteEventCount}
Suspicious flags: ${JSON.stringify(integrityData.suspiciousFlags || {})}

Total questions in bank: Scenario: ${questionBank?.scenario.length || 0}, Experience: ${questionBank?.experience.length || 0}, Quickfire: ${questionBank?.quickfire.length || 0}
Total responses received: Scenario: ${scenarioResponses.length}, Experience: ${experienceResponses.length}, Quickfire: ${quickfireResponses.length}

SCORING INSTRUCTIONS:
=====================

1. Content Score (0-100): Evaluate the quality, depth, and accuracy of answers.
   - Does the candidate demonstrate real-world African healthcare experience?
   - Are answers specific (names, numbers, frameworks) or generic?
   - Do quick-fire answers show genuine market knowledge vs. vague generalities?
   - Does the scenario response show a structured, actionable approach?

2. Integrity Score (0-100): Assess authenticity of the submission.
   - High paste counts + polished answers = likely AI-assisted
   - Very fast scenario answers with high word count = suspicious
   - Tab switches during quick-fire = likely looking up answers
   - Consistent typing patterns and appropriate time usage = authentic
   - Consider: someone who knows the material should answer quick-fire questions confidently within 60 seconds

3. Recommended Tier:
   - PRINCIPAL: Exceptional depth, clear senior experience, strategic thinking, 80+ content score
   - SENIOR: Strong answers, demonstrated experience, good market knowledge, 60-79 content score
   - STANDARD: Adequate but not exceptional, may need development, 40-59 content score
   - Below 40: Not recommended for engagement

Return your evaluation as a JSON object with this exact structure:
{
  "contentScore": <0-100>,
  "integrityScore": <0-100>,
  "breakdown": {
    "scenario": { "score": <0-100>, "feedback": "<2-3 sentences>" },
    "experience": { "score": <0-100>, "feedback": "<2-3 sentences>" },
    "quickfire": { "score": <0-100>, "feedback": "<2-3 sentences>" },
    "overall": "<3-4 sentence summary>",
    "strengths": ["<strength 1>", "<strength 2>", ...],
    "concerns": ["<concern 1>", "<concern 2>", ...],
    "recommendedTier": "STANDARD" | "SENIOR" | "PRINCIPAL" | "NOT_RECOMMENDED"
  }
}

Return ONLY the JSON object, no additional text.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response format from AI scoring");
  }

  // Parse the JSON response, handling potential markdown code blocks
  let jsonText = content.text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const result = JSON.parse(jsonText) as ScoringResult;

  // Validate score ranges
  result.contentScore = Math.max(0, Math.min(100, result.contentScore));
  result.integrityScore = Math.max(0, Math.min(100, result.integrityScore));

  return result;
}

export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const assessment = await prisma.consultantAssessment.findUnique({
    where: { id },
    include: { responses: true },
  });

  if (!assessment) {
    return Response.json({ error: "Assessment not found" }, { status: 404 });
  }

  if (assessment.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (assessment.status === "COMPLETED") {
    return Response.json({ error: "Assessment already completed" }, { status: 400 });
  }

  if (assessment.status === "EXPIRED" || assessment.expiresAt <= new Date()) {
    await prisma.consultantAssessment.update({
      where: { id },
      data: { status: "EXPIRED" },
    });
    return Response.json({ error: "Assessment has expired" }, { status: 400 });
  }

  if (assessment.responses.length === 0) {
    return Response.json(
      { error: "Cannot complete assessment with no responses" },
      { status: 400 }
    );
  }

  // Run AI scoring
  let scoringResult: ScoringResult;
  try {
    scoringResult = await scoreWithAI(
      assessment.specialty,
      assessment.responses.map((r) => ({
        part: r.part,
        questionId: r.questionId,
        questionText: r.questionText,
        answer: r.answer,
        timeSpentSec: r.timeSpentSec,
        pasteEvents: r.pasteEvents,
        tabSwitches: r.tabSwitches,
        wordCount: r.wordCount,
      })),
      {
        tabSwitchCount: assessment.tabSwitchCount,
        pasteEventCount: assessment.pasteEventCount,
        suspiciousFlags: assessment.suspiciousFlags,
      }
    );
  } catch (error) {
    console.error("AI scoring failed:", error);
    // Mark as completed even if AI scoring fails; admin can review manually
    await prisma.consultantAssessment.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return Response.json({
      ok: true,
      assessment: {
        id: assessment.id,
        status: "COMPLETED",
        completedAt: new Date(),
        aiContentScore: null,
        aiIntegrityScore: null,
        aiScoringError: "AI scoring encountered an error. An admin will review manually.",
      },
    });
  }

  const updated = await prisma.consultantAssessment.update({
    where: { id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      aiContentScore: scoringResult.contentScore,
      aiIntegrityScore: scoringResult.integrityScore,
      aiBreakdown: JSON.parse(JSON.stringify(scoringResult.breakdown)),
    },
  });

  return Response.json({
    ok: true,
    assessment: {
      id: updated.id,
      status: updated.status,
      completedAt: updated.completedAt,
      aiContentScore: updated.aiContentScore,
      aiIntegrityScore: updated.aiIntegrityScore,
      aiBreakdown: updated.aiBreakdown,
    },
  });
});
