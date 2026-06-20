/**
 * Diagnostic: why didn't Dr Chisom get her Maarova link? (broadened)
 * Read-only.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Fuzzy variants of "Chisom"
  for (const q of ["chiso", "chizo", "chison", "chisom"]) {
    const u = await prisma.maarovaUser.findMany({
      where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] },
      select: { name: true, email: true, invitedAt: true, isPortalEnabled: true },
    });
    const t = await prisma.outreachTarget.findMany({
      where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] },
      select: { name: true, email: true, status: true, invitedAt: true },
    });
    if (u.length || t.length) console.log(`"${q}" -> users:`, u, "targets:", t);
    else console.log(`"${q}" -> no matches`);
  }

  const recentUsers = await prisma.maarovaUser.findMany({
    orderBy: { createdAt: "desc" }, take: 15,
    select: { name: true, email: true, invitedAt: true, isPortalEnabled: true, createdAt: true },
  });
  console.log(`\n=== 15 most recent MaarovaUser invites ===`);
  for (const u of recentUsers) console.log(`  ${u.createdAt.toISOString().slice(0, 10)}  enabled=${u.isPortalEnabled}  ${u.name} <${u.email}>`);

  const recentTargets = await prisma.outreachTarget.findMany({
    orderBy: { createdAt: "desc" }, take: 15,
    select: { name: true, email: true, status: true, invitedAt: true, createdAt: true },
  });
  console.log(`\n=== 15 most recent OutreachTarget rows ===`);
  for (const t of recentTargets) console.log(`  ${t.createdAt.toISOString().slice(0, 10)}  ${t.status}  ${t.name} <${t.email ?? "no-email"}>`);

  const totalUsers = await prisma.maarovaUser.count();
  const totalTargets = await prisma.outreachTarget.count();
  console.log(`\nTotals: MaarovaUser=${totalUsers}, OutreachTarget=${totalTargets}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
