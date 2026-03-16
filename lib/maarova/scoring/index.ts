/**
 * Maarova Scoring Engine - Index
 *
 * Re-exports all scoring functions and provides a unified scoreModule dispatcher.
 */

export { scoreDISC, type DISCResult, type DISCScoringConfig } from "./disc";
export { scoreValues, type ValuesResult, type ValuesScoringConfig } from "./values";
export { scoreEQ, type EQResult, type EQScoringConfig } from "./eq";
export { scoreCILTI, type CILTIResult, type CILTIScoringConfig } from "./cilti";
export { scoreCulture, type CultureResult, type CultureScoringConfig } from "./culture";
export {
  scoreThreeSixty,
  type ThreeSixtyResult,
  type RaterResponse,
} from "./threeSixty";
export {
  computeComposite,
  type ModuleScores,
  type CompositeResult,
  type RadarDataPoint,
} from "./composite";

import { scoreDISC } from "./disc";
import { scoreValues } from "./values";
import { scoreEQ } from "./eq";
import { scoreCILTI } from "./cilti";
import { scoreCulture } from "./culture";

type MaarovaModuleType =
  | "DISC"
  | "VALUES_DRIVERS"
  | "EMOTIONAL_INTEL"
  | "CILTI"
  | "THREE_SIXTY"
  | "CULTURE_TEAM";

interface ItemResponse {
  questionId: string;
  answer: unknown;
}

/**
 * Unified dispatcher: scores a single module based on its type.
 * For THREE_SIXTY, use scoreThreeSixty directly as it requires rater separation.
 */
export function scoreModule(
  moduleType: MaarovaModuleType,
  responses: ItemResponse[],
  config?: Record<string, unknown>
): Record<string, unknown> {
  switch (moduleType) {
    case "DISC":
      return scoreDISC(responses, config) as unknown as Record<string, unknown>;

    case "VALUES_DRIVERS":
      return scoreValues(responses, config) as unknown as Record<string, unknown>;

    case "EMOTIONAL_INTEL":
      return scoreEQ(responses, config) as unknown as Record<string, unknown>;

    case "CILTI":
      return scoreCILTI(responses, config) as unknown as Record<string, unknown>;

    case "CULTURE_TEAM":
      return scoreCulture(responses, config) as unknown as Record<string, unknown>;

    case "THREE_SIXTY":
      // 360 requires separate rater/self responses. Return empty for dispatcher.
      // Use scoreThreeSixty() directly.
      return { note: "Use scoreThreeSixty() directly for 360 feedback scoring." };

    default:
      throw new Error(`Unknown module type: ${moduleType}`);
  }
}
