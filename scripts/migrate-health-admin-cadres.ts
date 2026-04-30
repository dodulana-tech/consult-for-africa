/**
 * Migrate existing HEALTH_ADMINISTRATION users to the new cadres.
 *
 * Logic:
 *   - If sub-specialty mentions records, coding, informatics -> HEALTH_RECORDS
 *   - Otherwise -> HOSPITAL_MANAGEMENT (CMD, COO, admin, finance, HR, care coordinator, etc)
 *
 * Run with: npx tsx scripts/migrate-health-admin-cadres.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RECORDS_KEYWORDS = [
  "records",
  "coding",
  "informatics",
  "documentation",
  "hrrbn",
  "health information",
];

function detectCadre(subSpecialty: string | null, currentRole: string | null): "HEALTH_RECORDS" | "HOSPITAL_MANAGEMENT" {
  const text = `${subSpecialty ?? ""} ${currentRole ?? ""}`.toLowerCase();
  if (RECORDS_KEYWORDS.some((kw) => text.includes(kw))) {
    return "HEALTH_RECORDS";
  }
  return "HOSPITAL_MANAGEMENT";
}

async function main() {
  const users = await prisma.cadreProfessional.findMany({
    where: { cadre: "HEALTH_ADMINISTRATION" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      subSpecialty: true,
      currentRole: true,
    },
  });

  console.log(`Found ${users.length} HEALTH_ADMINISTRATION users to migrate.`);
  console.log("---");

  if (users.length === 0) return;

  const summary = { HEALTH_RECORDS: 0, HOSPITAL_MANAGEMENT: 0 };

  for (const user of users) {
    const newCadre = detectCadre(user.subSpecialty, user.currentRole);
    summary[newCadre]++;

    console.log(
      `${user.firstName} ${user.lastName} (${user.email}) | sub: "${user.subSpecialty ?? "none"}" | role: "${user.currentRole ?? "none"}" -> ${newCadre}`
    );

    await prisma.cadreProfessional.update({
      where: { id: user.id },
      data: { cadre: newCadre },
    });
  }

  console.log("\n--- Migration complete ---");
  console.log(`HEALTH_RECORDS: ${summary.HEALTH_RECORDS}`);
  console.log(`HOSPITAL_MANAGEMENT: ${summary.HOSPITAL_MANAGEMENT}`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
