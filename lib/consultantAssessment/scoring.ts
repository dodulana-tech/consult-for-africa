import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ---- Quick-fire scoring (programmatic, no AI) ----

interface QuickFireResponse {
  questionId: string;
  answer: string;
  questionText: string;
}

interface QuickFireResult {
  questionId: string;
  correct: boolean;
  notes: string;
}

/**
 * Known quick-fire reference answers.
 * Each entry can be a set of acceptable keywords/ranges.
 */
const QUICKFIRE_ANSWERS: Record<
  string,
  { keywords?: string[]; range?: { min: number; max: number }; note: string }
> = {
  "qf-bed-occupancy": {
    range: { min: 75, max: 90 },
    note: "Optimal bed occupancy is typically 75-90%.",
  },
  "qf-revenue-cycle-days": {
    range: { min: 30, max: 60 },
    note: "Revenue cycle best practice is 30-60 days.",
  },
  "qf-nhia-acronym": {
    keywords: ["national health insurance authority", "nhia"],
    note: "NHIA = National Health Insurance Authority.",
  },
  "qf-clinical-governance": {
    keywords: ["clinical audit", "risk management", "patient safety", "quality improvement"],
    note: "Clinical governance pillars include clinical audit, risk management, patient safety, and quality improvement.",
  },
  "qf-diagnosis-coding": {
    keywords: ["icd", "icd-10", "icd-11"],
    note: "ICD (International Classification of Diseases) is the standard.",
  },
  "qf-patient-safety": {
    keywords: ["incident reporting", "root cause", "morbidity and mortality", "never events"],
    note: "Patient safety frameworks rely on incident reporting and root cause analysis.",
  },
};

export function scoreQuickFire(responses: QuickFireResponse[]): QuickFireResult[] {
  return responses.map((resp) => {
    const ref = QUICKFIRE_ANSWERS[resp.questionId];
    if (!ref) {
      return {
        questionId: resp.questionId,
        correct: false,
        notes: "No reference answer available for this question.",
      };
    }

    const answer = resp.answer.trim().toLowerCase();

    // Range check (extract first number from response)
    if (ref.range) {
      const numMatch = answer.match(/\d+/);
      if (numMatch) {
        const num = parseInt(numMatch[0], 10);
        const correct = num >= ref.range.min && num <= ref.range.max;
        return {
          questionId: resp.questionId,
          correct,
          notes: correct
            ? `Answer ${num} is within the acceptable range (${ref.range.min}-${ref.range.max}).`
            : `Answer ${num} is outside the acceptable range (${ref.range.min}-${ref.range.max}). ${ref.note}`,
        };
      }
    }

    // Keyword check
    if (ref.keywords) {
      const matchCount = ref.keywords.filter((kw) => answer.includes(kw.toLowerCase())).length;
      const correct = matchCount >= 1;
      return {
        questionId: resp.questionId,
        correct,
        notes: correct
          ? `Matched ${matchCount}/${ref.keywords.length} key concepts.`
          : `Did not match any expected concepts. ${ref.note}`,
      };
    }

    return { questionId: resp.questionId, correct: false, notes: ref.note };
  });
}

// ---- AI scoring ----

interface AIResponseBreakdown {
  questionId: string;
  contentScore: number;
  authenticityScore: number;
  notes: string;
}

interface AIScoreResult {
  contentScore: number;
  integrityScore: number;
  breakdown: AIResponseBreakdown[];
  recommendedTier: "STANDARD" | "SENIOR" | "PRINCIPAL" | "REJECT";
  redFlags: string[];
  narrative: string;
}

const SYSTEM_PROMPT = `You are a senior evaluator at Consult for Africa, a healthcare management consulting firm in Africa. You are scoring a consultant candidate's assessment.

Your evaluation has two dimensions:
1. CONTENT QUALITY (0-100): How good are the answers? Consider domain expertise, specificity, practical experience, African healthcare context awareness, strategic thinking, and communication clarity.
2. AUTHENTICITY (0-100): How likely is it that this person wrote these answers themselves without AI assistance? Consider:
   - Specificity: Do they reference real experiences, hospitals, numbers, or is it generic?
   - Writing style: Natural writing with personality vs polished/generic prose?
   - Consistency: Do different answers reflect the same person's experience?
   - Context accuracy: Are African healthcare references accurate and specific?
   - Depth: Do they show the messy reality of consulting or textbook perfection?

Scoring guide for AUTHENTICITY:
90-100: Clearly authentic, rich personal detail, references specific engagements
70-89: Likely authentic, some specific detail, minor generic elements
50-69: Uncertain, mix of specific and generic, could be AI-enhanced
30-49: Suspicious, mostly generic frameworks, lacks personal voice
0-29: Very likely AI-generated, no personal specificity, textbook answers

Also provide:
- Per-response breakdown (content score + authenticity score + notes for each)
- Recommended tier: STANDARD (competent), SENIOR (strong), PRINCIPAL (exceptional), or REJECT
- Red flags (list any specific concerns)
- Overall narrative assessment (2-3 sentences for admin)

Return ONLY valid JSON with this exact structure:
{
  "contentScore": <number 0-100>,
  "integrityScore": <number 0-100>,
  "breakdown": [
    { "questionId": "<string>", "contentScore": <number>, "authenticityScore": <number>, "notes": "<string>" }
  ],
  "recommendedTier": "<STANDARD|SENIOR|PRINCIPAL|REJECT>",
  "redFlags": ["<string>"],
  "narrative": "<string>"
}`;

export async function scoreConsultantAssessment(assessmentId: string): Promise<AIScoreResult> {
  const assessment = await prisma.consultantAssessment.findUniqueOrThrow({
    where: { id: assessmentId },
    include: {
      responses: true,
      user: {
        select: {
          name: true,
          consultantProfile: {
            select: { location: true, yearsExperience: true },
          },
        },
      },
    },
  });

  const responsesPayload = assessment.responses.map((r) => ({
    questionId: r.questionId,
    part: r.part,
    question: r.questionText,
    answer: r.answer,
    integritySignals: {
      timeSpentSec: r.timeSpentSec,
      pasteEvents: r.pasteEvents,
      tabSwitches: r.tabSwitches,
      wordCount: r.wordCount,
    },
  }));

  const profile = assessment.user.consultantProfile;

  const userPrompt = `CANDIDATE INFORMATION:
- Specialty: ${assessment.specialty}
- Years of experience: ${profile?.yearsExperience ?? "unknown"}
- Location: ${profile?.location ?? "unknown"}
- Video submitted: ${assessment.videoUrl ? `Yes (${assessment.videoDurationSec ?? 0}s)` : "No"}

ASSESSMENT RESPONSES:
${JSON.stringify(responsesPayload, null, 2)}

Score this candidate now. Return only valid JSON.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = (message.content[0] as { text: string }).text;

  // Parse JSON from response (handle possible markdown code fences)
  const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
  const result: AIScoreResult = JSON.parse(jsonStr);

  // Persist scores back to the assessment
  await prisma.consultantAssessment.update({
    where: { id: assessmentId },
    data: {
      aiContentScore: Math.round(result.contentScore),
      aiIntegrityScore: Math.round(result.integrityScore),
      aiBreakdown: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue,
    },
  });

  return result;
}
