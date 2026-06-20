/**
 * Seed Pearl Oncology + Osiris Health facility records and active job postings.
 *
 * Idempotent: facilities are upserted by slug; mandates are skipped if a row
 * with the same (title, facilityId, status=OPEN) already exists.
 *
 * Source material:
 *   - Pearl Oncology: their public hiring graphic for Medical Officers in
 *     Lekki Phase 1 at NGN 400k+/month.
 *   - Osiris Health: their LinkedIn hiring post covering Operations Manager,
 *     Consultant Nephrologist (multi-city), Medical Officers (Ibadan/Warri),
 *     Dialysis Nurses (Ibadan/Warri).
 *
 * Run:
 *   source /tmp/cfa-prod.env
 *   npx tsx scripts/seed-pearl-osiris-jobs.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---------- slug helper -----------------------------------------------------

function slugify(text: string, suffix?: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return suffix ? `${base}-${suffix}` : base;
}

// ---------- facility definitions --------------------------------------------

const FACILITIES = [
  {
    slug: "pearl-oncology",
    name: "Pearl Oncology Specialist Hospital",
    type: "PRIVATE_TERTIARY" as const,
    state: "Lagos",
    city: "Lagos",
    address: "24 Furo Ezimora Street, Marwa, Lekki Phase 1, Lagos",
    yearEstablished: 2023,
    description:
      "Pearl Oncology Specialist Hospital is a private specialist cancer hospital in Lekki Phase 1, Lagos, founded by Dr Omolola Salako. Officially launched in December 2023 and now operating across four cancer centres, Pearl has treated over 400 unique cancer patients with a comprehensive range of services including chemotherapy, immunotherapy, hormonal therapy, oncology surgery, nutrition counselling, pain management, psychological care, and rehabilitation. Pearl is hiring through Consult For Africa's CadreHealth recruitment service.",
  },
  {
    slug: "osiris-health",
    name: "Osiris Health",
    type: "PRIVATE_SECONDARY" as const,
    state: "Lagos",
    city: "Lagos",
    address: "Lagos, with operating sites in Ibadan and Warri",
    yearEstablished: 1986,
    description:
      "Osiris Health is a multi-site renal-care operator and manager of Life Support Medical Centre, one of Nigeria's earliest dialysis providers (established 1986). Following a recent strategic collaboration with R-Jolad Hospital at Gbagada Lagos, Osiris is actively expanding renal care access across Lagos, Ibadan, and Warri. The organisation is hiring across operations, nephrology, medical officer, and dialysis nursing cadres through Consult For Africa's CadreHealth recruitment service.",
  },
];

// ---------- mandate definitions ---------------------------------------------

type Cadre =
  | "MEDICINE"
  | "NURSING"
  | "MIDWIFERY"
  | "PHARMACY"
  | "HOSPITAL_MANAGEMENT";

type MandateType =
  | "PERMANENT"
  | "LOCUM"
  | "CONTRACT"
  | "CONSULTING"
  | "INTERNATIONAL";

interface MandateDef {
  facilitySlug: string;
  title: string;
  cadre: Cadre;
  type: MandateType;
  subSpecialty?: string;
  description: string;
  locationState: string;
  locationCity: string;
  salaryMin?: number;
  salaryMax?: number;
  minYearsExperience?: number;
  urgency: "MEDIUM" | "HIGH" | "URGENT";
  requiredQualifications: string[];
  preferredQualifications: string[];
  isRelocationRequired?: boolean;
}

const MANDATES: MandateDef[] = [
  // -------- Pearl Oncology --------
  {
    facilitySlug: "pearl-oncology",
    title: "Medical Officer (Oncology)",
    cadre: "MEDICINE",
    type: "PERMANENT",
    subSpecialty: "Oncology",
    description: `Pearl Oncology Specialist Hospital is hiring Medical Officers to support a growing oncology service in Lekki Phase 1, Lagos. You will work alongside consultant oncologists and a multidisciplinary team delivering chemotherapy, immunotherapy, hormonal therapy, and post-surgical oncology care.

This is a full-time on-site role in a structured clinical environment, with clear growth pathways and a collaborative specialist team. Competitive remuneration starts from NGN 400,000 per month.

We are looking for a clinically sharp, patient-focused doctor with strong judgement and an interest in building a long-term oncology career. Oncology rotation experience is a plus, not a requirement.

Application is managed by Consult For Africa on behalf of Pearl Oncology.`,
    locationState: "Lagos",
    locationCity: "Lagos",
    salaryMin: 400_000,
    salaryMax: 550_000,
    minYearsExperience: 2,
    urgency: "HIGH",
    requiredQualifications: [
      "MBBS or equivalent with a valid Medical and Dental Council of Nigeria (MDCN) licence",
      "Minimum 2 years post-NYSC clinical experience",
      "Strong clinical judgement and patient focus",
      "Proficiency with electronic medical records",
    ],
    preferredQualifications: [
      "Oncology rotation or fellowship exposure",
      "Experience in a specialist or tertiary hospital setting",
      "BLS / ACLS current",
      "Interest in building a long-term oncology career",
    ],
  },

  // -------- Osiris Health --------
  {
    facilitySlug: "osiris-health",
    title: "Operations Manager (Healthcare)",
    cadre: "HOSPITAL_MANAGEMENT",
    type: "PERMANENT",
    description: `Osiris Health is hiring an Operations Manager based in Lagos to lead day-to-day operations across an expanding network of renal-care sites in Lagos, Ibadan, and Warri.

You will own service delivery standards, staff coordination, supply chain, and operational performance across multiple sites. You will partner closely with the CEO and clinical leadership on growth, partnerships (including the recent R-Jolad collaboration), and continuous improvement.

This is a senior, hands-on role for an experienced healthcare operator with multi-site exposure and a track record of building service standards in a clinical environment.

Application is managed by Consult For Africa on behalf of Osiris Health.`,
    locationState: "Lagos",
    locationCity: "Lagos",
    salaryMin: 600_000,
    salaryMax: 1_200_000,
    minYearsExperience: 5,
    urgency: "HIGH",
    requiredQualifications: [
      "Bachelor's degree in Healthcare Management, Business Administration, or a clinical discipline",
      "5+ years operational leadership experience in a hospital, clinic group, or healthcare service organisation",
      "Multi-site or multi-department coordination experience",
      "Strong financial literacy: P&L, supply chain, workforce planning",
    ],
    preferredQualifications: [
      "MBA or MHA postgraduate qualification",
      "Direct experience in renal care, dialysis, or chronic disease services",
      "Track record of standing up new sites or service lines",
      "Comfort working directly with a founder-CEO",
    ],
  },
  {
    facilitySlug: "osiris-health",
    title: "Consultant Nephrologist (Lagos, Ibadan, or Warri)",
    cadre: "MEDICINE",
    type: "PERMANENT",
    subSpecialty: "Nephrology",
    description: `Osiris Health is hiring a Consultant Nephrologist to anchor clinical leadership across our expanding network of renal-care sites. The role can be based primarily in Lagos, Ibadan, or Warri based on your preference, with occasional travel between sites.

You will lead clinical governance for dialysis services, supervise medical officers and dialysis nurses, manage complex cases, and support the development of new service lines including the recently launched R-Jolad collaboration at Gbagada.

Fractional, part-time, and visiting-consultant arrangements will be considered for the right senior candidate.

Application is managed by Consult For Africa on behalf of Osiris Health.`,
    locationState: "Lagos",
    locationCity: "Lagos",
    salaryMin: 1_200_000,
    salaryMax: 2_500_000,
    minYearsExperience: 8,
    urgency: "HIGH",
    requiredQualifications: [
      "MBBS with full MDCN registration",
      "Fellowship in Internal Medicine with Nephrology subspecialty (FMCP, FWACP, or equivalent)",
      "Minimum 3 years post-fellowship consultant experience",
      "Strong clinical governance and team leadership track record",
    ],
    preferredQualifications: [
      "Established practice in private dialysis or renal care",
      "Interest in multi-site service development",
      "Diaspora or returnee consultants welcome (fractional return arrangements considered)",
      "Research, teaching, or fellowship-training experience",
    ],
    isRelocationRequired: false,
  },
  {
    facilitySlug: "osiris-health",
    title: "Medical Officer (Dialysis) - Ibadan",
    cadre: "MEDICINE",
    type: "PERMANENT",
    subSpecialty: "Nephrology / Dialysis",
    description: `Osiris Health is hiring a Medical Officer for our Ibadan dialysis site. You will support the consultant nephrologist team and run day-to-day care for dialysis patients, including pre-session assessment, intra-session monitoring, complication management, and patient education.

This is a structured clinical role in an established renal-care environment, with a clear training pathway and exposure to a high volume of complex renal cases.

Application is managed by Consult For Africa on behalf of Osiris Health.`,
    locationState: "Oyo",
    locationCity: "Ibadan",
    salaryMin: 350_000,
    salaryMax: 550_000,
    minYearsExperience: 2,
    urgency: "HIGH",
    requiredQualifications: [
      "MBBS or equivalent with a valid MDCN licence",
      "Minimum 2 years post-NYSC clinical experience",
      "BLS / ACLS current",
      "Comfort with shift-based dialysis service hours",
    ],
    preferredQualifications: [
      "Rotation or exposure in renal medicine, ICU, or internal medicine",
      "Existing residence in Ibadan or willingness to relocate",
      "Interest in building a long-term career in renal care",
    ],
  },
  {
    facilitySlug: "osiris-health",
    title: "Medical Officer (Dialysis) - Warri",
    cadre: "MEDICINE",
    type: "PERMANENT",
    subSpecialty: "Nephrology / Dialysis",
    description: `Osiris Health is hiring a Medical Officer for our Warri dialysis site. You will support the consultant nephrologist team and run day-to-day care for dialysis patients, including pre-session assessment, intra-session monitoring, complication management, and patient education.

This is a structured clinical role in an established renal-care environment, with a clear training pathway and exposure to a high volume of complex renal cases.

Application is managed by Consult For Africa on behalf of Osiris Health.`,
    locationState: "Delta",
    locationCity: "Warri",
    salaryMin: 350_000,
    salaryMax: 550_000,
    minYearsExperience: 2,
    urgency: "HIGH",
    requiredQualifications: [
      "MBBS or equivalent with a valid MDCN licence",
      "Minimum 2 years post-NYSC clinical experience",
      "BLS / ACLS current",
      "Comfort with shift-based dialysis service hours",
    ],
    preferredQualifications: [
      "Rotation or exposure in renal medicine, ICU, or internal medicine",
      "Existing residence in Warri or the South-South or willingness to relocate",
      "Interest in building a long-term career in renal care",
    ],
  },
  {
    facilitySlug: "osiris-health",
    title: "Dialysis Nurse - Ibadan",
    cadre: "NURSING",
    type: "PERMANENT",
    subSpecialty: "Dialysis / Renal Nursing",
    description: `Osiris Health is hiring Dialysis Nurses for our Ibadan site. You will manage end-to-end care for dialysis patients across pre-session assessment, machine setup, intra-session monitoring, complication response, and post-session handover.

This is a high-acuity nursing role in an established renal-care service with structured training, multidisciplinary support, and a clear path to senior dialysis nurse and clinical nurse educator pathways.

Application is managed by Consult For Africa on behalf of Osiris Health.`,
    locationState: "Oyo",
    locationCity: "Ibadan",
    salaryMin: 220_000,
    salaryMax: 380_000,
    minYearsExperience: 2,
    urgency: "HIGH",
    requiredQualifications: [
      "Registered Nurse (RN) with valid NMCN licence",
      "Minimum 2 years clinical nursing experience",
      "Dialysis or renal-nursing training (formal or in-service)",
      "BLS current",
    ],
    preferredQualifications: [
      "Post-basic certification in renal or dialysis nursing",
      "Existing residence in Ibadan",
      "Experience in a high-volume private dialysis centre",
      "Mentorship interest for junior dialysis nurses",
    ],
  },
  {
    facilitySlug: "osiris-health",
    title: "Dialysis Nurse - Warri",
    cadre: "NURSING",
    type: "PERMANENT",
    subSpecialty: "Dialysis / Renal Nursing",
    description: `Osiris Health is hiring Dialysis Nurses for our Warri site. You will manage end-to-end care for dialysis patients across pre-session assessment, machine setup, intra-session monitoring, complication response, and post-session handover.

This is a high-acuity nursing role in an established renal-care service with structured training, multidisciplinary support, and a clear path to senior dialysis nurse and clinical nurse educator pathways.

Application is managed by Consult For Africa on behalf of Osiris Health.`,
    locationState: "Delta",
    locationCity: "Warri",
    salaryMin: 220_000,
    salaryMax: 380_000,
    minYearsExperience: 2,
    urgency: "HIGH",
    requiredQualifications: [
      "Registered Nurse (RN) with valid NMCN licence",
      "Minimum 2 years clinical nursing experience",
      "Dialysis or renal-nursing training (formal or in-service)",
      "BLS current",
    ],
    preferredQualifications: [
      "Post-basic certification in renal or dialysis nursing",
      "Existing residence in Warri or the South-South",
      "Experience in a high-volume private dialysis centre",
      "Mentorship interest for junior dialysis nurses",
    ],
  },
];

// ---------- main ------------------------------------------------------------

async function main() {
  console.log("Seeding Pearl Oncology + Osiris Health facilities and mandates\n");

  // Step 1: facilities
  const facilityIdBySlug = new Map<string, string>();
  for (const f of FACILITIES) {
    let row = await prisma.cadreFacility.findFirst({ where: { slug: f.slug } });
    if (!row) {
      row = await prisma.cadreFacility.create({
        data: {
          name: f.name,
          slug: f.slug,
          type: f.type,
          state: f.state,
          city: f.city,
          address: f.address,
          yearEstablished: f.yearEstablished,
          description: f.description,
          isVerified: true,
        },
      });
      console.log(`  facility created: ${f.name}  ->  /oncadre/hospitals/${row.slug}`);
    } else {
      console.log(`  facility exists:  ${f.name}  (${row.id})`);
    }
    facilityIdBySlug.set(f.slug, row.id);
  }

  // Step 2: mandates
  const created: { title: string; slug: string }[] = [];
  for (const m of MANDATES) {
    const facilityId = facilityIdBySlug.get(m.facilitySlug);
    if (!facilityId) {
      console.error(`  MISSING facility for slug ${m.facilitySlug}; skipping ${m.title}`);
      continue;
    }
    const existing = await prisma.cadreMandate.findFirst({
      where: { title: m.title, facilityId, status: "OPEN" },
    });
    if (existing) {
      console.log(`  SKIP existing OPEN mandate: "${m.title}"`);
      continue;
    }

    const mandate = await prisma.cadreMandate.create({
      data: {
        title: m.title,
        description: m.description,
        facilityId,
        cadre: m.cadre as any,
        type: m.type as any,
        subSpecialty: m.subSpecialty,
        salaryRangeMin: m.salaryMin,
        salaryRangeMax: m.salaryMax,
        salaryCurrency: "NGN",
        minYearsExperience: m.minYearsExperience,
        urgency: m.urgency,
        locationState: m.locationState,
        locationCity: m.locationCity,
        requiredQualifications: m.requiredQualifications,
        preferredQualifications: m.preferredQualifications,
        isRemoteOk: false,
        isRelocationRequired: m.isRelocationRequired ?? false,
        status: "OPEN",
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    const slug = slugify(m.title, mandate.id.slice(-6));
    await prisma.cadreMandate.update({ where: { id: mandate.id }, data: { slug } });
    created.push({ title: m.title, slug });
    console.log(`  mandate created:  "${m.title}"  ->  /oncadre/jobs/${slug}`);
  }

  console.log(`\nDone. ${created.length} mandate(s) created.\n`);
  if (created.length) {
    console.log("Shareable links:");
    for (const j of created) {
      console.log(`  ${j.title}`);
      console.log(`    https://consultforafrica.com/oncadre/jobs/${j.slug}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
