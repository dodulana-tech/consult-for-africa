/**
 * Normalise legacy role labels in CadreSalaryReport onto the canonical
 * catalogue in lib/cadreHealth/roles.ts.
 *
 * Only unambiguous renames are in the map below. Labels that omit a grade
 * ("Pharmacist", "Radiographer", "Lab Scientist", "Physiotherapist") are
 * deliberately NOT mapped: we cannot tell a Grade I from a Grade II, and
 * guessing would invent salary-map groupings that no one reported. Same for
 * "ICU Nurse", which is a specialisation rather than a grade and belongs in
 * subSpecialty.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/normalise-cadre-salary-roles.ts           # dry run
 *   npx tsx --env-file=.env.local scripts/normalise-cadre-salary-roles.ts --apply
 */
import { PrismaClient } from "@prisma/client";
import { ROLES_BY_CADRE, ALL_ROLES } from "../lib/cadreHealth/roles";

const prisma = new PrismaClient();

/** cadre -> legacy label -> canonical label */
const RENAMES: Record<string, Record<string, string>> = {
  COMMUNITY_HEALTH: {
    CHEW: "Community Health Extension Worker (CHEW)",
    CHO: "Community Health Officer (CHO)",
  },
  DENTISTRY: {
    "Consultant (Dental)": "Dental Consultant",
  },
};

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(apply ? "Mode: APPLY" : "Mode: DRY RUN (nothing written)");

  const rows = await prisma.cadreSalaryReport.findMany({ select: { id: true, cadre: true, role: true } });
  const planned: { id: string; cadre: string; from: string; to: string }[] = [];
  for (const r of rows) {
    const to = RENAMES[r.cadre]?.[r.role];
    if (to && to !== r.role) planned.push({ id: r.id, cadre: r.cadre, from: r.role, to });
  }

  console.log(`\nRows to rename: ${planned.length}`);
  const grouped = planned.reduce<Record<string, number>>((a, p) => {
    const k = `${p.cadre}: ${p.from} -> ${p.to}`;
    a[k] = (a[k] || 0) + 1;
    return a;
  }, {});
  for (const [k, n] of Object.entries(grouped)) console.log(`  ${String(n).padStart(2)}  ${k}`);

  if (apply) {
    for (const p of planned) {
      await prisma.cadreSalaryReport.update({ where: { id: p.id }, data: { role: p.to } });
    }
    console.log(`\nRenamed ${planned.length} rows.`);
  }

  // Whatever is left that the catalogue does not contain, reported honestly.
  const after = await prisma.cadreSalaryReport.findMany({ select: { cadre: true, role: true } });
  const stillOrphan = new Map<string, number>();
  for (const r of after) {
    const list = ROLES_BY_CADRE[r.cadre] ?? ALL_ROLES;
    const applied = apply ? r.role : (RENAMES[r.cadre]?.[r.role] ?? r.role);
    if (!list.includes(applied)) {
      const k = `${r.cadre} | ${applied}`;
      stillOrphan.set(k, (stillOrphan.get(k) ?? 0) + 1);
    }
  }
  console.log(`\nStill outside the catalogue (left alone on purpose): ${[...stillOrphan.values()].reduce((a, b) => a + b, 0)} rows`);
  for (const [k, n] of [...stillOrphan].sort()) console.log(`  ${String(n).padStart(2)}  ${k}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
