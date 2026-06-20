import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const id = "cmnn7cp0w006tb7zpok0f2cmz";
  const pro = await prisma.cadreProfessional.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      passwordHash: true,
      accountStatus: true,
      emailVerified: true,
      practiceLocation: true,
      practiceLocationSetAt: true,
      createdAt: true,
      outreachRecord: {
        select: {
          status: true,
          emailSentAt: true,
          convertedAt: true,
          profileClaimedAt: true,
          contactAttempts: true,
          lastContactedAt: true,
          notes: true,
        },
      },
    },
  });

  console.log(JSON.stringify({
    found: !!pro,
    id: pro?.id,
    email: pro?.email,
    name: pro ? `${pro.firstName} ${pro.lastName}` : null,
    hasPassword: !!pro?.passwordHash,
    accountStatus: pro?.accountStatus,
    emailVerified: pro?.emailVerified,
    practiceLocation: pro?.practiceLocation,
    practiceLocationSetAt: pro?.practiceLocationSetAt?.toISOString(),
    createdAt: pro?.createdAt?.toISOString(),
    outreach: pro?.outreachRecord ? {
      status: pro.outreachRecord.status,
      emailSentAt: pro.outreachRecord.emailSentAt?.toISOString(),
      convertedAt: pro.outreachRecord.convertedAt?.toISOString(),
      profileClaimedAt: pro.outreachRecord.profileClaimedAt?.toISOString(),
      contactAttempts: pro.outreachRecord.contactAttempts,
      notes: pro.outreachRecord.notes,
    } : null,
  }, null, 2));

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
