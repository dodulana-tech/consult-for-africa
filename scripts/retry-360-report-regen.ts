/**
 * Retry report regeneration for specific 360 subjects whose first attempt
 * failed with a JSON parse error from Claude. Stochastic; usually succeeds
 * on retry.
 */
import { PrismaClient } from "@prisma/client";
import { generateMaarovaReport } from "../lib/maarova/generateReport";

const prisma = new PrismaClient();

const EMAILS = ["elizabethndikata@gmail.com", "adewoyedayo@gmail.com"];

async function main() {
  for (const email of EMAILS) {
    const user = await prisma.maarovaUser.findFirst({
      where: { email },
      select: {
        id: true,
        sessions: {
          where: { status: "COMPLETED" },
          orderBy: { completedAt: "desc" },
          take: 1,
          select: { id: true },
        },
      },
    });
    if (!user || user.sessions.length === 0) {
      console.log(`SKIP ${email}: no completed session`);
      continue;
    }
    const sessionId = user.sessions[0].id;
    console.log(`Regenerating for ${email} session=${sessionId}...`);
    const result = await generateMaarovaReport(sessionId, { force: true });
    if (result.ok) {
      console.log(`  OK   reportId=${result.reportId}`);
    } else {
      console.log(`  FAIL ${result.error}`);
    }
  }
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
