/**
 * Prove the Osteon survey endpoint end to end before a single link is sent.
 *
 *   npx tsx --env-file=.env.local scripts/verify-osteon-survey-endpoint.ts
 *   npx tsx --env-file=.env.local scripts/verify-osteon-survey-endpoint.ts --local
 *
 * A live page can sit in front of a dead endpoint, and a 200 can sit in front
 * of a handler that stored nothing, so this POSTs a realistic payload for each
 * of the four forms, reads the row back out of the database, asserts the
 * payload survived the round trip, and then deletes every row it created.
 *
 * Seed rows carry `__seed: true` inside the payload, which is how they are
 * found again and removed. Nothing else is touched.
 */

import { prisma } from "../lib/prisma";
import { OSTEON_SURVEYS } from "../lib/osteon-survey";

const LOCAL = process.argv.includes("--local");
const BASE = LOCAL ? "http://localhost:3000" : "https://www.consultforafrica.com";
const ENDPOINT = `${BASE}/api/osteon-audit/responses`;

/** A payload shaped like the real form, so the schema is genuinely exercised. */
function seedFor(id: string) {
  const meta = OSTEON_SURVEYS.find((s) => s.id === id)!;
  const responses: Record<string, unknown> = { __seed: true };
  meta.questions.forEach((q, i) => {
    responses[q.key] = i % 7 === 0 ? "NA" : String((i % 5) + 1);
  });
  meta.categorical.forEach((c) => {
    responses[c.key] = c.options[0];
  });
  meta.multi.forEach((m) => {
    responses[m.key] = m.options.slice(0, 2);
  });
  meta.open.forEach((o) => {
    responses[o.key] = `seed answer for ${o.key}`;
  });
  meta.splits.forEach((split) => {
    // a real constant-sum answer: the remainder lands on the first line
    const each = Math.floor(100 / split.items.length);
    split.items.forEach((it, i) => {
      responses[it.key] = String(i === 0 ? 100 - each * (split.items.length - 1) : each);
    });
  });
  meta.tensions.forEach((t, i) => {
    responses[t.key] = String((i % 5) + 1);
  });
  if (!meta.anonymous) responses.respondent = "CFA Seed Row";
  return { survey: id, respondent: meta.anonymous ? undefined : "CFA Seed Row", responses };
}

async function main() {
  console.log(`Verifying ${ENDPOINT}\n`);
  let failures = 0;

  for (const meta of OSTEON_SURVEYS) {
    const body = seedFor(meta.id);
    const before = await prisma.auditSurveyResponse.count({ where: { survey: meta.id } });

    let status = 0;
    let text = "";
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, submittedAt: new Date().toISOString() }),
      });
      status = res.status;
      text = await res.text();
    } catch (err) {
      console.log(`  FAIL  ${meta.id}: request threw ${(err as Error).message}`);
      failures++;
      continue;
    }

    if (status !== 200) {
      console.log(`  FAIL  ${meta.id}: HTTP ${status} ${text.slice(0, 120)}`);
      failures++;
      continue;
    }

    // A 200 is not evidence. The row is.
    const after = await prisma.auditSurveyResponse.findMany({
      where: { survey: meta.id },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    const row = after[0];
    const payload = (row?.payload ?? {}) as Record<string, unknown>;
    const stored = payload.__seed === true;
    const countMoved = (await prisma.auditSurveyResponse.count({ where: { survey: meta.id } })) === before + 1;
    const keysKept = Object.keys(body.responses).every((k) => k in payload);

    if (stored && countMoved && keysKept) {
      console.log(`  ok    ${meta.id}: 200, row stored, ${Object.keys(payload).length} fields intact`);
    } else {
      console.log(
        `  FAIL  ${meta.id}: 200 but stored=${stored} countMoved=${countMoved} keysKept=${keysKept}`
      );
      failures++;
    }
  }

  // Remove every seed row, whatever happened above.
  const all = await prisma.auditSurveyResponse.findMany({
    where: { survey: { in: OSTEON_SURVEYS.map((s) => s.id) } },
    select: { id: true, payload: true },
  });
  const seedIds = all
    .filter((r) => (r.payload as Record<string, unknown> | null)?.__seed === true)
    .map((r) => r.id);
  if (seedIds.length) {
    const { count } = await prisma.auditSurveyResponse.deleteMany({ where: { id: { in: seedIds } } });
    console.log(`\nCleaned up ${count} seed row${count === 1 ? "" : "s"}.`);
  }

  console.log(failures ? `\n${failures} survey(s) FAILED. Do not send any link yet.` : "\nAll four verified.");
  process.exit(failures ? 1 : 0);
}

main().finally(() => prisma.$disconnect());
