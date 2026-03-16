/**
 * Culture & Team Scoring Engine
 *
 * Likert-5 scale. Competing Values Framework adapted for healthcare.
 * 4 quadrants: collaborate, create, compete, control.
 * Plus teamEffectiveness and engagementDrivers aggregates.
 * Scores normalised to 0-100.
 */

export interface CultureScoringConfig {
  maxLikert?: number;
  teamDimensions?: string[];
  engagementDimensions?: string[];
}

export interface CultureResult {
  culture: {
    collaborate: number;
    create: number;
    compete: number;
    control: number;
    dominant: string;
  };
  teamEffectiveness: number;
  engagementDrivers: Record<string, number>;
}

const CVF_QUADRANTS = ["collaborate", "create", "compete", "control"] as const;

export function scoreCulture(
  responses: { questionId: string; answer: unknown }[],
  config?: CultureScoringConfig
): CultureResult {
  const maxLikert = config?.maxLikert ?? 5;
  const teamDims = new Set(config?.teamDimensions ?? ["teamEffectiveness"]);
  const engagementDims = new Set(
    config?.engagementDimensions ?? [
      "autonomy",
      "mastery",
      "purpose",
      "recognition",
      "belonging",
    ]
  );

  const cvfScores: Record<string, number[]> = {};
  for (const q of CVF_QUADRANTS) {
    cvfScores[q] = [];
  }
  const teamScores: number[] = [];
  const engagementScores: Record<string, number[]> = {};

  for (const resp of responses) {
    const answer = resp.answer as {
      value?: number;
      dimension?: string;
      subDimension?: string;
    } | null;
    if (!answer || typeof answer !== "object") continue;

    const value = answer.value;
    if (typeof value !== "number" || value < 1 || value > maxLikert) continue;

    const normalised = ((value - 1) / (maxLikert - 1)) * 100;
    const dim = answer.dimension;

    if (dim && CVF_QUADRANTS.includes(dim as (typeof CVF_QUADRANTS)[number])) {
      cvfScores[dim].push(normalised);
    } else if (dim && teamDims.has(dim)) {
      teamScores.push(normalised);
    } else if (dim && engagementDims.has(dim)) {
      const subDim = answer.subDimension ?? dim;
      if (!engagementScores[subDim]) {
        engagementScores[subDim] = [];
      }
      engagementScores[subDim].push(normalised);
    }
  }

  // Average per CVF quadrant
  const culture: Record<string, number> = {};
  for (const q of CVF_QUADRANTS) {
    const scores = cvfScores[q];
    culture[q] =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
  }

  // Dominant culture
  const sorted = [...CVF_QUADRANTS].sort((a, b) => culture[b] - culture[a]);
  const dominant = sorted[0];

  // Team effectiveness
  const teamEffectiveness =
    teamScores.length > 0
      ? Math.round(teamScores.reduce((a, b) => a + b, 0) / teamScores.length)
      : 0;

  // Engagement drivers
  const engagementDrivers: Record<string, number> = {};
  for (const [key, scores] of Object.entries(engagementScores)) {
    engagementDrivers[key] =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
  }

  return {
    culture: {
      collaborate: culture.collaborate,
      create: culture.create,
      compete: culture.compete,
      control: culture.control,
      dominant,
    },
    teamEffectiveness,
    engagementDrivers,
  };
}
