/**
 * Pulls the cohort of CadreHealth professionals whose claim attempts wrote
 * to the database before the JWT throw, leaving them with a saved password
 * but unable to log in until CADRE_PORTAL_SECRET was set.
 *
 * These are people whose CadreOutreachRecord status is CONVERTED but who
 * may not realise their account is functional. They need a personalised
 * recovery email.
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx tsx scripts/list-recovery-cohort.ts
 *
 * Output: a CSV to stdout with columns: id, firstName, lastName, email,
 * cadre, claimedAt. Pipe to a file:
 *   ... > recovery-cohort.csv
 *
 * Then use the CSV with your mail merge of choice (Gmail mail merge,
 * Postmark transactional templates, or paste each address into Compose
 * Email one by one).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find all CadreProfessional records whose outreach record was flipped
  // to CONVERTED. These are the users who clicked the email link, set a
  // password, and may have hit the JWT 500.
  const records = await prisma.cadreOutreachRecord.findMany({
    where: { status: "CONVERTED", profileClaimedAt: { not: null } },
    orderBy: { profileClaimedAt: "asc" },
    select: {
      profileClaimedAt: true,
      professional: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          cadre: true,
          emailVerified: true,
        },
      },
    },
  });

  // CSV header
  console.log("id,firstName,lastName,email,cadre,emailVerified,claimedAt");

  for (const r of records) {
    const p = r.professional;
    const claimedAt = r.profileClaimedAt
      ? r.profileClaimedAt.toISOString().slice(0, 10)
      : "";
    // Quote any field that contains a comma. Names/emails almost never do
    // but we should still be safe.
    const row = [
      p.id,
      p.firstName,
      p.lastName,
      p.email,
      p.cadre,
      p.emailVerified ? "yes" : "no",
      claimedAt,
    ]
      .map((v) => (v.includes(",") ? `"${v.replace(/"/g, '""')}"` : v))
      .join(",");
    console.log(row);
  }

  console.error(`\n${records.length} CONVERTED professionals listed.`);
}

main()
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
