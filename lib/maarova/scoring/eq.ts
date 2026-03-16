/**
 * Emotional Intelligence (EQ) Scoring Engine
 *
 * Scenario-based responses scored against expert consensus.
 * Each question has options with consensus weights (0-4 scale).
 * 4 dimensions: selfAwareness, empathy, socialSkills, emotionalRegulation.
 * Scores normalised to 0-100.
 */

export interface EQScoringConfig {
  consensusWeights?: Record<string, Record<string, number>>;
  dimensionWeights?: Record<string, number>;
}

export interface EQResult {
  selfAwareness: number;
  empathy: number;
  socialSkills: number;
  emotionalRegulation: number;
  overallEQ: number;
}

const EQ_DIMENSIONS = [
  "selfAwareness",
  "empathy",
  "socialSkills",
  "emotionalRegulation",
] as const;

export function scoreEQ(
  responses: { questionId: string; answer: unknown }[],
  config?: EQScoringConfig
): EQResult {
  const consensusWeights = config?.consensusWeights ?? {};
  const dimensionWeights = config?.dimensionWeights ?? {
    selfAwareness: 0.25,
    empathy: 0.25,
    socialSkills: 0.25,
    emotionalRegulation: 0.25,
  };

  // Accumulate raw scores per dimension
  const dimScores: Record<string, number[]> = {};
  for (const dim of EQ_DIMENSIONS) {
    dimScores[dim] = [];
  }

  for (const resp of responses) {
    const answer = resp.answer as {
      selectedOption?: string;
      ratings?: Record<string, number>;
      dimension?: string;
    } | null;
    if (!answer || typeof answer !== "object") continue;

    // Determine the dimension for this question
    const dim = answer.dimension;
    if (!dim || !EQ_DIMENSIONS.includes(dim as (typeof EQ_DIMENSIONS)[number])) continue;

    // Score via consensus weights if available
    const qWeights = consensusWeights[resp.questionId];

    if (answer.ratings && typeof answer.ratings === "object") {
      // Scenario with multiple option ratings (MSCEIT-style)
      let totalScore = 0;
      let totalMaxScore = 0;
      for (const [optionKey, rating] of Object.entries(answer.ratings)) {
        if (typeof rating !== "number") continue;
        const consensusVal = qWeights?.[optionKey] ?? 0;
        // Score = how close the rating matches the consensus
        // Using absolute deviation method: max - |rating - consensus|
        const maxRating = 4;
        const deviation = Math.abs(rating - consensusVal);
        totalScore += maxRating - deviation;
        totalMaxScore += maxRating;
      }
      if (totalMaxScore > 0) {
        dimScores[dim].push((totalScore / totalMaxScore) * 100);
      }
    } else if (answer.selectedOption !== undefined) {
      // Single selected option
      const weight = qWeights?.[answer.selectedOption] ?? 0;
      // Consensus weights expected on 0-4 scale, normalise to 0-100
      dimScores[dim].push((weight / 4) * 100);
    }
  }

  // Average per dimension
  const scaled: Record<string, number> = {};
  for (const dim of EQ_DIMENSIONS) {
    const scores = dimScores[dim];
    if (scores.length === 0) {
      scaled[dim] = 0;
    } else {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      scaled[dim] = Math.round(Math.min(100, Math.max(0, avg)));
    }
  }

  // Overall EQ: weighted average
  let overallEQ = 0;
  for (const dim of EQ_DIMENSIONS) {
    overallEQ += scaled[dim] * (dimensionWeights[dim] ?? 0.25);
  }
  overallEQ = Math.round(Math.min(100, Math.max(0, overallEQ)));

  return {
    selfAwareness: scaled.selfAwareness,
    empathy: scaled.empathy,
    socialSkills: scaled.socialSkills,
    emotionalRegulation: scaled.emotionalRegulation,
    overallEQ,
  };
}
