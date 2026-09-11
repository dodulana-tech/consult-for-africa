import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.auditSurveyResponse.findMany();
  const test = rows.filter((r) => (r.payload as Record<string, unknown> | null)?._test);
  if (test.length) {
    await prisma.auditSurveyResponse.deleteMany({ where: { id: { in: test.map((t) => t.id) } } });
  }
  const left = await prisma.auditSurveyResponse.count();
  console.log(`Removed ${test.length} healthcheck row(s). Real responses in table: ${left}.`);
  await prisma.$disconnect();
})();
