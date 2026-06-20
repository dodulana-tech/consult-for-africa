/**
 * Probe Maarova v1 assessment data to diagnose:
 *
 *  1. EQ silent-zero fallback rate. The EQ scorer at lib/maarova/scoring/eq.ts
 *     scores any response that arrives with `selectedIndex` but no `ratings`,
 *     `weight`, or `selectedOption` as 0 ("to avoid masking the issue"). With
 *     N=19 this could be materially distorting reported EQ.
 *
 *  2. Partial-completion rate per module. The DISC scorer uses a fixed
 *     denominator of `totalGroups ?? 24`, so partial completers get compressed.
 *
 *  3. Module-level score distribution. If most candidates land in a narrow
 *     band the instrument is not discriminating, and the report's normative
 *     language is misleading.
 *
 *  4. Per-session timing. Sessions whose median item time is <2s are likely
 *     careless responding.
 *
 * Read-only. No mutations.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AnswerShape {
  hasRatings: boolean;
  hasWeight: boolean;
  hasSelectedOption: boolean;
  hasSelectedIndex: boolean;
  hasDimension: boolean;
  hasValue: boolean;
  hasMostLeast: boolean;
  keys: string[];
}

function describeAnswer(answer: unknown): AnswerShape {
  if (!answer || typeof answer !== "object") {
    return {
      hasRatings: false,
      hasWeight: false,
      hasSelectedOption: false,
      hasSelectedIndex: false,
      hasDimension: false,
      hasValue: false,
      hasMostLeast: false,
      keys: [],
    };
  }
  const a = answer as Record<string, unknown>;
  return {
    hasRatings: a.ratings !== undefined,
    hasWeight: typeof a.weight === "number",
    hasSelectedOption: a.selectedOption !== undefined,
    hasSelectedIndex: typeof a.selectedIndex === "number",
    hasDimension: typeof a.dimension === "string",
    hasValue: typeof a.value === "number",
    hasMostLeast: typeof a.most === "string" && typeof a.least === "string",
    keys: Object.keys(a),
  };
}

function classifyEqBranch(shape: AnswerShape): string {
  if (shape.hasRatings) return "ratings (MSCEIT-style)";
  if (shape.hasWeight) return "weight (Likert)";
  if (shape.hasSelectedOption) return "selectedOption (consensus lookup)";
  if (shape.hasSelectedIndex) return "selectedIndex (SILENT-ZERO FALLBACK)";
  return "no-branch-matched (item ignored entirely)";
}

function percentiles(values: number[]): { p10: number; p25: number; p50: number; p75: number; p90: number } {
  if (values.length === 0) return { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const pick = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
  return { p10: pick(10), p25: pick(25), p50: pick(50), p75: pick(75), p90: pick(90) };
}

async function main() {
  console.log("\n=== Maarova v1 Diagnostic Probe ===\n");

  // 1. Top-line counts
  const sessionCounts = await prisma.maarovaAssessmentSession.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  console.log("Assessment sessions by status:");
  for (const row of sessionCounts) {
    console.log(`  ${row.status.padEnd(15)} ${row._count._all}`);
  }

  const completedSessions = await prisma.maarovaAssessmentSession.findMany({
    where: { status: "COMPLETED" },
    select: {
      id: true,
      userId: true,
      stream: true,
      startedAt: true,
      completedAt: true,
      totalTimeMinutes: true,
      user: { select: { email: true, organisation: { select: { name: true } } } },
      moduleResponses: {
        select: {
          id: true,
          status: true,
          timeSpentSeconds: true,
          rawScores: true,
          scaledScores: true,
          module: { select: { type: true, name: true } },
          itemResponses: {
            select: {
              questionId: true,
              answer: true,
              responseTimeMs: true,
              question: { select: { dimension: true, format: true } },
            },
          },
        },
      },
    },
  });

  console.log(`\nCompleted sessions analysed: ${completedSessions.length}\n`);

  // 2. EQ silent-zero analysis
  console.log("--- EQ Module: response-shape distribution ---");
  let eqTotalItems = 0;
  const eqBranchCounts = new Map<string, number>();
  const eqZeroBySession = new Map<string, { total: number; zero: number; sessionId: string; email: string }>();

  for (const session of completedSessions) {
    const eqMod = session.moduleResponses.find((m) => m.module.type === "EMOTIONAL_INTEL");
    if (!eqMod) continue;
    let sessionTotal = 0;
    let sessionZero = 0;
    for (const ir of eqMod.itemResponses) {
      eqTotalItems += 1;
      sessionTotal += 1;
      const shape = describeAnswer(ir.answer);
      const branch = classifyEqBranch(shape);
      eqBranchCounts.set(branch, (eqBranchCounts.get(branch) ?? 0) + 1);
      if (branch.includes("SILENT-ZERO") || branch.includes("no-branch-matched")) {
        sessionZero += 1;
      }
    }
    eqZeroBySession.set(session.id, {
      total: sessionTotal,
      zero: sessionZero,
      sessionId: session.id,
      email: session.user.email,
    });
  }

  console.log(`Total EQ item responses across sessions: ${eqTotalItems}`);
  for (const [branch, count] of [...eqBranchCounts.entries()].sort((a, b) => b[1] - a[1])) {
    const pct = ((count / Math.max(1, eqTotalItems)) * 100).toFixed(1);
    console.log(`  ${branch.padEnd(45)} ${String(count).padStart(5)}  (${pct}%)`);
  }

  console.log("\nPer-session EQ silent-zero / unscored counts:");
  for (const row of [...eqZeroBySession.values()].sort((a, b) => b.zero - a.zero)) {
    const pct = row.total > 0 ? ((row.zero / row.total) * 100).toFixed(0) : "0";
    console.log(`  ${row.email.padEnd(35)} ${row.zero}/${row.total} unscored (${pct}%)`);
  }

  // 3. Module-level partial completion
  console.log("\n--- Module-level completion (item count per session) ---");
  const moduleItemCounts = new Map<string, number[]>();
  for (const session of completedSessions) {
    for (const m of session.moduleResponses) {
      const k = m.module.type;
      const arr = moduleItemCounts.get(k) ?? [];
      arr.push(m.itemResponses.length);
      moduleItemCounts.set(k, arr);
    }
  }
  for (const [moduleType, counts] of moduleItemCounts) {
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
    console.log(`  ${moduleType.padEnd(20)} n=${counts.length}  items min=${min} max=${max} mean=${mean.toFixed(1)}`);
  }

  // 4. Score distribution per module per dimension
  console.log("\n--- Scaled score distribution by module ---");
  for (const session of completedSessions) {
    // skip
  }
  const moduleDimScores = new Map<string, Map<string, number[]>>();
  for (const session of completedSessions) {
    for (const m of session.moduleResponses) {
      if (!m.scaledScores) continue;
      const scores = m.scaledScores as Record<string, unknown>;
      const inner = moduleDimScores.get(m.module.type) ?? new Map<string, number[]>();
      for (const [k, v] of Object.entries(scores)) {
        if (typeof v === "number") {
          const arr = inner.get(k) ?? [];
          arr.push(v);
          inner.set(k, arr);
        }
      }
      moduleDimScores.set(m.module.type, inner);
    }
  }
  for (const [moduleType, dims] of moduleDimScores) {
    console.log(`  ${moduleType}:`);
    for (const [dim, values] of dims) {
      if (typeof values[0] !== "number") continue;
      const pcts = percentiles(values);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      console.log(
        `    ${dim.padEnd(22)} n=${values.length}  min=${min}  p25=${pcts.p25}  median=${pcts.p50}  p75=${pcts.p75}  max=${max}  mean=${mean.toFixed(1)}`
      );
    }
  }

  // 5. Response-time signal per session
  console.log("\n--- Per-session median item response time (careless responding check) ---");
  for (const session of completedSessions) {
    const allTimes: number[] = [];
    for (const m of session.moduleResponses) {
      for (const ir of m.itemResponses) {
        if (typeof ir.responseTimeMs === "number") {
          allTimes.push(ir.responseTimeMs);
        }
      }
    }
    if (allTimes.length === 0) {
      console.log(`  ${session.user.email.padEnd(35)} no response-time data`);
      continue;
    }
    const pcts = percentiles(allTimes);
    const median = pcts.p50;
    const flag = median < 2000 ? "  <- median <2s, careless candidate" : "";
    console.log(
      `  ${session.user.email.padEnd(35)} n=${allTimes.length} median=${median}ms p10=${pcts.p10}ms p90=${pcts.p90}ms${flag}`
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
