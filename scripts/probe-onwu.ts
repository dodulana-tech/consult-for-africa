import { prisma } from "../lib/prisma";

async function main() {
  const matches = await prisma.cadreProfessional.findMany({
    where: {
      OR: [
        { lastName: { contains: "Onwuasoanya", mode: "insensitive" } },
        { firstName: { contains: "Onwuasoanya", mode: "insensitive" } },
        { lastName: { contains: "Uzodimma", mode: "insensitive" } },
      ],
    },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      passwordHash: true, accountStatus: true, lastLoginAt: true,
      practiceLocation: true,
      outreachRecord: { select: { status: true, emailSentAt: true, lastContactedAt: true, updatedAt: true } },
    },
  });
  for (const m of matches) {
    console.log({
      id: m.id, name: `${m.firstName} ${m.lastName}`, email: m.email,
      pwLen: m.passwordHash?.length,
      pwIsRealClaim: m.passwordHash != null && m.passwordHash.length > 161,
      acct: m.accountStatus,
      practiceLocation: m.practiceLocation,
      lastLoginAt: m.lastLoginAt?.toISOString(),
      outreach: m.outreachRecord,
    });
  }
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
