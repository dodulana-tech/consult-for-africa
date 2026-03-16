/**
 * DISC Behavioural Style Scoring Engine
 *
 * Forced-choice pairs: each group presents 4 statements mapped to D, I, S, C.
 * "Most like me" => +1 to that dimension.
 * "Least like me" => -1 to that dimension (difference scoring).
 * Scores are normalised to 0-100 scale.
 */

export interface DISCItemResponse {
  questionId: string;
  answer: {
    most: string; // dimension key: "D" | "I" | "S" | "C"
    least: string; // dimension key: "D" | "I" | "S" | "C"
  };
}

export interface DISCScoringConfig {
  totalGroups?: number;
  dimensions?: string[];
  adaptedWeights?: Record<string, number>;
}

export interface DISCResult {
  D: number;
  I: number;
  S: number;
  C: number;
  primaryStyle: string;
  adaptedStyle: string;
  rawD: number;
  rawI: number;
  rawS: number;
  rawC: number;
}

const DIMENSIONS = ["D", "I", "S", "C"] as const;

export function scoreDISC(
  responses: { questionId: string; answer: unknown }[],
  config?: DISCScoringConfig
): DISCResult {
  const totalGroups = config?.totalGroups ?? 24;
  const raw: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };

  for (const resp of responses) {
    const answer = resp.answer as { most?: string; least?: string } | null;
    if (!answer || typeof answer !== "object") continue;

    const most = answer.most?.toUpperCase();
    const least = answer.least?.toUpperCase();

    if (most && DIMENSIONS.includes(most as (typeof DIMENSIONS)[number])) {
      raw[most] += 1;
    }
    if (least && DIMENSIONS.includes(least as (typeof DIMENSIONS)[number])) {
      raw[least] -= 1;
    }
  }

  // Raw range per dimension: -totalGroups to +totalGroups
  // Normalise to 0-100
  const maxRaw = totalGroups;
  const normalise = (val: number) =>
    Math.round(Math.min(100, Math.max(0, ((val + maxRaw) / (2 * maxRaw)) * 100)));

  const scaled: Record<string, number> = {};
  for (const dim of DIMENSIONS) {
    scaled[dim] = normalise(raw[dim]);
  }

  // Primary style: highest scaled score
  const sorted = [...DIMENSIONS].sort((a, b) => scaled[b] - scaled[a]);
  const primaryStyle = sorted[0];

  // Adapted style: second highest, or blend if close
  const adaptedStyle =
    scaled[sorted[0]] - scaled[sorted[1]] <= 5
      ? `${sorted[0]}/${sorted[1]}`
      : sorted[1];

  return {
    D: scaled.D,
    I: scaled.I,
    S: scaled.S,
    C: scaled.C,
    primaryStyle,
    adaptedStyle,
    rawD: raw.D,
    rawI: raw.I,
    rawS: raw.S,
    rawC: raw.C,
  };
}
