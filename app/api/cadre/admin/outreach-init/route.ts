import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Tier A: High-value specialists, scarce surgical/procedural cadres
const TIER_A_SPECIALTIES = [
  "Orthopaedic Surgery", "Neurosurgery", "Cardiology", "Cardiothoracic Surgery",
  "Paediatric Surgery", "Plastic Surgery", "Urology", "Nephrology",
  "Neurology", "Endocrinology", "Gastroenterology", "Haematology",
  "Infectious Disease", "Neonatology", "Oncology", "Rheumatology",
  "Oral & Maxillofacial Surgery", "Interventional Radiology",
];

// Tier B: Core clinical specialties, high volume
const TIER_B_SPECIALTIES = [
  "Internal Medicine", "General Surgery", "Obstetrics & Gynaecology",
  "Paediatrics", "Anaesthesia", "Ophthalmology", "Radiology",
  "Psychiatry", "Pathology", "Dermatology",
];

// Tier A cadres (non-Medicine): scarce healthcare professionals
const TIER_A_CADRES = ["DENTISTRY", "OPTOMETRY"];

function assignTier(cadre: string, subSpecialty: string | null, hasPhone: boolean): string {
  // No phone = lower priority regardless
  if (!hasPhone) return "C";

  // Check sub-specialty first (most granular)
  if (subSpecialty) {
    if (TIER_A_SPECIALTIES.some((s) => subSpecialty.includes(s))) return "A";
    if (TIER_B_SPECIALTIES.some((s) => subSpecialty.includes(s))) return "B";
  }

  // Check cadre
  if (TIER_A_CADRES.includes(cadre)) return "A";

  // General Practice and Public Health = Tier C (high volume, less surgical demand)
  if (subSpecialty === "General Practice / Family Medicine" || subSpecialty === "Public Health Medicine") return "C";

  // Default
  return "B";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { professionalIds, filter } = await req.json();

  let professionals: Array<{ id: string; cadre: string; subSpecialty: string | null; phone: string | null }> = [];

  if (Array.isArray(professionalIds) && professionalIds.length > 0) {
    professionals = await prisma.cadreProfessional.findMany({
      where: { id: { in: professionalIds } },
      select: { id: true, cadre: true, subSpecialty: true, phone: true },
    });
  } else if (filter === "all_without_outreach") {
    professionals = await prisma.cadreProfessional.findMany({
      where: {
        outreachRecord: null,
        email: { not: { contains: "@cadrehealth.system" } },
      },
      select: { id: true, cadre: true, subSpecialty: true, phone: true },
    });
  } else {
    return Response.json({ error: "Provide professionalIds or filter." }, { status: 400 });
  }

  if (professionals.length === 0) {
    return Response.json({ ok: true, created: 0, tierBreakdown: {}, message: "No eligible professionals found." });
  }

  // Check which already have outreach records
  const ids = professionals.map((p) => p.id);
  const existing = await prisma.cadreOutreachRecord.findMany({
    where: { professionalId: { in: ids } },
    select: { professionalId: true },
  });
  const existingSet = new Set(existing.map((e) => e.professionalId));
  const newProfessionals = professionals.filter((p) => !existingSet.has(p.id));

  if (newProfessionals.length === 0) {
    return Response.json({ ok: true, created: 0, tierBreakdown: {}, message: "All professionals already have outreach records." });
  }

  // Assign tiers and create records
  const tierCounts = { A: 0, B: 0, C: 0 };
  const data = newProfessionals.map((p) => {
    const tier = assignTier(p.cadre, p.subSpecialty, !!p.phone);
    tierCounts[tier as keyof typeof tierCounts]++;
    return {
      professionalId: p.id,
      status: "READY" as const,
      tier,
    };
  });

  const result = await prisma.cadreOutreachRecord.createMany({
    data,
    skipDuplicates: true,
  });

  return Response.json({
    ok: true,
    created: result.count,
    total: professionals.length,
    tierBreakdown: tierCounts,
  });
}
