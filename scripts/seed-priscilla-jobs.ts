/**
 * Seed Priscilla Specialist Medical & Diagnostic Complex job postings.
 * Phase 1 Critical roles only. Salaries are gross (back-calculated from net using PAYE + 8% pension).
 * Plus 5 visiting specialist privileges listings.
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-priscilla-jobs.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FACILITY_NAME = "Priscilla Specialist Medical & Diagnostic Complex";
const LOCATION_STATE = "Lagos";
const LOCATION_CITY = "Lagos";

function generateSlug(title: string, suffix: string): string {
  return (title + " priscilla specialist " + LOCATION_CITY)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) + "-" + suffix;
}

interface JobPost {
  title: string;
  cadre: string;
  type: string;
  salaryMin: number;
  salaryMax: number;
  minYearsExperience: number;
  urgency: string;
  headcount: number;
  description: string;
  requiredQualifications: string[];
  preferredQualifications: string[];
}

// ─── PHASE 1 CRITICAL FTE ROLES ────────────────────────────────────────────

const FTE_JOBS: JobPost[] = [
  {
    title: "Medical Officer",
    cadre: "MEDICINE",
    type: "PERMANENT",
    salaryMin: 550000,
    salaryMax: 634000,
    minYearsExperience: 1,
    urgency: "URGENT",
    headcount: 4,
    description: `Priscilla Specialist Medical & Diagnostic Complex is a new private specialist hospital opening in Lagos. We are recruiting 4 Medical Officers to provide full-time clinical coverage across general medicine, A&E, and ward care from Day 1.

You will cover the 24/7 on-call rota from opening, working across outpatient consultations, emergency presentations, ward rounds, and inpatient management. Salary is graded by experience, ranging from CONMESS-equivalent entry to mid-career levels. Assessment and grading will be confirmed at appointment.

This is a ground-floor opportunity to join a brand-new facility with modern equipment, a strong clinical governance framework, and a clear growth trajectory. The Medical Director is already in post and will lead your onboarding and clinical supervision.

Gross salary includes pension and statutory deductions. 4 positions available.`,
    requiredQualifications: [
      "MBBS or equivalent; full MDCN registration",
      "Completed housemanship and NYSC",
      "Competency in A&E and ward care",
      "Ability to work rotating shifts including nights and weekends",
      "Strong clinical documentation skills",
    ],
    preferredQualifications: [
      "1-3 years post-NYSC clinical experience",
      "Experience in a private hospital or diagnostic centre",
      "Interest in a specific clinical area (surgery, medicine, O&G, paediatrics)",
      "BLS/ACLS certification",
    ],
  },
  {
    title: "Ward Sister / Charge Nurse",
    cadre: "NURSING",
    type: "PERMANENT",
    salaryMin: 400000,
    salaryMax: 468000,
    minYearsExperience: 5,
    urgency: "URGENT",
    headcount: 2,
    description: `Priscilla Specialist is recruiting 2 Ward Sisters / Charge Nurses for pre-opening clinical setup. You will be among the first nursing staff in the building, responsible for orienting wards, setting nursing protocols, and preparing for patient intake before the first admission.

You will manage a specific ward or unit, lead shift handovers, conduct medication rounds, supervise junior nurses, and ensure ward care quality meets the hospital's clinical governance standards. You report to the Director of Nursing.

This is a leadership nursing role. You will set the standard that every nurse who joins after you will follow. 2 positions available.`,
    requiredQualifications: [
      "RN qualification; full registration with Nursing and Midwifery Council of Nigeria",
      "Minimum 5 years post-registration experience",
      "Demonstrated ward management and shift leadership experience",
      "Strong medication administration and documentation skills",
      "Ability to supervise and mentor junior nursing staff",
    ],
    preferredQualifications: [
      "Additional qualification in a nursing specialty",
      "Experience in a private hospital setting",
      "Experience setting up nursing protocols for a new facility",
      "BLS certification",
    ],
  },
  {
    title: "Staff Nurse (RN)",
    cadre: "NURSING",
    type: "PERMANENT",
    salaryMin: 270000,
    salaryMax: 310000,
    minYearsExperience: 0,
    urgency: "URGENT",
    headcount: 6,
    description: `Priscilla Specialist is recruiting 6 Registered Nurses to form the core nursing team from Day 1. You must be fully onboarded and inducted before the first patient is admitted.

You will provide direct patient care across all wards and units, including patient observation, medication administration, IV management, documentation, and family communication. You will work rotating shifts under the supervision of the Ward Sister and Director of Nursing.

This is a 30-bed facility at opening, growing with occupancy. You will be part of the founding nursing team with early responsibility and career development opportunities. 6 positions available.`,
    requiredQualifications: [
      "RN qualification; full NMCN registration",
      "Competency in patient observation, medication administration, and IV management",
      "Strong documentation and communication skills",
      "Willingness to work rotating shifts including nights",
    ],
    preferredQualifications: [
      "1-2 years post-registration experience",
      "Experience in a private hospital or specialist facility",
      "BLS certification",
      "Experience with electronic health records",
    ],
  },
  {
    title: "Staff Nurse - Maternity / Midwife",
    cadre: "MIDWIFERY",
    type: "PERMANENT",
    salaryMin: 340000,
    salaryMax: 389000,
    minYearsExperience: 1,
    urgency: "URGENT",
    headcount: 2,
    description: `Priscilla Specialist is recruiting 2 Midwives for the maternity unit, which will be operational from Day 1. You will provide qualified antenatal, delivery, and postnatal care.

Responsibilities include antenatal checks, CTG monitoring, delivery support, postnatal care, newborn assessment, and breastfeeding support. You will work closely with visiting obstetricians and the Medical Director to ensure safe maternity care.

Two midwives are the required minimum for opening. This is a critical hire. 2 positions available.`,
    requiredQualifications: [
      "Registered Midwife; full NMCN registration",
      "Minimum 1 year midwifery experience",
      "Competency in antenatal care, normal delivery, and postnatal management",
      "Ability to recognize and escalate obstetric emergencies",
      "Strong documentation skills",
    ],
    preferredQualifications: [
      "Experience in a private maternity unit",
      "Training in emergency obstetric care (EmOC)",
      "Neonatal resuscitation skills",
      "Experience with CTG interpretation",
    ],
  },
  {
    title: "A&E Nurse / Triage Officer",
    cadre: "NURSING",
    type: "PERMANENT",
    salaryMin: 330000,
    salaryMax: 376000,
    minYearsExperience: 2,
    urgency: "URGENT",
    headcount: 2,
    description: `Priscilla Specialist is recruiting 2 A&E Nurses / Triage Officers. The A&E department will be operational from Day 1, and dedicated triage nurses are essential for patient safety.

You will manage the triage process for all emergency presentations, conduct initial patient assessments, initiate emergency protocols, support the medical team with resuscitation and acute care, and maintain A&E documentation. You will also manage emergency drug and equipment readiness.

2 positions available to ensure coverage across shifts.`,
    requiredQualifications: [
      "RN qualification; full NMCN registration",
      "Minimum 2 years nursing experience, with A&E or emergency exposure",
      "Competency in triage assessment and emergency nursing procedures",
      "BLS certification (ACLS preferred)",
      "Ability to work under pressure in a fast-paced environment",
    ],
    preferredQualifications: [
      "Dedicated A&E or emergency department experience",
      "Experience with trauma and resuscitation",
      "ACLS or ATLS certification",
    ],
  },
  {
    title: "Theatre Nurse / Scrub Nurse",
    cadre: "NURSING",
    type: "PERMANENT",
    salaryMin: 390000,
    salaryMax: 442000,
    minYearsExperience: 2,
    urgency: "URGENT",
    headcount: 2,
    description: `Priscilla Specialist is recruiting 2 Theatre Nurses / Scrub Nurses. Theatre lists will begin from Week 1, and scrub nurses must be inducted for pre-opening.

You will provide specialist theatre nursing support including surgical scrubbing, instrument preparation, sterile field maintenance, pre-op checklists, post-op care, and theatre stock management. You will work directly with visiting consultant surgeons and the anaesthetic nurse.

The surgical programme is a key revenue driver for the facility. 2 positions available.`,
    requiredQualifications: [
      "RN qualification with perioperative or theatre nursing experience",
      "Minimum 2 years scrub nursing experience",
      "Competency in instrument handling, sterile technique, and surgical counts",
      "Knowledge of infection control protocols in theatre",
      "Strong attention to detail and ability to anticipate surgical needs",
    ],
    preferredQualifications: [
      "Formal perioperative nursing qualification or training",
      "Experience across multiple surgical specialties",
      "Experience setting up a new theatre suite",
    ],
  },
  {
    title: "Anaesthetic Nurse / ODP",
    cadre: "NURSING",
    type: "PERMANENT",
    salaryMin: 440000,
    salaryMax: 494000,
    minYearsExperience: 3,
    urgency: "URGENT",
    headcount: 1,
    description: `Priscilla Specialist is recruiting an Anaesthetic Nurse / Operating Department Practitioner (ODP). This role is required for all theatre lists and shared across theatre and ICU recovery.

You will support the anaesthetist with machine checks, patient positioning, airway support, PACU monitoring, and drug preparation. You will be present for all surgical procedures from Week 1 of operations.

This is a sole practitioner role at opening. 1 position available.`,
    requiredQualifications: [
      "RN qualification with anaesthetic nursing experience, or ODP qualification",
      "Minimum 3 years experience in anaesthetic support or operating department practice",
      "Competency in anaesthetic machine checks, airway management support, and PACU monitoring",
      "Knowledge of anaesthetic drugs and emergency protocols",
    ],
    preferredQualifications: [
      "Formal anaesthetic nursing or ODP certification",
      "Experience across general, obstetric, and orthopaedic anaesthesia",
      "Experience as sole anaesthetic nurse in a smaller facility",
    ],
  },
  {
    title: "Pharmacist (Lead)",
    cadre: "PHARMACY",
    type: "PERMANENT",
    salaryMin: 550000,
    salaryMax: 614000,
    minYearsExperience: 3,
    urgency: "URGENT",
    headcount: 1,
    description: `Priscilla Specialist is recruiting a Lead Pharmacist. The dispensary must be stocked and compliant before opening day. PCN licensing requires a named pharmacist on Day 1.

You will manage the dispensary, drug supply chain, formulary management, stock procurement, DDA compliance, and delivery programme coordination. You will oversee prescription review, drug dispensing, and interactions with medical staff on medication management.

This is the sole pharmacist at opening, with a Pharmacy Technician supporting. 1 position available.`,
    requiredQualifications: [
      "B.Pharm; full PCN registration",
      "Minimum 3 years post-registration experience",
      "Experience managing a hospital dispensary or pharmacy",
      "Knowledge of drug procurement, stock control, and DDA compliance",
      "Strong formulary management skills",
    ],
    preferredQualifications: [
      "Experience in a private hospital pharmacy",
      "Experience setting up a pharmacy for a new facility",
      "Clinical pharmacy exposure",
      "Experience with electronic stock management systems",
    ],
  },
  {
    title: "Laboratory Scientist (Lead)",
    cadre: "MEDICAL_LABORATORY_SCIENCE",
    type: "PERMANENT",
    salaryMin: 490000,
    salaryMax: 552000,
    minYearsExperience: 3,
    urgency: "URGENT",
    headcount: 1,
    description: `Priscilla Specialist is recruiting a Lead Laboratory Scientist. The lab must be operational from Day 1. MLSCN registration and licence are required.

You will manage the laboratory covering haematology, biochemistry, microbiology, and referral samples. Responsibilities include sample processing, result reporting, QC management, MLSCN compliance, referral lab liaison, and LIMS management.

1 position available. A Lab Technician will be added in Phase 2 when daily sample count exceeds capacity.`,
    requiredQualifications: [
      "BMLS or equivalent; full MLSCN registration",
      "Minimum 3 years post-registration laboratory experience",
      "Competency across haematology, biochemistry, and microbiology",
      "Experience with quality control and laboratory accreditation standards",
      "Knowledge of LIMS or electronic result reporting",
    ],
    preferredQualifications: [
      "Experience as sole or lead scientist in a private lab",
      "Experience setting up laboratory operations for a new facility",
      "Phlebotomy competency",
    ],
  },
  {
    title: "Radiographer",
    cadre: "RADIOGRAPHY_IMAGING",
    type: "PERMANENT",
    salaryMin: 460000,
    salaryMax: 515000,
    minYearsExperience: 2,
    urgency: "URGENT",
    headcount: 1,
    description: `Priscilla Specialist is recruiting a Radiographer. Radiology will be operational from Day 1 with X-ray and ultrasound. NNRA compliance is required.

You will operate X-ray and ultrasound equipment, manage imaging reports, ensure radiation safety, maintain PACS (if available), and coordinate with referring clinicians. You report to the Medical Director.

1 position available. This is the sole radiographer at opening.`,
    requiredQualifications: [
      "B.Sc Radiography or equivalent; full RRBN registration",
      "NNRA licence compliance",
      "Minimum 2 years experience in diagnostic radiography",
      "Competency in X-ray imaging and ultrasound scanning",
      "Knowledge of radiation safety protocols",
    ],
    preferredQualifications: [
      "Experience in a private diagnostic centre",
      "PACS management experience",
      "CT scan experience (for future expansion)",
    ],
  },
  {
    title: "Hospital Administrator / Operations Manager",
    cadre: "HEALTH_ADMINISTRATION",
    type: "PERMANENT",
    salaryMin: 630000,
    salaryMax: 706000,
    minYearsExperience: 5,
    urgency: "URGENT",
    headcount: 1,
    description: `Priscilla Specialist is recruiting a Hospital Administrator / Operations Manager. This is a C4A-placed embedded operations lead, responsible for day-to-day facility management and staff coordination from pre-opening.

You must be in post 4 weeks before opening to coordinate staff, vendors, and setup. You will manage daily operations, patient flow, vendor management, compliance tracking, staff rota oversight, and board reporting support.

This role reports to the C4A COO and works closely with the Medical Director. 1 position available.`,
    requiredQualifications: [
      "Degree in health management, business administration, or related field",
      "Minimum 5 years experience in hospital operations or healthcare management",
      "Strong organisational and coordination skills",
      "Experience managing staff rotas, vendor contracts, and facility compliance",
      "Excellent communication and reporting skills",
    ],
    preferredQualifications: [
      "Experience in a private hospital or diagnostic centre",
      "Experience with hospital pre-opening or setup",
      "Knowledge of Nigerian healthcare regulatory requirements",
      "Experience with HMO panel management",
    ],
  },
  {
    title: "Paramedic / Emergency Medical Technician",
    cadre: "COMMUNITY_HEALTH",
    type: "PERMANENT",
    salaryMin: 320000,
    salaryMax: 363000,
    minYearsExperience: 1,
    urgency: "HIGH",
    headcount: 2,
    description: `Priscilla Specialist is recruiting 2 Paramedics / Emergency Medical Technicians for pre-hospital emergency care and ambulance response. You will also provide dual-role support to the A&E department and nursing team.

Responsibilities include ambulance response, emergency assessment, IV access, teamwork on call-outs, and A&E support. You report to the Director of Nursing or on-call Medical Officer.

2 positions available.`,
    requiredQualifications: [
      "Paramedic or EMT certification",
      "Minimum 1 year emergency care experience",
      "Competency in ambulance response, airway management, and IV access",
      "Valid driving licence (for ambulance operation if required)",
      "BLS certification",
    ],
    preferredQualifications: [
      "ACLS or PHTLS certification",
      "Experience in a private ambulance service",
      "Experience supporting A&E departments",
    ],
  },
];

// ─── VISITING SPECIALIST PRIVILEGES ─────────────────────────────────────────

interface PrivilegesPost {
  title: string;
  specialty: string;
  phase: string;
  description: string;
  requirements: string[];
  preferred: string[];
}

const PRIVILEGES: PrivilegesPost[] = [
  {
    title: "Visiting Consultant Surgeon",
    specialty: "General Surgery",
    phase: "Phase 2 (Opening Day)",
    description: `Priscilla Specialist Medical & Diagnostic Complex is offering practising privileges for a Consultant Surgeon. Surgical lists begin from Week 1 of operations.

This is a sessional arrangement, not a salaried position. You will have access to a fully equipped theatre with dedicated scrub nurses, an anaesthetic nurse/ODP, and supporting clinical staff from Day 1.

Revenue model: Fee-per-session for elective lists. Revenue share arrangement for private patients. Emergency on-call cover fee available.

Minimum commitment: 1 elective list per week. Flexible scheduling. You may hold privileges at other facilities concurrently.

The facility is building its surgical programme as a core revenue stream. Early-stage specialists who help build volume will have priority scheduling and the strongest revenue share terms.`,
    requirements: [
      "Fellowship of West African College of Surgeons (FWACS) or equivalent",
      "Full MDCN registration with current practising licence",
      "Professional indemnity insurance",
      "Minimum 3 years post-fellowship consultant experience",
      "Ability to commit to minimum 1 session per week",
    ],
    preferred: [
      "Subspecialty interest (laparoscopic, GI, breast, thyroid)",
      "Existing private patient base in Lagos",
      "Experience operating across multiple facilities",
      "Willingness to provide emergency on-call cover on a rota basis",
    ],
  },
  {
    title: "Visiting Obstetrician / Gynaecologist",
    specialty: "Obstetrics & Gynaecology",
    phase: "Phase 2 (Opening Day)",
    description: `Priscilla Specialist is offering practising privileges for a Consultant Obstetrician / Gynaecologist. The maternity unit and complex case support will be available from Month 1.

This is a sessional arrangement. You will have access to a maternity unit with trained midwives, a theatre suite with scrub and anaesthetic nursing support, and diagnostic capabilities (ultrasound, lab).

Revenue model: Sessional clinic fees. Revenue share on private antenatal bookings and deliveries. Surgical list access for gynaecological procedures.

The facility expects maternity to be a high-volume service line. Complex C-section support is needed from Month 1. Antenatal clinics can be scheduled around your existing practice.`,
    requirements: [
      "Fellowship (FWACS, FMCOG, or equivalent) in Obstetrics & Gynaecology",
      "Full MDCN registration with current practising licence",
      "Professional indemnity insurance",
      "Competency in complex obstetric and gynaecological cases",
    ],
    preferred: [
      "Subspecialty interest (urogynaecology, reproductive medicine, maternal-fetal medicine)",
      "Existing antenatal patient base in Lagos",
      "Experience with high-risk obstetric management",
      "Willingness to participate in MDT review of maternity cases",
    ],
  },
  {
    title: "Visiting Paediatrician",
    specialty: "Paediatrics",
    phase: "Phase 3 (Month 3)",
    description: `Priscilla Specialist is offering practising privileges for a Consultant Paediatrician. Paediatric OPD and inpatient support will be needed as volume builds by Month 3.

This is a sessional arrangement. You will have clinic and ward access, with nursing support, diagnostic capabilities, and a pharmacy stocked for paediatric use.

Revenue model: Sessional clinic and ward round fees. Revenue share on paediatric admissions and referrals. Immunisation clinic scheduling available.

Paediatric referral volume is expected to build steadily. The facility seeks a paediatrician willing to establish a regular presence and build the paediatric service line.`,
    requirements: [
      "Fellowship (FWACP/FMCPaed or equivalent) in Paediatrics",
      "Full MDCN registration with current practising licence",
      "Professional indemnity insurance",
      "Competency in neonatal assessment, sick child admissions, and paediatric OPD",
    ],
    preferred: [
      "Subspecialty interest (neonatology, paediatric emergency, developmental paediatrics)",
      "Existing paediatric patient base in Lagos",
      "Experience with immunisation programme coordination",
      "Willingness to support growth monitoring and well-child clinics",
    ],
  },
  {
    title: "Visiting Cardiologist",
    specialty: "Cardiology",
    phase: "Phase 4 (Month 6+)",
    description: `Priscilla Specialist is offering practising privileges for a Consultant Cardiologist. The cardiology clinic will open once HMO panel status is active and the patient base is established, expected around Month 6.

This is a sessional arrangement. You will have access to ECG interpretation, echocardiography (once commissioned), and a clinical team trained to support cardiac outpatient and inpatient management.

Revenue model: Sessional clinic fees. Revenue share on cardiac consultations, diagnostics, and referrals. Opportunity to shape the cardiac service line from inception.

The facility is registering with multiple HMO panels. Cardiologist demand is confirmed once panel activity begins.`,
    requirements: [
      "Fellowship (FWACP/FMCPath Cardiology or equivalent) in Cardiology",
      "Full MDCN registration with current practising licence",
      "Professional indemnity insurance",
      "Competency in ECG, echocardiography, and hypertension management",
    ],
    preferred: [
      "Interest in building a cardiac service line at a new facility",
      "Existing patient base or referral network in Lagos",
      "Experience with HMO panel cardiology clinics",
      "Specialist referral capability for complex cases",
    ],
  },
  {
    title: "Visiting Orthopaedic Surgeon",
    specialty: "Orthopaedic Surgery",
    phase: "Phase 4 (Month 6+)",
    description: `Priscilla Specialist is offering practising privileges for a Consultant Orthopaedic Surgeon. Orthopaedic sessions will be introduced once surgical volume justifies dedicated lists, expected around Month 6.

This is a sessional arrangement. You will have access to a fully equipped theatre, imaging (X-ray from Day 1), and a clinical team experienced in post-operative orthopaedic care.

Revenue model: Fee-per-session for elective orthopaedic lists. Revenue share on private orthopaedic cases. Fracture and trauma management opportunities.

The facility targets 2-4 orthopaedic cases per month initially, scaling with referral volume and HMO panel activation.`,
    requirements: [
      "Fellowship (FWACS Orthopaedics or equivalent) in Orthopaedic Surgery",
      "Full MDCN registration with current practising licence",
      "Professional indemnity insurance",
      "Competency in fracture management, elective joint procedures, and sports injury clinics",
    ],
    preferred: [
      "Subspecialty interest (sports medicine, arthroplasty, spine)",
      "Existing orthopaedic patient base in Lagos",
      "Experience operating across multiple facilities",
      "Interest in building an orthopaedic referral pipeline at a new facility",
    ],
  },
];

async function main() {
  console.log("Creating Priscilla Specialist facility and job postings...\n");

  // Step 1: Create facility
  let facility = await prisma.cadreFacility.findFirst({ where: { slug: "priscilla-specialist" } });

  if (!facility) {
    facility = await prisma.cadreFacility.create({
      data: {
        name: FACILITY_NAME,
        slug: "priscilla-specialist",
        type: "PRIVATE_TERTIARY",
        description: `Priscilla Specialist Medical & Diagnostic Complex is a new private specialist hospital opening in Lagos in May 2026. The facility will offer comprehensive inpatient, outpatient, surgical, maternity, diagnostic, and homecare services.\n\nManaged by Consult For Africa (C4A), Priscilla Specialist is being built with modern clinical infrastructure, strong governance from Day 1, and a phased hiring plan aligned to clinical need, patient load, and revenue ramp. The facility is actively recruiting clinical and support staff for pre-opening onboarding.\n\nServices will include general medicine, surgery (multiple specialties via visiting consultants), maternity and obstetrics, A&E, pharmacy, laboratory diagnostics, radiology, physiotherapy, and a homecare programme for chronic disease management.`,
        state: LOCATION_STATE,
        city: LOCATION_CITY,
        yearEstablished: 2026,
        isVerified: true,
      },
    });
    console.log(`  Created facility: "${facility.name}" -> /oncadre/hospitals/${facility.slug}`);
  } else {
    console.log(`  Facility exists: "${facility.name}" (${facility.id})`);
  }

  // Step 2: Create FTE job postings
  const created: { title: string; slug: string }[] = [];

  for (const job of FTE_JOBS) {
    const existing = await prisma.cadreMandate.findFirst({
      where: { title: job.title, facilityId: facility.id, status: "OPEN" },
    });
    if (existing) {
      console.log(`  SKIP: "${job.title}" already posted`);
      continue;
    }

    const mandate = await prisma.cadreMandate.create({
      data: {
        title: job.headcount > 1 ? `${job.title} (x${job.headcount})` : job.title,
        description: job.description,
        facilityId: facility.id,
        cadre: job.cadre as any,
        type: job.type as any,
        salaryRangeMin: job.salaryMin,
        salaryRangeMax: job.salaryMax,
        salaryCurrency: "NGN",
        minYearsExperience: job.minYearsExperience,
        urgency: job.urgency,
        locationState: LOCATION_STATE,
        locationCity: LOCATION_CITY,
        requiredQualifications: job.requiredQualifications,
        preferredQualifications: job.preferredQualifications,
        isRemoteOk: false,
        isRelocationRequired: false,
        status: "OPEN",
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    const slug = generateSlug(job.title, mandate.id.slice(-6));
    await prisma.cadreMandate.update({ where: { id: mandate.id }, data: { slug } });
    created.push({ title: mandate.title, slug });
    console.log(`  OK: "${mandate.title}" -> /oncadre/jobs/${slug}`);
  }

  // Step 3: Create visiting specialist privileges listings
  for (const priv of PRIVILEGES) {
    const existing = await prisma.cadreMandate.findFirst({
      where: { title: priv.title, facilityId: facility.id, status: "OPEN" },
    });
    if (existing) {
      console.log(`  SKIP: "${priv.title}" already posted`);
      continue;
    }

    const mandate = await prisma.cadreMandate.create({
      data: {
        title: priv.title,
        description: priv.description,
        facilityId: facility.id,
        cadre: "MEDICINE" as any,
        type: "CONSULTING" as any,
        // No salary range for privileges - revenue share model
        salaryCurrency: "NGN",
        minYearsExperience: 5,
        urgency: priv.phase.includes("Phase 2") ? "HIGH" : "MEDIUM",
        locationState: LOCATION_STATE,
        locationCity: LOCATION_CITY,
        requiredQualifications: priv.requirements,
        preferredQualifications: priv.preferred,
        isRemoteOk: false,
        isRelocationRequired: false,
        status: "OPEN",
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    const slug = generateSlug(priv.title, mandate.id.slice(-6));
    await prisma.cadreMandate.update({ where: { id: mandate.id }, data: { slug } });
    created.push({ title: priv.title, slug });
    console.log(`  OK: "${priv.title}" (Privileges) -> /oncadre/jobs/${slug}`);
  }

  console.log(`\nCreated ${created.length} postings total.`);
  console.log("\nShareable links:");
  for (const j of created) {
    console.log(`  ${j.title}: https://consultforafrica.com/oncadre/jobs/${j.slug}`);
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
