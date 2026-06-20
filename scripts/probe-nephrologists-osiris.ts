/**
 * Osiris Health nephrology supply probe.
 * Read-only. Run: source env then npx tsx scripts/probe-nephrologists-osiris.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NEPHRO_PATTERNS = ["nephrology", "nephrologist", "renal", "kidney", "dialysis"];

async function main() {
  const nephroLikeOr = NEPHRO_PATTERNS.map((p) => ({
    subSpecialty: { contains: p, mode: "insensitive" as const },
  }));

  const totalMedicine = await prisma.cadreProfessional.count({ where: { cadre: "MEDICINE" } });
  const medicineWithState = await prisma.cadreProfessional.count({
    where: { cadre: "MEDICINE", state: { not: null } },
  });

  const allNephro = await prisma.cadreProfessional.findMany({
    where: { cadre: "MEDICINE", OR: nephroLikeOr },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      subSpecialty: true,
      yearsOfExperience: true,
      currentRole: true,
      currentFacility: true,
      state: true,
      city: true,
      country: true,
      isDiaspora: true,
      diasporaCountry: true,
      accountStatus: true,
      availability: true,
      openTo: true,
      lastLoginAt: true,
      readinessScoreDomestic: true,
    },
    orderBy: [{ yearsOfExperience: "desc" }],
  });

  // Stratify the 51
  const inOsirisStates = allNephro.filter((p) => ["Lagos", "Oyo", "Delta"].includes(p.state ?? ""));
  const inOsirisCities = allNephro.filter((p) => {
    const city = (p.city ?? "").toLowerCase();
    return ["lagos", "ibadan", "warri"].some((c) => city.includes(c));
  });
  const noLocation = allNephro.filter((p) => !p.state && !p.city);
  const diaspora = allNephro.filter((p) => p.isDiaspora);
  const otherNgStates = allNephro.filter(
    (p) =>
      p.state &&
      !["Lagos", "Oyo", "Delta"].includes(p.state) &&
      !p.isDiaspora,
  );

  // Distinct state values among the 51
  const stateValues = new Map<string, number>();
  for (const p of allNephro) {
    const key = p.state ?? "(null)";
    stateValues.set(key, (stateValues.get(key) ?? 0) + 1);
  }

  // Dialysis nurses
  const dialysisNurses = await prisma.cadreProfessional.findMany({
    where: {
      cadre: { in: ["NURSING", "MIDWIFERY"] },
      OR: [
        { subSpecialty: { contains: "dialysis", mode: "insensitive" } },
        { subSpecialty: { contains: "renal", mode: "insensitive" } },
        { currentRole: { contains: "dialysis", mode: "insensitive" } },
      ],
    },
    select: {
      firstName: true, lastName: true, email: true,
      subSpecialty: true, currentRole: true, currentFacility: true,
      yearsOfExperience: true, state: true, city: true, isDiaspora: true,
      accountStatus: true, availability: true, lastLoginAt: true,
    },
    orderBy: [{ yearsOfExperience: "desc" }],
  });

  console.log("=== Osiris Health: nephrology supply probe ===");
  console.log(`Run date: ${new Date().toISOString()}\n`);

  console.log(`MEDICINE cadre total:           ${totalMedicine.toLocaleString()}`);
  console.log(`MEDICINE with any state set:    ${medicineWithState.toLocaleString()}  (${((medicineWithState/totalMedicine)*100).toFixed(1)}% of total)`);
  console.log(`Nephrology-tagged (national):   ${allNephro.length}`);
  console.log(`  in Osiris states (Lagos/Oyo/Delta): ${inOsirisStates.length}`);
  console.log(`  in Osiris cities (Lagos/Ibadan/Warri, loose match): ${inOsirisCities.length}`);
  console.log(`  diaspora (open to fractional / return): ${diaspora.length}`);
  console.log(`  other NG states:               ${otherNgStates.length}`);
  console.log(`  no location captured:          ${noLocation.length}`);
  console.log("");

  console.log("State distribution among the 51 nephrology-tagged:");
  for (const [k, v] of [...stateValues.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(20)} : ${v}`);
  }
  console.log("");

  console.log(`--- All ${allNephro.length} nephrology-tagged candidates ---`);
  for (const p of allNephro) {
    const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "(unnamed)";
    const yoe = p.yearsOfExperience != null ? `${p.yearsOfExperience}y` : "?";
    const loc = [p.city, p.state, p.country].filter(Boolean).join(", ") || "(no location)";
    const dia = p.isDiaspora ? ` [DIASPORA${p.diasporaCountry ? "/" + p.diasporaCountry : ""}]` : "";
    const seen = p.lastLoginAt ? p.lastLoginAt.toISOString().slice(0, 10) : "never";
    const sub = p.subSpecialty ?? "-";
    const role = p.currentRole ?? "-";
    const fac = p.currentFacility ?? "-";
    console.log(`  - ${name}${dia} | ${sub} | ${yoe} | ${loc}`);
    console.log(`      role: ${role} | facility: ${fac} | status: ${p.accountStatus} avail:${p.availability ?? "-"} last seen: ${seen}`);
    console.log(`      ${p.email}`);
  }
  console.log("");

  console.log(`--- Dialysis-tagged nurses (national, n=${dialysisNurses.length}) ---`);
  for (const n of dialysisNurses) {
    const name = `${n.firstName ?? ""} ${n.lastName ?? ""}`.trim() || "(unnamed)";
    const yoe = n.yearsOfExperience != null ? `${n.yearsOfExperience}y` : "?";
    const loc = [n.city, n.state].filter(Boolean).join(", ") || "(no location)";
    console.log(`  - ${name} | ${n.subSpecialty ?? n.currentRole ?? "-"} | ${yoe} | ${loc} | ${n.accountStatus}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
