/**
 * Values & Drivers Scoring Engine
 *
 * Ranking format: user ranks 6 values.
 * Rank 1 = 6 points, Rank 2 = 5 points, ..., Rank 6 = 1 point.
 * Multiple ranking groups are summed per dimension.
 * Scores normalised to 0-100.
 */

export interface ValuesItemResponse {
  questionId: string;
  answer: {
    rankings: Record<string, number>; // dimension => rank (1-6)
  };
}

export interface ValuesScoringConfig {
  totalGroups?: number;
  dimensions?: string[];
}

export interface ValuesResult {
  theoretical: number;
  economic: number;
  aesthetic: number;
  social: number;
  political: number;
  regulatory: number;
  primaryDriver: string;
  secondaryDriver: string;
}

const VALUE_DIMENSIONS = [
  "theoretical",
  "economic",
  "aesthetic",
  "social",
  "political",
  "regulatory",
] as const;

export function scoreValues(
  responses: { questionId: string; answer: unknown }[],
  config?: ValuesScoringConfig
): ValuesResult {
  const totalGroups = config?.totalGroups ?? 10;
  const dimensions = config?.dimensions ?? [...VALUE_DIMENSIONS];
  const dimCount = dimensions.length;
  const raw: Record<string, number> = {};

  for (const dim of dimensions) {
    raw[dim] = 0;
  }

  let groupsProcessed = 0;

  for (const resp of responses) {
    const answer = resp.answer as { rankings?: Record<string, number> } | null;
    if (!answer || typeof answer !== "object" || !answer.rankings) continue;

    const rankings = answer.rankings;
    groupsProcessed++;

    for (const dim of dimensions) {
      const rank = rankings[dim];
      if (typeof rank === "number" && rank >= 1 && rank <= dimCount) {
        // Rank 1 gets highest points, Rank N gets 1 point
        raw[dim] += dimCount + 1 - rank;
      }
    }
  }

  // Max possible per dimension: totalGroups * dimCount (rank 1 every time)
  // Min possible: totalGroups * 1
  const effectiveGroups = Math.max(groupsProcessed, 1);
  const maxRaw = effectiveGroups * dimCount;
  const minRaw = effectiveGroups * 1;

  const normalise = (val: number) =>
    Math.round(
      Math.min(100, Math.max(0, ((val - minRaw) / (maxRaw - minRaw)) * 100))
    );

  const scaled: Record<string, number> = {};
  for (const dim of dimensions) {
    scaled[dim] = normalise(raw[dim]);
  }

  // Sort by score to identify primary and secondary drivers
  const sorted = [...dimensions].sort((a, b) => scaled[b] - scaled[a]);

  return {
    theoretical: scaled.theoretical ?? 0,
    economic: scaled.economic ?? 0,
    aesthetic: scaled.aesthetic ?? 0,
    social: scaled.social ?? 0,
    political: scaled.political ?? 0,
    regulatory: scaled.regulatory ?? 0,
    primaryDriver: sorted[0],
    secondaryDriver: sorted[1],
  };
}
