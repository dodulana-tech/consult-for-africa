/**
 * One-off: oluwaniyifavour's 360 request was marked COMPLETE under the old
 * "all invites done" rule with only 1 rating. The new minRaters threshold is
 * 5. Revert their request to COLLECTING so reminders can still nudge them.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const subject = await prisma.maarovaUser.findFirst({
    where: { email: "oluwaniyifavour2016@gmail.com" },
    select: { id: true, email: true },
  });
  if (!subject) {
    console.log("subject not found");
    return;
  }

  const req = await prisma.maarova360Request.findFirst({
    where: { subjectId: subject.id, status: "COMPLETE" },
    include: {
      invites: { select: { role: true, status: true } },
    },
  });
  if (!req) {
    console.log("no COMPLETE request found for subject");
    return;
  }

  const nonSelfCompleted = req.invites.filter(
    (i) => i.role !== "SELF" && i.status === "COMPLETED",
  ).length;
  if (nonSelfCompleted >= req.minRaters) {
    console.log(
      `Request ${req.id} legitimately meets threshold (${nonSelfCompleted}/${req.minRaters}). Refusing to revert.`,
    );
    return;
  }

  console.log(
    `Reverting request ${req.id} for ${subject.email}: ${nonSelfCompleted}/${req.minRaters} ratings, well below threshold.`,
  );

  await prisma.maarova360Request.update({
    where: { id: req.id },
    data: { status: "COLLECTING" },
  });

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
