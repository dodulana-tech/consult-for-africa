/**
 * Real orphan claim detector. Distinguishes import-placeholder hashes
 * (161 chars from scripts/import-doctors-excel.ts:194 — 16-byte salt)
 * from real claim attempts (193 chars from app/api/cadre/claim/route.ts:8 —
 * 32-byte salt).
 */
import { prisma } from "../lib/prisma";

async function main() {
  // Use raw SQL to filter on passwordHash length since Prisma can't.
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    passwordHashLength: number;
    accountStatus: string;
    practiceLocation: string | null;
    practiceLocationSetAt: Date | null;
    lastLoginAt: Date | null;
    outreachStatus: string | null;
    outreachUpdatedAt: Date | null;
  }>>`
    SELECT
      p.id, p.email, p."firstName", p."lastName",
      LENGTH(p."passwordHash") as "passwordHashLength",
      p."accountStatus"::text as "accountStatus",
      p."practiceLocation"::text as "practiceLocation",
      p."practiceLocationSetAt",
      p."lastLoginAt",
      o.status::text as "outreachStatus",
      o."updatedAt" as "outreachUpdatedAt"
    FROM "CadreProfessional" p
    LEFT JOIN "CadreOutreachRecord" o ON o."professionalId" = p.id
    WHERE LENGTH(p."passwordHash") > 161
    ORDER BY o."updatedAt" DESC NULLS LAST
  `;

  console.log(`Real claim attempts (passwordHash length > 161): ${rows.length}\n`);
  for (const r of rows) {
    console.log(
      `[${r.id}] ${r.firstName} ${r.lastName} <${r.email}>  ` +
        `pwLen=${r.passwordHashLength}  ` +
        `acct=${r.accountStatus}  ` +
        `loc=${r.practiceLocation ?? "—"}  ` +
        `outreach=${r.outreachStatus ?? "—"}  ` +
        `lastLogin=${r.lastLoginAt?.toISOString() ?? "never"}  ` +
        `outreachUpdated=${r.outreachUpdatedAt?.toISOString() ?? "—"}`,
    );
  }

  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
