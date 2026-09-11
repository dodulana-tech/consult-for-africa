import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const client = await prisma.client.findFirst({ where: { name: "Haven Paediatric Centre" } });
  if (!client) throw new Error("no client");
  const engs = await prisma.engagement.findMany({ where: { clientId: client.id }, select: { id: true, status: true } });
  for (const e of engs) {
    await prisma.engagement.update({ where: { id: e.id }, data: { status: "ACTIVE" } });
    console.log(`Engagement ${e.id}: ${e.status} -> ACTIVE`);
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
