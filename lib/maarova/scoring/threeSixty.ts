/**
 * 360 Feedback Scoring Engine
 *
 * Aggregates rater responses by role group.
 * Computes gaps between self-assessment and rater averages.
 * Identifies blind spots (self >> others) and hidden strengths (self << others).
 */

export interface RaterResponse {
  raterId: string;
  raterRole: "SELF" | "SUPERVISOR" | "PEER" | "DIRECT_REPORT";
  responses: { questionId: string; answer: unknown }[];
}

export interface ThreeSixtyDimension {
  dimension: string;
  selfScore: number;
  supervisorAvg: number;
  peerAvg: number;
  directReportAvg: number;
  overallOtherAvg: number;
  gap: number; // self - overallOtherAvg
}

export interface ThreeSixtyResult {
  dimensions: ThreeSixtyDimension[];
  blindSpots: ThreeSixtyDimension[];
  hiddenStrengths: ThreeSixtyDimension[];
}

const BLIND_SPOT_THRESHOLD = 15; // self > others by this much = blind spot
const HIDDEN_STRENGTH_THRESHOLD = 15; // others > self by this much = hidden strength

function averageScores(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function scoreThreeSixty(
  raterResponses: RaterResponse[],
  selfResponses: { questionId: string; answer: unknown }[]
): ThreeSixtyResult {
  // Group all responses by dimension, then by rater role
  const dimensionMap: Record<
    string,
    Record<string, number[]>
  > = {};

  // Process self responses
  for (const resp of selfResponses) {
    const answer = resp.answer as { value?: number; dimension?: string } | null;
    if (!answer || typeof answer !== "object") continue;
    const dim = answer.dimension;
    const value = answer.value;
    if (!dim || typeof value !== "number") continue;

    // Normalise Likert-5 to 0-100
    const normalised = ((value - 1) / 4) * 100;

    if (!dimensionMap[dim]) {
      dimensionMap[dim] = { SELF: [], SUPERVISOR: [], PEER: [], DIRECT_REPORT: [] };
    }
    dimensionMap[dim].SELF.push(normalised);
  }

  // Process rater responses
  for (const rater of raterResponses) {
    if (rater.raterRole === "SELF") continue; // Self handled above

    for (const resp of rater.responses) {
      const answer = resp.answer as { value?: number; dimension?: string } | null;
      if (!answer || typeof answer !== "object") continue;
      const dim = answer.dimension;
      const value = answer.value;
      if (!dim || typeof value !== "number") continue;

      const normalised = ((value - 1) / 4) * 100;

      if (!dimensionMap[dim]) {
        dimensionMap[dim] = { SELF: [], SUPERVISOR: [], PEER: [], DIRECT_REPORT: [] };
      }
      dimensionMap[dim][rater.raterRole].push(normalised);
    }
  }

  // Build dimension results
  const dimensions: ThreeSixtyDimension[] = [];

  for (const [dim, roleScores] of Object.entries(dimensionMap)) {
    const selfScore = averageScores(roleScores.SELF);
    const supervisorAvg = averageScores(roleScores.SUPERVISOR);
    const peerAvg = averageScores(roleScores.PEER);
    const directReportAvg = averageScores(roleScores.DIRECT_REPORT);

    // Overall other average (all non-self)
    const allOtherScores = [
      ...roleScores.SUPERVISOR,
      ...roleScores.PEER,
      ...roleScores.DIRECT_REPORT,
    ];
    const overallOtherAvg = averageScores(allOtherScores);

    const gap = selfScore - overallOtherAvg;

    dimensions.push({
      dimension: dim,
      selfScore,
      supervisorAvg,
      peerAvg,
      directReportAvg,
      overallOtherAvg,
      gap,
    });
  }

  // Sort by dimension name for consistency
  dimensions.sort((a, b) => a.dimension.localeCompare(b.dimension));

  // Blind spots: self rates much higher than others
  const blindSpots = dimensions.filter((d) => d.gap >= BLIND_SPOT_THRESHOLD);

  // Hidden strengths: others rate much higher than self
  const hiddenStrengths = dimensions.filter((d) => d.gap <= -HIDDEN_STRENGTH_THRESHOLD);

  return {
    dimensions,
    blindSpots,
    hiddenStrengths,
  };
}
