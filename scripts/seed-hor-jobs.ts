/**
 * Seed House of Refuge (HOR) job postings on CadreHealth.
 *
 * Posts 9 HOR FTE roles (excludes C4A management functions and the filled Programme Manager role).
 * All roles are in Lekki, Lagos. Faith-integrated rehabilitation facility.
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-hor-jobs.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FACILITY_NAME = "House of Refuge";
const LOCATION_STATE = "Lagos";
const LOCATION_CITY = "Lekki";

function generateSlug(title: string, suffix: string): string {
  return (title + " " + FACILITY_NAME + " " + LOCATION_CITY + " " + LOCATION_STATE)
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
  description: string;
  requiredQualifications: string[];
  preferredQualifications: string[];
  valuesRequirements: string;
}

const JOBS: JobPost[] = [
  {
    title: "Medical Director",
    cadre: "MEDICINE",
    type: "PERMANENT",
    salaryMin: 1200000,
    salaryMax: 1800000,
    minYearsExperience: 8,
    urgency: "HIGH",
    description: `House of Refuge (HOR) is a faith-integrated residential rehabilitation facility in Lekki, Lagos, offering a medically rigorous 12-week treatment programme for individuals recovering from addiction.

We are seeking a Medical Director to serve as the most senior clinical authority at HOR. You will hold medical responsibility for all residents, lead the clinical governance framework, and ensure the programme meets the highest standards of clinical and ethical practice.

You will chair the Clinical Governance Board, oversee the 12-week residential treatment programme, supervise the Clinical Lead, Nursing Officer, and all clinical staff, and work in close partnership with the Programme Director to integrate clinical excellence with operational management.

This role requires leading complex clinical decisions including medication management, dual diagnosis, detoxification protocols, and crisis intervention. You will represent HOR clinically with external bodies including NDLEA, medical councils, and referring hospitals.

HOR's treatment model explicitly integrates evidence-based clinical practice with a Christian spiritual framework. The successful candidate must believe in this integration and lead the pastoral-clinical model that defines HOR's approach to recovery.`,
    requiredQualifications: [
      "MBBS or equivalent medical degree; full registration with MDCN",
      "Minimum 8 years post-qualification experience; at least 3 in addiction, rehabilitation, or mental health",
      "Demonstrated clinical leadership experience leading a multidisciplinary clinical team",
      "Commitment to evidence-based practice in addiction medicine",
      "Active Christian faith, aligned with HOR's faith-integrated treatment approach",
      "Excellent communication with patients, families, and non-clinical stakeholders",
    ],
    preferredQualifications: [
      "Postgraduate qualification in psychiatry, addiction medicine, or public health",
      "Fellowship of West African College of Physicians (Psychiatry) or equivalent",
      "Experience in a residential or inpatient rehabilitation setting",
      "Experience in clinical governance, audit, and accreditation processes",
      "Experience managing dual diagnosis presentations",
    ],
    valuesRequirements: "Active Christian faith required. Must believe in and lead the faith-integrated clinical model.",
  },
  {
    title: "Clinical Lead / Head Counsellor",
    cadre: "PSYCHOLOGY_SOCIAL_WORK",
    type: "PERMANENT",
    salaryMin: 400000,
    salaryMax: 650000,
    minYearsExperience: 5,
    urgency: "HIGH",
    description: `House of Refuge is seeking a Clinical Lead / Head Counsellor to serve as the most senior clinical practitioner on the ground day-to-day. Working under the medical authority of the Medical Director, you will lead the counselling team, coordinate clinical activities within the 12-week programme, and ensure every resident receives high-quality, consistent, and therapeutically appropriate care.

This role combines clinical practice with team leadership. You will carry a personal caseload while also developing and supervising junior counsellors. You will chair the weekly clinical team meeting, conduct clinical assessments with new admissions, lead the therapeutic group programme, and manage critical clinical situations.

You will lead sessions that draw on scripture, prayer, and faith community as therapeutic resources, and must do so authentically. HOR's approach integrates clinical evidence with Christian spiritual practice.`,
    requiredQualifications: [
      "Degree or postgraduate qualification in counselling, psychology, social work, or related clinical field",
      "Minimum 5 years clinical practice experience; at least 2 in a supervisory or lead role",
      "Demonstrated ability to lead and develop a clinical team",
      "Strong assessment skills for clinical intake assessments and risk evaluations",
      "Professional registration with an appropriate counselling or psychology body",
      "Active Christian faith, genuinely aligned with HOR's treatment philosophy",
    ],
    preferredQualifications: [
      "Specialist training in addiction counselling (e.g. EMDR, CBT, motivational interviewing)",
      "Experience in a residential or inpatient treatment setting",
      "Experience delivering group therapy in an addiction or mental health context",
      "Familiarity with dual diagnosis presentations",
      "Experience in faith-integrated therapeutic approaches",
    ],
    valuesRequirements: "Active Christian faith essential. Must authentically integrate faith into clinical practice.",
  },
  {
    title: "Counsellor",
    cadre: "PSYCHOLOGY_SOCIAL_WORK",
    type: "PERMANENT",
    salaryMin: 200000,
    salaryMax: 350000,
    minYearsExperience: 2,
    urgency: "MEDIUM",
    description: `House of Refuge is hiring 2-3 Counsellors to serve as the primary therapeutic relationship for residents throughout the 12-week programme. You will deliver individual and group counselling, facilitate daily programme activities, provide pastoral and emotional support, and maintain the structured, safe environment that is the foundation of HOR's recovery model.

This role is demanding, emotionally, relationally, and spiritually. You will carry a personal caseload, co-facilitate group therapy sessions, support residents through critical moments (emotional crises, spiritual struggles, family conflict), and engage with residents' families.

Your faith, character, and personal groundedness matter as much as your clinical skills. You will be the most consistent human presence in residents' lives during their recovery.`,
    requiredQualifications: [
      "Degree or diploma in counselling, psychology, social work, or related field",
      "Minimum 2 years counselling practice experience",
      "Ability to facilitate group sessions confidently",
      "Emotional resilience to work with people in acute distress without burnout",
      "Active Christian faith, genuinely aligned with HOR's values",
    ],
    preferredQualifications: [
      "Specialist training in addiction counselling or substance use disorders",
      "Experience in a residential, inpatient, or structured day programme",
      "Training in specific therapeutic modalities (CBT, motivational interviewing)",
      "Experience integrating faith into therapeutic practice",
      "Experience working with families of people in recovery",
    ],
    valuesRequirements: "Active Christian faith essential. Faith must be a living reality visible to residents.",
  },
  {
    title: "Nursing Officer",
    cadre: "NURSING",
    type: "PERMANENT",
    salaryMin: 200000,
    salaryMax: 350000,
    minYearsExperience: 3,
    urgency: "HIGH",
    description: `House of Refuge is seeking a Nursing Officer to provide day-to-day medical care and monitoring for residents throughout the 12-week rehabilitation programme. Working under the authority of the Medical Director, you will administer medication, monitor physical health, manage detoxification care, respond to medical emergencies, and maintain the clinical environment to a professional nursing standard.

This is a demanding clinical role in a setting where residents may present with complex physical and mental health needs. You will be the first qualified clinical responder to medical emergencies, manage the medical room and medication storage, liaise with external healthcare providers, and provide health education to residents.

Shift rotation applies. You will work within a faith-integrated treatment environment and must approach your nursing role with compassion, dignity, and discretion.`,
    requiredQualifications: [
      "RN qualification; full registration with the Nursing and Midwifery Council of Nigeria",
      "Minimum 3 years post-registration experience; mental health, detox, or rehabilitation setting strongly preferred",
      "Competency in emergency response with BLS/first aid certification",
      "Meticulous with documentation and medication administration",
      "Emotional resilience and professional composure in a high-complexity clinical environment",
    ],
    preferredQualifications: [
      "Additional qualification in mental health nursing or addiction nursing",
      "Experience administering psychiatric or addiction medications",
      "Familiarity with detoxification protocols for alcohol and opioids",
      "Experience with electronic health records or management information systems",
      "Experience in a residential or inpatient healthcare setting",
    ],
    valuesRequirements: "Active Christian faith strongly preferred. Alignment with HOR's values essential.",
  },
  {
    title: "Social Worker",
    cadre: "PSYCHOLOGY_SOCIAL_WORK",
    type: "PERMANENT",
    salaryMin: 200000,
    salaryMax: 350000,
    minYearsExperience: 3,
    urgency: "MEDIUM",
    description: `House of Refuge is seeking a Social Worker to bridge the world of the resident with the world outside. You will work with residents to address the social determinants of their addiction, support families through the treatment process, coordinate aftercare planning, and build the community connections that support long-term recovery beyond HOR's walls.

Key responsibilities include conducting social assessments for new residents, facilitating family therapy sessions, leading aftercare planning for every resident, building a network of aftercare resources (halfway houses, support groups, vocational training, community churches), and coordinating with external agencies.

You will maintain aftercare follow-up contact at 30, 90, and 180 days post-discharge, ensuring continuity of support.`,
    requiredQualifications: [
      "Degree in social work; registration with the appropriate professional body in Nigeria",
      "Minimum 3 years post-qualification experience in a social work role",
      "Experience facilitating family sessions and working with complex family systems",
      "Strong knowledge of community resources: housing, employment, legal, and faith community networks",
      "Emotional resilience to hold complexity and distress without becoming overwhelmed",
    ],
    preferredQualifications: [
      "Postgraduate training in family therapy, systemic practice, or addiction social work",
      "Experience in a healthcare, rehabilitation, or mental health setting",
      "Familiarity with the Lagos social welfare landscape",
      "Experience in aftercare planning or case management",
      "Experience working with people in recovery from substance use disorders",
    ],
    valuesRequirements: "Active Christian faith strongly preferred. Must engage meaningfully with pastoral resources.",
  },
  {
    title: "Chaplain",
    cadre: "PSYCHOLOGY_SOCIAL_WORK",
    type: "PERMANENT",
    salaryMin: 150000,
    salaryMax: 250000,
    minYearsExperience: 5,
    urgency: "MEDIUM",
    description: `House of Refuge is seeking a Chaplain to serve as the spiritual anchor of the institution. You will be responsible for the pastoral life of the community, the integrity of the faith-integrated treatment model, and the spiritual wellbeing of every resident, every member of staff, and the institution as a whole.

This is not a ceremonial role. You will be present with residents in their darkest moments, leading worship and scripture engagement that is therapeutically intentional. You will lead daily morning devotions and evening prayer, provide individual pastoral counselling, integrate biblical content into the therapeutic programme, and provide pastoral support to staff.

You will also coordinate faith community engagement, building relationships with churches and faith leaders who can support residents during and after treatment. You will lead special services including graduation ceremonies and represent the pastoral vision of the institution.`,
    requiredQualifications: [
      "Formal theological training: degree in theology, ministry, or divinity",
      "Ordained or licensed minister, or recognised pastoral leader in a credible Christian denomination",
      "Minimum 5 years active pastoral ministry experience",
      "Genuine, living Christian faith evidenced in character and practice",
      "Emotional and spiritual maturity to sit with suffering without easy answers",
      "Alignment with the Freedom Foundation's theological tradition",
    ],
    preferredQualifications: [
      "Additional training in pastoral care, clinical pastoral education (CPE), or counselling",
      "Experience in chaplaincy in a healthcare, prison, or social care setting",
      "Familiarity with the theology and practice of addiction recovery ministry",
      "Connections to the Lagos faith community",
      "Experience leading worship, discipleship, and faith formation in a structured setting",
    ],
    valuesRequirements: "Deep, demonstrated, active Christian faith is the entire mandate of this role.",
  },
  {
    title: "Admin Coordinator",
    cadre: "HEALTH_ADMINISTRATION",
    type: "PERMANENT",
    salaryMin: 200000,
    salaryMax: 320000,
    minYearsExperience: 2,
    urgency: "MEDIUM",
    description: `House of Refuge is seeking an Admin Coordinator to manage the documentation, communication, and administrative processes that keep the institution functioning. You will be the first point of contact for families and referral sources, maintain all non-clinical records, support the billing and intake process, and ensure the administrative environment is organised, professional, and responsive.

Key responsibilities include managing incoming enquiries, coordinating the admissions process, maintaining the resident file system, supporting billing administration, managing the Programme Director's diary, and coordinating external communications.

You will often be the first human contact for families in distress seeking information about treatment. You must embody warmth, compassion, and professionalism.`,
    requiredQualifications: [
      "Degree or HND in business administration, secretarial studies, or related field",
      "Minimum 2 years experience in an administrative or coordination role",
      "Excellent written and verbal communication in English",
      "Strong proficiency in Microsoft Office (Word, Excel, Outlook)",
      "Discretion, professionalism, and confidentiality in handling sensitive information",
    ],
    preferredQualifications: [
      "Experience in a healthcare or NGO administrative environment",
      "Familiarity with electronic record management systems",
      "Experience managing a senior executive's diary and correspondence",
      "Experience in a client-facing administrative role",
      "Understanding of billing or invoicing processes",
    ],
    valuesRequirements: "Active Christian faith strongly preferred. Must handle sensitive conversations with grace.",
  },
  {
    title: "House Master",
    cadre: "HEALTH_ADMINISTRATION",
    type: "PERMANENT",
    salaryMin: 250000,
    salaryMax: 400000,
    minYearsExperience: 3,
    urgency: "HIGH",
    description: `House of Refuge is seeking a House Master to hold the culture of the therapeutic community. This is not a facilities role. It is a community leadership role. You will be the constant human authority in the recovery community: present from morning to night, setting the tone of the house, enforcing the daily structure, building community among residents, and embodying the values of the programme in every interaction.

You will lead the daily rhythm of the community (morning wake-up through lights-out), enforce house rules firmly and fairly, de-escalate conflict among residents, build community through weekly house meetings and peer accountability, and be a trusted presence in informal moments.

You will supervise domestic and housekeeping staff, manage the catering function, maintain the physical environment, manage resident belongings and property, and maintain physical access and security.

This is a live-in role. Accommodation is provided on-site. The right candidate will understand the therapeutic community model intuitively, from experience in a boarding school, military setting, prison chaplaincy, or structured social care environment.`,
    requiredQualifications: [
      "Demonstrated experience as a House Master, boarding house parent, or residential community leader",
      "Personal authority: the ability to hold a room, maintain discipline, and be respected without being feared",
      "Emotional intelligence and pastoral sensitivity to enforce boundaries without destroying trust",
      "Physical stamina and genuine willingness to be present (this role does not end at 5pm)",
      "Active Christian faith that residents can see and respect",
      "Willingness and ability to live on-site (mandatory requirement)",
    ],
    preferredQualifications: [
      "Formal qualification in social care, youth work, counselling, or related field",
      "Experience in a rehabilitation, prison, military, or faith-based residential setting",
      "Training in conflict resolution, de-escalation, or crisis management",
      "Experience managing domestic or housekeeping staff",
      "Knowledge of safeguarding principles and incident reporting procedures",
    ],
    valuesRequirements: "Active Christian faith required. This is a vocation, not a job. Faith must be visible and authentic.",
  },
  {
    title: "Finance Officer",
    cadre: "HEALTH_ADMINISTRATION",
    type: "PERMANENT",
    salaryMin: 250000,
    salaryMax: 400000,
    minYearsExperience: 2,
    urgency: "MEDIUM",
    description: `House of Refuge is seeking a Finance Officer to provide day-to-day financial administration. You will process transactions, reconcile accounts, manage petty cash, prepare and issue resident fee invoices, track outstanding receivables, manage vendor payments, and support payroll processing.

Working under the Finance & Revenue Management Lead, you will ensure every financial movement is recorded accurately and promptly. You will reconcile bank accounts monthly, maintain financial filing in an audit-ready manner, and support statutory compliance administration (PAYE, pension, NHIA).

This is a hands-on operational finance role. Integrity and accuracy are non-negotiable.`,
    requiredQualifications: [
      "Degree or HND in accounting, finance, or business administration; ICAN/ACCA foundation level preferred",
      "Minimum 2 years experience in a finance or accounts role",
      "Proficiency in accounting software (QuickBooks, Sage, or equivalent)",
      "Accuracy and attention to detail with zero tolerance for bookkeeping errors",
      "Discretion in handling financial information",
    ],
    preferredQualifications: [
      "Part-qualified ICAN or ACCA student",
      "Experience in NGO, healthcare, or social enterprise accounting",
      "Familiarity with Nigerian statutory compliance (PAYE, pension, NHIA)",
      "Experience reconciling bank accounts and preparing trial balances",
      "Experience in a cash-handling environment",
    ],
    valuesRequirements: "Active Christian faith strongly preferred. Financial stewardship is an act of service to the mission.",
  },
];

async function main() {
  console.log("Creating House of Refuge facility profile and job postings...\n");

  // Step 1: Create or find the House of Refuge facility profile
  let facility = await prisma.cadreFacility.findFirst({
    where: { slug: "house-of-refuge" },
  });

  if (!facility) {
    facility = await prisma.cadreFacility.create({
      data: {
        name: "House of Refuge",
        slug: "house-of-refuge",
        type: "FAITH_BASED",
        state: LOCATION_STATE,
        city: LOCATION_CITY,
        address: "Lekki, Lagos",
        isVerified: true,
      },
    });
    console.log(`  Created facility: "${facility.name}" -> /oncadre/hospitals/${facility.slug}`);
  } else {
    console.log(`  Facility exists: "${facility.name}" (${facility.id})`);
  }

  // Step 2: Create job postings linked to the facility
  const created: { title: string; slug: string; id: string }[] = [];

  for (const job of JOBS) {
    // Check if already posted
    const existing = await prisma.cadreMandate.findFirst({
      where: { title: job.title, facilityId: facility.id, status: "OPEN" },
    });

    if (existing) {
      console.log(`  SKIP: "${job.title}" already posted (${existing.id})`);
      continue;
    }

    const mandate = await prisma.cadreMandate.create({
      data: {
        title: job.title,
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
        valuesRequirements: job.valuesRequirements,
        isRemoteOk: false,
        isRelocationRequired: false,
        status: "OPEN",
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    // Generate and set slug
    const slug = generateSlug(job.title, mandate.id.slice(-6));
    await prisma.cadreMandate.update({
      where: { id: mandate.id },
      data: { slug },
    });

    created.push({ title: job.title, slug, id: mandate.id });
    console.log(`  OK: "${job.title}" -> /oncadre/jobs/${slug}`);
  }

  console.log(`\nCreated ${created.length} job postings.`);
  if (created.length > 0) {
    console.log("\nShareable links:");
    for (const j of created) {
      console.log(`  ${j.title}: https://consultforafrica.com/oncadre/jobs/${j.slug}`);
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
