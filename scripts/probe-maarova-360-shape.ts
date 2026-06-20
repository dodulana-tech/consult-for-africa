/**
 * Inspect the JSON shape of one completed rater invite so we know how to
 * read it in the finalisation helper.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sample = await prisma.maarova360RaterInvite.findFirst({
    where: { status: "COMPLETED" },
    select: { id: true, role: true, responses: true },
  });
  console.log("Sample rater invite full responses payload:");
  console.log(JSON.stringify(sample, null, 2));

  // Also look at all completed invites to see if shapes vary
  const all = await prisma.maarova360RaterInvite.findMany({
    where: { status: "COMPLETED" },
    select: { id: true, role: true, responses: true },
    take: 5,
  });
  console.log(`\nFirst 5 completed invites, top-level shape:`);
  for (const inv of all) {
    const r = inv.responses as Record<string, unknown> | null;
    if (!r) {
      console.log(`  ${inv.id} role=${inv.role} responses=null`);
      continue;
    }
    const topKeys = Object.keys(r);
    const answersShape =
      r.answers && typeof r.answers === "object"
        ? Array.isArray(r.answers)
          ? `array len=${(r.answers as unknown[]).length}`
          : `object keys=${Object.keys(r.answers as Record<string, unknown>).length}`
        : typeof r.answers;
    console.log(`  ${inv.id} role=${inv.role} topKeys=[${topKeys.join(",")}] answers=${answersShape}`);
  }

  // Look at one answer entry to see field shape
  const oneSample = await prisma.maarova360RaterInvite.findFirst({
    where: { status: "COMPLETED" },
    select: { responses: true },
  });
  if (oneSample?.responses) {
    const r = oneSample.responses as Record<string, unknown>;
    const answers = r.answers;
    if (answers && typeof answers === "object") {
      if (Array.isArray(answers)) {
        console.log(`\nFirst 3 entries of answers array:`);
        for (const entry of answers.slice(0, 3)) {
          console.log(JSON.stringify(entry));
        }
      } else {
        const entries = Object.entries(answers as Record<string, unknown>);
        console.log(`\nFirst 3 entries of answers object:`);
        for (const [k, v] of entries.slice(0, 3)) {
          console.log(`  ${k} -> ${JSON.stringify(v)}`);
        }
      }
    }
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
