/**
 * Probe the Maarova 360 funnel: where does it break down?
 *
 * Counts at each stage:
 *   - Maarova360Request rows by status
 *   - Per request: invites sent, invites accepted, responses completed
 *   - Module-level: does any session have a THREE_SIXTY module response with
 *     itemResponses > 0?
 *   - Time-to-first-response and overall conversion
 *
 * Read-only.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("\n=== Maarova 360 Funnel Probe ===\n");

  // 1. Requests by status
  const reqByStatus = await prisma.maarova360Request.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const totalRequests = reqByStatus.reduce((sum, r) => sum + r._count._all, 0);
  console.log(`Total 360 requests: ${totalRequests}`);
  for (const r of reqByStatus) {
    console.log(`  ${r.status.padEnd(20)} ${r._count._all}`);
  }

  // 2. Invites by status
  const inviteByStatus = await prisma.maarova360RaterInvite.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const totalInvites = inviteByStatus.reduce((sum, r) => sum + r._count._all, 0);
  console.log(`\nTotal rater invites: ${totalInvites}`);
  for (const r of inviteByStatus) {
    console.log(`  ${r.status.padEnd(20)} ${r._count._all}`);
  }

  // 3. Per request: how many invites + completions
  const requests = await prisma.maarova360Request.findMany({
    select: {
      id: true,
      status: true,
      minRaters: true,
      deadline: true,
      createdAt: true,
      subject: { select: { email: true, name: true } },
      invites: {
        select: {
          status: true,
          completedAt: true,
          role: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\nPer-request breakdown (${requests.length} requests):`);
  for (const req of requests) {
    const inviteCount = req.invites.length;
    const completed = req.invites.filter((i) => i.status === "COMPLETED" || i.completedAt).length;
    const ageDays = Math.floor((Date.now() - req.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const deadlinePassed = req.deadline < new Date();
    const flag = inviteCount === 0 ? "NO_INVITES_SENT" : completed === 0 ? "ZERO_RESPONSES" : "";
    console.log(
      `  ${req.subject.email.padEnd(35)} status=${req.status.padEnd(12)} invites=${inviteCount} completed=${completed}/${req.minRaters} age=${ageDays}d deadlinePassed=${deadlinePassed} ${flag}`
    );
  }

  // 4. Module-level THREE_SIXTY status across sessions
  const threeSixtyModules = await prisma.maarovaModuleResponse.findMany({
    where: { module: { type: "THREE_SIXTY" } },
    select: {
      id: true,
      status: true,
      sessionId: true,
      timeSpentSeconds: true,
      rawScores: true,
      scaledScores: true,
      session: { select: { user: { select: { email: true } } } },
      _count: { select: { itemResponses: true } },
    },
  });
  console.log(`\nTHREE_SIXTY module-response rows: ${threeSixtyModules.length}`);
  const tsStatuses = new Map<string, number>();
  for (const m of threeSixtyModules) {
    tsStatuses.set(m.status, (tsStatuses.get(m.status) ?? 0) + 1);
  }
  for (const [status, count] of tsStatuses) {
    console.log(`  status=${status.padEnd(15)} ${count}`);
  }
  const withItems = threeSixtyModules.filter((m) => m._count.itemResponses > 0).length;
  const withRawScores = threeSixtyModules.filter((m) => m.rawScores).length;
  const withScaledScores = threeSixtyModules.filter((m) => m.scaledScores).length;
  console.log(`  with itemResponses > 0: ${withItems}`);
  console.log(`  with rawScores not null: ${withRawScores}`);
  console.log(`  with scaledScores not null: ${withScaledScores}`);

  // 5. How many subjects ever even created a Maarova360Request?
  const completedSessionUserIds = await prisma.maarovaAssessmentSession.findMany({
    where: { status: "COMPLETED" },
    select: { userId: true },
  });
  const distinctCompletedUsers = new Set(completedSessionUserIds.map((s) => s.userId));
  const usersWith360Req = await prisma.maarova360Request.findMany({
    where: { subjectId: { in: [...distinctCompletedUsers] } },
    select: { subjectId: true },
  });
  const distinct360Subjects = new Set(usersWith360Req.map((r) => r.subjectId));
  console.log(
    `\nFunnel: ${distinctCompletedUsers.size} users with COMPLETED sessions, ${distinct360Subjects.size} have a 360 request started`
  );

  // 6. Sample one rater invite to see what it stores
  const sampleInvite = await prisma.maarova360RaterInvite.findFirst({
    where: { responses: { not: { equals: null as any } } },
    select: { id: true, status: true, completedAt: true, role: true, responses: true },
  });
  if (sampleInvite) {
    console.log(`\nSample rater invite with responses:`);
    console.log(`  id=${sampleInvite.id} status=${sampleInvite.status} role=${sampleInvite.role}`);
    const responses = sampleInvite.responses as unknown;
    if (responses && typeof responses === "object") {
      const keys = Object.keys(responses as Record<string, unknown>);
      console.log(`  response keys (first 10): ${keys.slice(0, 10).join(", ")}`);
      console.log(`  response key count: ${keys.length}`);
    }
  } else {
    console.log(`\nNo rater invite has responses stored.`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
