/**
 * Read-only audit of the "Consult For Africa" Maarova cohort.
 * Surfaces anyone who may not have got going: not portal-enabled, never logged
 * in, or no assessment session. (Send delivery itself isn't tracked yet.)
 *
 * Usage: npx ts-node --transpile-only scripts/audit-cfa-maarova-cohort.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.maarovaOrganisation.findFirst({
    where: { name: { contains: "consult for africa", mode: "insensitive" } },
    select: { id: true, name: true },
  });
  if (!org) return console.error("Consult For Africa org not found.");

  const users = await prisma.maarovaUser.findMany({
    where: { organisationId: org.id },
    select: {
      name: true, email: true, isPortalEnabled: true, invitedAt: true,
      lastLoginAt: true, createdAt: true,
      sessions: { select: { status: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\n${org.name}: ${users.length} Maarova users\n`);
  const flagged: string[] = [];
  for (const u of users) {
    const session = u.sessions[0]?.status ?? "—";
    const flags: string[] = [];
    if (!u.isPortalEnabled) flags.push("NOT-ENABLED");
    if (!u.invitedAt) flags.push("NEVER-INVITED");
    if (!u.lastLoginAt) flags.push("NEVER-LOGGED-IN");
    const line = `  ${u.isPortalEnabled ? "✓" : "✗"} ${(u.name + " <" + u.email + ">").padEnd(46)} login:${u.lastLoginAt ? u.lastLoginAt.toISOString().slice(0, 10) : "never"}  assess:${session}  ${flags.join(",")}`;
    console.log(line);
    if (flags.length) flagged.push(`${u.name} <${u.email}> — ${flags.join(", ")}`);
  }

  const neverLoggedIn = users.filter((u) => !u.lastLoginAt).length;
  const noSession = users.filter((u) => u.sessions.length === 0).length;
  const completed = users.filter((u) => u.sessions[0]?.status === "COMPLETED").length;
  console.log(`\nSummary: ${users.length} total | ${neverLoggedIn} never logged in | ${noSession} no assessment session | ${completed} completed`);
  if (flagged.length) {
    console.log(`\nNeeds attention (${flagged.length}):`);
    flagged.forEach((f) => console.log("  - " + f));
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
