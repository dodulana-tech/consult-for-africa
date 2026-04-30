/**
 * Cleanup script: remove CILTI module responses for non-clinical Maarova users.
 *
 * Background: Earlier versions of the assessment portal assigned ALL active modules
 * to every user without filtering CILTI by clinical background. Non-clinical users
 * (e.g. hospital COO, finance director) ended up with the Clinical Identity to
 * Leadership Transition Inventory which doesn't apply to them.
 *
 * This script deletes orphan CILTI responses where:
 *   - The MaarovaUser has clinicalBackground = null (not a clinician)
 *   - The response is still NOT_STARTED or IN_PROGRESS (won't touch completed work)
 *
 * Run with: npx tsx scripts/cleanup-cilti-non-clinical.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ciltiModules = await prisma.maarovaModule.findMany({
    where: { type: "CILTI" },
    select: { id: true, name: true },
  });

  if (ciltiModules.length === 0) {
    console.log("No CILTI modules in the system. Nothing to clean.");
    return;
  }

  console.log(
    `Found ${ciltiModules.length} CILTI module(s): ${ciltiModules.map((m) => m.name).join(", ")}`
  );

  const ciltiIds = ciltiModules.map((m) => m.id);

  const orphans = await prisma.maarovaModuleResponse.findMany({
    where: {
      moduleId: { in: ciltiIds },
      session: {
        user: { clinicalBackground: null },
      },
      status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
    },
    select: {
      id: true,
      status: true,
      session: {
        select: {
          user: {
            select: { name: true, email: true },
          },
        },
      },
    },
  });

  console.log(`\nOrphan CILTI responses for non-clinical users: ${orphans.length}`);
  if (orphans.length === 0) {
    console.log("Nothing to delete.");
    return;
  }

  for (const o of orphans) {
    console.log(
      ` - ${o.session.user.name} (${o.session.user.email}) | status: ${o.status}`
    );
  }

  console.log("\nDeleting...");
  const result = await prisma.maarovaModuleResponse.deleteMany({
    where: { id: { in: orphans.map((o) => o.id) } },
  });

  console.log(`Deleted ${result.count} orphan CILTI responses.`);
  console.log("\nThese users will now see their assessment without CILTI on next load.");
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
