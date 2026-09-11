/**
 * Compute the Haven diagnostic-audit survey analysis from live responses.
 *
 * Reads AuditSurveyResponse rows for both Haven surveys, computes per-item
 * means / distributions / N-A counts, categorical tallies and open-text
 * answers, and writes a single analysis JSON consumed by
 * scripts/build-haven-survey-results.py.
 *
 * Run:
 *   npx tsx --env-file=.env.local scripts/compute-haven-surveys.ts [out.json]
 */
import { writeFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { HAVEN_SURVEYS } from "../lib/haven-survey";

const prisma = new PrismaClient();

const OUT = process.argv[2] ?? "haven-analysis.json";

type Row = { payload: Record<string, unknown>; createdAt: Date };

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

(async () => {
  const surveys = [];

  for (const meta of HAVEN_SURVEYS) {
    const rows = (await prisma.auditSurveyResponse.findMany({
      where: { survey: meta.id },
      select: { payload: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    })) as unknown as Row[];

    const scale = meta.questions.map((q) => {
      const dist: Record<string, number> = {};
      const scored: number[] = [];
      for (const r of rows) {
        const raw = r.payload?.[q.key];
        if (raw === undefined || raw === null || raw === "") continue;
        const v = String(raw);
        dist[v] = (dist[v] ?? 0) + 1;
        const n = Number(v);
        if (Number.isFinite(n) && n >= 1 && n <= meta.scaleMax) scored.push(n);
      }
      return {
        key: q.key,
        text: q.text,
        section: q.section,
        reverse: !!q.reverse,
        n: scored.length,
        mean: mean(scored),
        dist,
      };
    });

    const categorical = meta.categorical.map((c) => {
      const counts: Record<string, number> = {};
      let answered = 0;
      for (const r of rows) {
        const v = r.payload?.[c.key];
        if (v === undefined || v === null || v === "") continue;
        counts[String(v)] = (counts[String(v)] ?? 0) + 1;
        answered++;
      }
      return { key: c.key, label: c.label, options: c.options, counts, answered };
    });

    const openText = meta.openText.map((o) => ({
      key: o.key,
      label: o.label,
      answers: rows
        .map((r) => (r.payload?.[o.key] ? String(r.payload[o.key]).trim() : ""))
        .filter((s) => s.length > 1),
    }));

    const positives = scale.filter((s) => !s.reverse && s.mean !== null).map((s) => s.mean as number);
    const reverses = scale.filter((s) => s.reverse && s.mean !== null).map((s) => s.mean as number);

    surveys.push({
      id: meta.id,
      title: meta.title,
      audience: meta.audience,
      scaleMax: meta.scaleMax,
      count: rows.length,
      earliest: rows.length ? rows[0].createdAt.toISOString() : null,
      latest: rows.length ? rows[rows.length - 1].createdAt.toISOString() : null,
      positiveAvg: mean(positives),
      reverseAvg: mean(reverses),
      scale,
      categorical,
      openText,
    });
  }

  const out = { generatedAt: new Date().toISOString(), surveys };
  writeFileSync(OUT, JSON.stringify(out, null, 2));

  for (const s of surveys) {
    console.log(
      `${s.id}: n=${s.count}  positiveAvg=${s.positiveAvg?.toFixed(2)}  reverseAvg=${s.reverseAvg?.toFixed(2)}`,
    );
  }
  console.log(`wrote ${OUT}`);
  await prisma.$disconnect();
})();
