import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.auditSurveyResponse.findMany({
    select: { survey: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const by: Record<string, { n: number; first?: Date; last?: Date }> = {};
  for (const r of rows) {
    const k = r.survey;
    by[k] = by[k] || { n: 0 };
    by[k].n++;
    by[k].first = by[k].first ?? r.createdAt;
    by[k].last = r.createdAt;
  }
  console.log(`Total responses: ${rows.length}`);
  for (const [k, v] of Object.entries(by)) {
    console.log(`  ${k}: ${v.n}  (first ${v.first?.toISOString().slice(0,10)}, last ${v.last?.toISOString().slice(0,10)})`);
  }
  await prisma.$disconnect();
})();
