import { prisma } from "../lib/prisma";

async function main() {
  // Pull 5 of the "orphan" records and look at the passwordHash format
  const ids = [
    "cmnn7cp0w006tb7zpok0f2cmz", // Dr Nasiru Muhammad (claimed support email today)
    "cmnn73xgv0029b7zpxoy1buoo", // Dr Oluwasiji
    "cmnn6z6qf0000b7zpcxkujeqt", // Dr Patric Temi Adegun
  ];
  const rows = await prisma.cadreProfessional.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      passwordHash: true,
      lastLoginAt: true,
      accountStatus: true,
      practiceLocation: true,
      practiceLocationSetAt: true,
      outreachRecord: { select: { status: true, updatedAt: true } },
    },
  });

  for (const r of rows) {
    console.log({
      id: r.id,
      name: `${r.firstName} ${r.lastName}`,
      email: r.email,
      passwordHashLength: r.passwordHash?.length,
      passwordHashPrefix: r.passwordHash?.slice(0, 20) + "...",
      passwordHashLooksReal: !!r.passwordHash && r.passwordHash.includes(":") && r.passwordHash.length > 100,
      accountStatus: r.accountStatus,
      practiceLocation: r.practiceLocation,
      practiceLocationSetAt: r.practiceLocationSetAt?.toISOString(),
      lastLoginAt: r.lastLoginAt?.toISOString(),
      outreachStatus: r.outreachRecord?.status,
      outreachUpdated: r.outreachRecord?.updatedAt?.toISOString(),
    });
  }

  // Sanity: total counts
  const [withPw, withoutPw, total] = await Promise.all([
    prisma.cadreProfessional.count({ where: { passwordHash: { not: null } } }),
    prisma.cadreProfessional.count({ where: { passwordHash: null } }),
    prisma.cadreProfessional.count(),
  ]);
  console.log({ total, withPasswordHash: withPw, withoutPasswordHash: withoutPw });

  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
