/**
 * Backfill script: Recompute radarChartData and overallScore for existing Maarova reports.
 * Fixes the bug where raw scores and metadata were included in dimension averages.
 *
 * Usage: npx tsx scripts/backfill-report-scores.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MODULE_LABELS: Record<string, string> = {
  DISC: "Behavioural Style (DISC)",
  VALUES_DRIVERS: "Values and Motivational Drivers",
  EMOTIONAL_INTEL: "Emotional Intelligence",
  CILTI: "Clinical Leadership Transition",
  THREE_SIXTY: "360-Degree Feedback",
  CULTURE_TEAM: "Culture and Team Dynamics",
};

const DIMENSION_KEYS: Record<string, string[]> = {
  DISC: ["D", "I", "S", "C"],
  VALUES_DRIVERS: ["theoretical", "economic", "aesthetic", "social", "political", "regulatory"],
  EMOTIONAL_INTEL: ["selfAwareness", "empathy", "socialSkills", "emotionalRegulation", "overallEQ"],
  CILTI: ["clinicalIdentity", "leadershipIdentity", "transitionReadiness", "ciltiComposite"],
  CULTURE_TEAM: ["teamEffectiveness"],
};

async function main() {
  const reports = await prisma.maarovaReport.findMany({
    where: { status: "READY" },
    include: {
      session: {
        include: {
          moduleResponses: {
            where: { status: "COMPLETED" },
            include: { module: true },
          },
        },
      },
    },
  });

  console.log(`Found ${reports.length} reports to backfill`);

  for (const report of reports) {
    const dimensionScores: Record<string, number> = {};

    for (const mr of report.session.moduleResponses) {
      const scores = mr.scaledScores as Record<string, unknown> | null;
      if (!scores) continue;

      const keys = DIMENSION_KEYS[mr.module.type];
      let values: number[];

      if (keys) {
        values = keys.map((k) => typeof scores[k] === "number" ? scores[k] as number : 0).filter((v) => v > 0);
      } else {
        values = Object.values(scores).filter((v): v is number => typeof v === "number" && v >= 0 && v <= 100);
      }

      if (mr.module.type === "CULTURE_TEAM" && typeof scores.culture === "object" && scores.culture !== null) {
        const culture = scores.culture as Record<string, unknown>;
        for (const k of ["collaborate", "create", "compete", "control"]) {
          if (typeof culture[k] === "number") values.push(culture[k] as number);
        }
      }

      if (values.length > 0) {
        const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        const label = MODULE_LABELS[mr.module.type] ?? mr.module.name;
        dimensionScores[label] = avg;
      }
    }

    const radarChartData = Object.entries(dimensionScores).map(([dimension, score]) => ({
      dimension,
      score,
      benchmark: 65,
    }));

    const allDimScores = Object.values(dimensionScores);
    const overallScore = allDimScores.length > 0
      ? Math.round(allDimScores.reduce((a, b) => a + b, 0) / allDimScores.length)
      : null;

    await prisma.maarovaReport.update({
      where: { id: report.id },
      data: { overallScore, radarChartData, dimensionScores },
    });

    console.log(`  Updated report ${report.id}: overall=${overallScore}, dimensions=${JSON.stringify(dimensionScores)}`);
  }

  console.log("Done.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
