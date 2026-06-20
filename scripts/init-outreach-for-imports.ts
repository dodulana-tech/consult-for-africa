/**
 * Create CadreOutreachRecord rows (status=PENDING) for every CadreProfessional
 * that doesn't have one yet. Mirrors the tier-assignment logic in
 * /api/cadre/admin/outreach-init so the records show up in the
 * /admin/cadrehealth/outreach pipeline.
 *
 * Run with:
 *   npx tsx scripts/init-outreach-for-imports.ts          # dry run
 *   npx tsx scripts/init-outreach-for-imports.ts --apply   # commit
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TIER_A_SPECIALTIES = [
  "Orthopaedic Surgery", "Neurosurgery", "Cardiology", "Cardiothoracic Surgery",
  "Paediatric Surgery", "Plastic Surgery", "Urology", "Nephrology",
  "Neurology", "Endocrinology", "Gastroenterology", "Haematology",
  "Infectious Disease", "Neonatology", "Oncology", "Rheumatology",
  "Oral & Maxillofacial Surgery", "Interventional Radiology",
];
const TIER_B_SPECIALTIES = [
  "Internal Medicine", "General Surgery", "Obstetrics & Gynaecology",
  "Paediatrics", "Anaesthesia", "Ophthalmology", "Radiology",
  "Psychiatry", "Pathology", "Dermatology",
];
const TIER_A_CADRES = ["DENTISTRY", "OPTOMETRY"];

function assignTier(cadre: string, subSpecialty: string | null, hasPhone: boolean): "A" | "B" | "C" {
  if (!hasPhone) return "C";
  if (subSpecialty) {
    if (TIER_A_SPECIALTIES.some((s) => subSpecialty.includes(s))) return "A";
    if (TIER_B_SPECIALTIES.some((s) => subSpecialty.includes(s))) return "B";
  }
  if (TIER_A_CADRES.includes(cadre)) return "A";
  if (subSpecialty === "General Practice / Family Medicine" || subSpecialty === "Public Health Medicine") return "C";
  return "B";
}

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(`Mode: ${apply ? "APPLY" : "DRY RUN (pass --apply to commit)"}`);

  const professionals = await prisma.cadreProfessional.findMany({
    where: {
      outreachRecord: null,
      email: { not: { contains: "@cadrehealth.system" } },
    },
    select: { id: true, cadre: true, subSpecialty: true, phone: true },
  });

  console.log(`Professionals without outreach record: ${professionals.length}`);

  const tierCounts = { A: 0, B: 0, C: 0 };
  const data = professionals.map((p) => {
    const tier = assignTier(p.cadre, p.subSpecialty, !!p.phone);
    tierCounts[tier]++;
    return { professionalId: p.id, status: "PENDING" as const, tier };
  });

  console.log("Tier breakdown:");
  console.log(`  A (high-value specialists, has phone): ${tierCounts.A}`);
  console.log(`  B (core clinical, has phone):          ${tierCounts.B}`);
  console.log(`  C (GP/Public Health or no phone):      ${tierCounts.C}`);

  if (!apply) {
    console.log("\nDRY RUN. Re-run with --apply to create the records.");
    await prisma.$disconnect();
    return;
  }

  console.log(`\nCreating ${data.length} outreach records...`);
  const BATCH = 500;
  let created = 0;
  for (let i = 0; i < data.length; i += BATCH) {
    const slice = data.slice(i, i + BATCH);
    const result = await prisma.cadreOutreachRecord.createMany({
      data: slice,
      skipDuplicates: true,
    });
    created += result.count;
    console.log(`  ... ${created} / ${data.length}`);
  }

  console.log(`\nCreated ${created} outreach records.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
