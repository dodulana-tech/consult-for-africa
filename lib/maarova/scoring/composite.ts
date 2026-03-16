/**
 * Composite Score Engine
 *
 * Combines all module scores into an overall radar chart and dimension summary.
 */

import type { DISCResult } from "./disc";
import type { ValuesResult } from "./values";
import type { EQResult } from "./eq";
import type { CILTIResult } from "./cilti";
import type { CultureResult } from "./culture";
import type { ThreeSixtyResult } from "./threeSixty";

export interface ModuleScores {
  disc?: DISCResult;
  values?: ValuesResult;
  eq?: EQResult;
  cilti?: CILTIResult;
  culture?: CultureResult;
  threeSixty?: ThreeSixtyResult;
}

export interface RadarDataPoint {
  dimension: string;
  label: string;
  score: number;
  module: string;
}

export interface CompositeResult {
  overallScore: number;
  radarChartData: RadarDataPoint[];
  dimensionScores: Record<string, number>;
  moduleCompletionCount: number;
  totalModules: number;
}

export function computeComposite(moduleScores: ModuleScores): CompositeResult {
  const radarChartData: RadarDataPoint[] = [];
  const dimensionScores: Record<string, number> = {};
  const allScores: number[] = [];
  let moduleCount = 0;

  // DISC: use average of D, I, S, C as one dimension contribution
  if (moduleScores.disc) {
    moduleCount++;
    const d = moduleScores.disc;
    const discAvg = Math.round((d.D + d.I + d.S + d.C) / 4);
    dimensionScores["Behavioural Style"] = discAvg;
    allScores.push(discAvg);

    radarChartData.push(
      { dimension: "D", label: "Dominance", score: d.D, module: "DISC" },
      { dimension: "I", label: "Influence", score: d.I, module: "DISC" },
      { dimension: "S", label: "Steadiness", score: d.S, module: "DISC" },
      { dimension: "C", label: "Conscientiousness", score: d.C, module: "DISC" }
    );
  }

  // Values & Drivers
  if (moduleScores.values) {
    moduleCount++;
    const v = moduleScores.values;
    const valArr = [
      v.theoretical,
      v.economic,
      v.aesthetic,
      v.social,
      v.political,
      v.regulatory,
    ];
    const valAvg = Math.round(valArr.reduce((a, b) => a + b, 0) / valArr.length);
    dimensionScores["Values Alignment"] = valAvg;
    allScores.push(valAvg);

    radarChartData.push(
      { dimension: "theoretical", label: "Theoretical", score: v.theoretical, module: "VALUES" },
      { dimension: "economic", label: "Economic", score: v.economic, module: "VALUES" },
      { dimension: "aesthetic", label: "Aesthetic", score: v.aesthetic, module: "VALUES" },
      { dimension: "social", label: "Social", score: v.social, module: "VALUES" },
      { dimension: "political", label: "Political", score: v.political, module: "VALUES" },
      { dimension: "regulatory", label: "Regulatory", score: v.regulatory, module: "VALUES" }
    );
  }

  // EQ
  if (moduleScores.eq) {
    moduleCount++;
    const e = moduleScores.eq;
    dimensionScores["Emotional Intelligence"] = e.overallEQ;
    allScores.push(e.overallEQ);

    radarChartData.push(
      { dimension: "selfAwareness", label: "Self-Awareness", score: e.selfAwareness, module: "EQ" },
      { dimension: "empathy", label: "Empathy", score: e.empathy, module: "EQ" },
      { dimension: "socialSkills", label: "Social Skills", score: e.socialSkills, module: "EQ" },
      { dimension: "emotionalRegulation", label: "Emotional Regulation", score: e.emotionalRegulation, module: "EQ" }
    );
  }

  // CILTI
  if (moduleScores.cilti) {
    moduleCount++;
    const c = moduleScores.cilti;
    dimensionScores["Leadership Identity"] = c.ciltiComposite;
    allScores.push(c.ciltiComposite);

    radarChartData.push(
      { dimension: "clinicalIdentity", label: "Clinical Identity", score: c.clinicalIdentity, module: "CILTI" },
      { dimension: "leadershipIdentity", label: "Leadership Identity", score: c.leadershipIdentity, module: "CILTI" },
      { dimension: "transitionReadiness", label: "Transition Readiness", score: c.transitionReadiness, module: "CILTI" },
      { dimension: "identityFriction", label: "Identity Friction", score: c.identityFriction, module: "CILTI" }
    );
  }

  // Culture & Team
  if (moduleScores.culture) {
    moduleCount++;
    const cu = moduleScores.culture;
    const cultureAvg = Math.round(
      (cu.culture.collaborate + cu.culture.create + cu.culture.compete + cu.culture.control) / 4
    );
    dimensionScores["Culture Fit"] = cultureAvg;
    dimensionScores["Team Effectiveness"] = cu.teamEffectiveness;
    allScores.push(cultureAvg, cu.teamEffectiveness);

    radarChartData.push(
      { dimension: "collaborate", label: "Collaborate", score: cu.culture.collaborate, module: "CULTURE" },
      { dimension: "create", label: "Create", score: cu.culture.create, module: "CULTURE" },
      { dimension: "compete", label: "Compete", score: cu.culture.compete, module: "CULTURE" },
      { dimension: "control", label: "Control", score: cu.culture.control, module: "CULTURE" }
    );
  }

  // 360 Feedback
  if (moduleScores.threeSixty) {
    moduleCount++;
    const t = moduleScores.threeSixty;
    if (t.dimensions.length > 0) {
      const avgOther = Math.round(
        t.dimensions.reduce((a, d) => a + d.overallOtherAvg, 0) / t.dimensions.length
      );
      dimensionScores["360 Feedback"] = avgOther;
      allScores.push(avgOther);

      for (const dim of t.dimensions) {
        radarChartData.push({
          dimension: dim.dimension,
          label: dim.dimension,
          score: dim.overallOtherAvg,
          module: "360",
        });
      }
    }
  }

  // Overall score: average of all dimension scores
  const overallScore =
    allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

  return {
    overallScore,
    radarChartData,
    dimensionScores,
    moduleCompletionCount: moduleCount,
    totalModules: 6,
  };
}
