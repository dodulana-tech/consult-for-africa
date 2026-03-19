/**
 * CILTI (Clinical Identity to Leadership Transition Inventory) Scoring Engine
 *
 * Likert-7 scale with reverse scoring on designated items.
 * 4 sub-dimensions: clinicalIdentity, leadershipIdentity, transitionReadiness, identityFriction.
 * Composite = weighted average of sub-dimensions.
 * Risk zones:
 *   < 40  = High Risk
 *   40-60 = Transitioning
 *   60-80 = Emerging Leader
 *   80+   = Established Leader
 */

export interface CILTIScoringConfig {
  maxLikert?: number;
  dimensionWeights?: Record<string, number>;
  reversedQuestionIds?: string[];
}

export interface CILTIResult {
  clinicalIdentity: number;
  leadershipIdentity: number;
  transitionReadiness: number;
  identityFriction: number;
  ciltiComposite: number;
  riskZone: string;
}

const CILTI_DIMENSIONS = [
  "clinicalIdentity",
  "leadershipIdentity",
  "transitionReadiness",
  "identityFriction",
] as const;

function getRiskZone(composite: number): string {
  if (composite < 40) return "High Risk";
  if (composite < 60) return "Transitioning";
  if (composite < 80) return "Emerging Leader";
  return "Established Leader";
}

export function scoreCILTI(
  responses: { questionId: string; answer: unknown }[],
  config?: CILTIScoringConfig
): CILTIResult {
  const maxLikert = config?.maxLikert ?? 7;
  const dimensionWeights = config?.dimensionWeights ?? {
    clinicalIdentity: 0.2,
    leadershipIdentity: 0.3,
    transitionReadiness: 0.3,
    identityFriction: 0.2,
  };
  const reversedIds = new Set(config?.reversedQuestionIds ?? []);

  const dimScores: Record<string, number[]> = {};
  for (const dim of CILTI_DIMENSIONS) {
    dimScores[dim] = [];
  }

  // Map snake_case dimension names to camelCase
  const dimMap: Record<string, string> = {
    clinical_identity: "clinicalIdentity",
    clinicalIdentity: "clinicalIdentity",
    leadership_identity: "leadershipIdentity",
    leadershipIdentity: "leadershipIdentity",
    transition_readiness: "transitionReadiness",
    transitionReadiness: "transitionReadiness",
    identity_friction: "identityFriction",
    identityFriction: "identityFriction",
  };

  for (const resp of responses) {
    const answer = resp.answer as {
      value?: number;
      dimension?: string;
    } | null;
    if (!answer || typeof answer !== "object") continue;

    const rawDim = answer.dimension;
    if (!rawDim) continue;
    const dim = dimMap[rawDim];
    if (!dim || !CILTI_DIMENSIONS.includes(dim as (typeof CILTI_DIMENSIONS)[number])) continue;

    let value = answer.value;
    if (typeof value !== "number" || value < 1 || value > maxLikert) continue;

    // Reverse scoring: reverse = (maxLikert + 1) - value
    if (reversedIds.has(resp.questionId)) {
      value = maxLikert + 1 - value;
    }

    // Normalise single item to 0-100
    const normalised = ((value - 1) / (maxLikert - 1)) * 100;
    dimScores[dim].push(normalised);
  }

  // Average per dimension
  const scaled: Record<string, number> = {};
  for (const dim of CILTI_DIMENSIONS) {
    const scores = dimScores[dim];
    if (scores.length === 0) {
      scaled[dim] = 0;
    } else {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      scaled[dim] = Math.round(Math.min(100, Math.max(0, avg)));
    }
  }

  // For identityFriction, higher raw score = more friction = worse for leadership,
  // so we invert it for the composite calculation
  const frictionInverted = 100 - scaled.identityFriction;

  // Weighted composite
  let composite = 0;
  for (const dim of CILTI_DIMENSIONS) {
    const weight = dimensionWeights[dim] ?? 0.25;
    const val = dim === "identityFriction" ? frictionInverted : scaled[dim];
    composite += val * weight;
  }
  composite = Math.round(Math.min(100, Math.max(0, composite)));

  return {
    clinicalIdentity: scaled.clinicalIdentity,
    leadershipIdentity: scaled.leadershipIdentity,
    transitionReadiness: scaled.transitionReadiness,
    identityFriction: scaled.identityFriction,
    ciltiComposite: composite,
    riskZone: getRiskZone(composite),
  };
}
