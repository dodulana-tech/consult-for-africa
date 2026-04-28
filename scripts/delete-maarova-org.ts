/**
 * Delete a Maarova organisation and all associated data
 * (users, sessions, reports, module responses, item responses).
 *
 * Usage: npx tsx scripts/delete-maarova-org.ts <orgId-or-name-substring>
 * Example: npx tsx scripts/delete-maarova-org.ts "Lagoon"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: npx tsx scripts/delete-maarova-org.ts <orgId-or-name-substring>");
    process.exit(1);
  }

  const org = await prisma.maarovaOrganisation.findFirst({
    where: {
      OR: [{ id: arg }, { name: { contains: arg, mode: "insensitive" } }],
    },
    include: {
      users: {
        include: {
          sessions: { select: { id: true, status: true } },
        },
      },
    },
  });

  if (!org) {
    console.error(`No organisation found matching "${arg}"`);
    process.exit(1);
  }

  console.log(`Found organisation: ${org.name} (${org.id})`);
  console.log(`  Users: ${org.users.length}`);
  for (const u of org.users) {
    console.log(`    - ${u.firstName ?? ""} ${u.lastName ?? ""} <${u.email}> -- ${u.sessions.length} session(s)`);
  }

  // MaarovaReport.userId doesn't cascade -- delete reports explicitly first
  const userIds = org.users.map((u) => u.id);
  if (userIds.length > 0) {
    const reports = await prisma.maarovaReport.deleteMany({
      where: { userId: { in: userIds } },
    });
    console.log(`Deleted ${reports.count} reports.`);

    // Delete sessions (cascades module responses, item responses)
    const sessions = await prisma.maarovaAssessmentSession.deleteMany({
      where: { userId: { in: userIds } },
    });
    console.log(`Deleted ${sessions.count} sessions.`);

    // Now delete users
    const users = await prisma.maarovaUser.deleteMany({
      where: { id: { in: userIds } },
    });
    console.log(`Deleted ${users.count} users.`);
  }

  // Now delete the organisation
  await prisma.maarovaOrganisation.delete({ where: { id: org.id } });
  console.log(`Deleted organisation: ${org.name}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
