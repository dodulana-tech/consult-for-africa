/**
 * Seed Nigerian hospitals into CadreFacility table.
 *
 * Run with: npx tsx scripts/seed-hospitals.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type FacilityType =
  | "PUBLIC_TERTIARY"
  | "PUBLIC_SECONDARY"
  | "PUBLIC_PRIMARY"
  | "PRIVATE_TERTIARY"
  | "PRIVATE_SECONDARY"
  | "PRIVATE_CLINIC"
  | "FAITH_BASED"
  | "NGO"
  | "MILITARY"
  | "INTERNATIONAL";

interface FacilitySeed {
  name: string;
  type: FacilityType;
  state: string;
  city: string;
}

const FEDERAL_MEDICAL_CENTRES: FacilitySeed[] = [
  { name: "Federal Medical Centre Abeokuta", type: "PUBLIC_TERTIARY", state: "Ogun", city: "Abeokuta" },
  { name: "Federal Medical Centre Asaba", type: "PUBLIC_TERTIARY", state: "Delta", city: "Asaba" },
  { name: "Federal Medical Centre Azare", type: "PUBLIC_TERTIARY", state: "Bauchi", city: "Azare" },
  { name: "Federal Medical Centre Birnin Kebbi", type: "PUBLIC_TERTIARY", state: "Kebbi", city: "Birnin Kebbi" },
  { name: "Federal Medical Centre Birnin Kudu", type: "PUBLIC_TERTIARY", state: "Jigawa", city: "Birnin Kudu" },
  { name: "Federal Medical Centre Ebute-Metta", type: "PUBLIC_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Federal Medical Centre Gombe", type: "PUBLIC_TERTIARY", state: "Gombe", city: "Gombe" },
  { name: "Federal Medical Centre Gusau", type: "PUBLIC_TERTIARY", state: "Zamfara", city: "Gusau" },
  { name: "Federal Medical Centre Idi-Aba", type: "PUBLIC_TERTIARY", state: "Ogun", city: "Abeokuta" },
  { name: "Federal Medical Centre Jalingo", type: "PUBLIC_TERTIARY", state: "Taraba", city: "Jalingo" },
  { name: "Federal Medical Centre Jabi Abuja", type: "PUBLIC_TERTIARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Federal Medical Centre Keffi", type: "PUBLIC_TERTIARY", state: "Nasarawa", city: "Keffi" },
  { name: "Federal Medical Centre Lokoja", type: "PUBLIC_TERTIARY", state: "Kogi", city: "Lokoja" },
  { name: "Federal Medical Centre Makurdi", type: "PUBLIC_TERTIARY", state: "Benue", city: "Makurdi" },
  { name: "Federal Medical Centre Nguru", type: "PUBLIC_TERTIARY", state: "Yobe", city: "Nguru" },
  { name: "Federal Medical Centre Owerri", type: "PUBLIC_TERTIARY", state: "Imo", city: "Owerri" },
  { name: "Federal Medical Centre Owo", type: "PUBLIC_TERTIARY", state: "Ondo", city: "Owo" },
  { name: "Federal Medical Centre Umuahia", type: "PUBLIC_TERTIARY", state: "Abia", city: "Umuahia" },
  { name: "Federal Medical Centre Yenagoa", type: "PUBLIC_TERTIARY", state: "Bayelsa", city: "Yenagoa" },
  { name: "Federal Medical Centre Yola", type: "PUBLIC_TERTIARY", state: "Adamawa", city: "Yola" },
  { name: "National Hospital Abuja", type: "PUBLIC_TERTIARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Federal Medical Centre Bida", type: "PUBLIC_TERTIARY", state: "Niger", city: "Bida" },
  { name: "Federal Medical Centre Abakaliki", type: "PUBLIC_TERTIARY", state: "Ebonyi", city: "Abakaliki" },
];

const TEACHING_HOSPITALS: FacilitySeed[] = [
  { name: "Lagos University Teaching Hospital (LUTH)", type: "PUBLIC_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "University College Hospital (UCH) Ibadan", type: "PUBLIC_TERTIARY", state: "Oyo", city: "Ibadan" },
  { name: "University of Nigeria Teaching Hospital (UNTH) Enugu", type: "PUBLIC_TERTIARY", state: "Enugu", city: "Enugu" },
  { name: "Ahmadu Bello University Teaching Hospital (ABUTH) Zaria", type: "PUBLIC_TERTIARY", state: "Kaduna", city: "Zaria" },
  { name: "University of Benin Teaching Hospital (UBTH)", type: "PUBLIC_TERTIARY", state: "Edo", city: "Benin City" },
  { name: "Obafemi Awolowo University Teaching Hospitals Complex (OAUTHC) Ile-Ife", type: "PUBLIC_TERTIARY", state: "Osun", city: "Ile-Ife" },
  { name: "University of Abuja Teaching Hospital (UATH)", type: "PUBLIC_TERTIARY", state: "FCT Abuja", city: "Gwagwalada" },
  { name: "LAUTECH Teaching Hospital Ogbomoso", type: "PUBLIC_TERTIARY", state: "Oyo", city: "Ogbomoso" },
  { name: "Lagos State University Teaching Hospital (LASUTH)", type: "PUBLIC_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "University of Port Harcourt Teaching Hospital (UPTH)", type: "PUBLIC_TERTIARY", state: "Rivers", city: "Port Harcourt" },
  { name: "University of Calabar Teaching Hospital (UCTH)", type: "PUBLIC_TERTIARY", state: "Cross River", city: "Calabar" },
  { name: "University of Ilorin Teaching Hospital (UITH)", type: "PUBLIC_TERTIARY", state: "Kwara", city: "Ilorin" },
  { name: "Jos University Teaching Hospital (JUTH)", type: "PUBLIC_TERTIARY", state: "Plateau", city: "Jos" },
  { name: "University of Maiduguri Teaching Hospital (UMTH)", type: "PUBLIC_TERTIARY", state: "Borno", city: "Maiduguri" },
  { name: "Aminu Kano Teaching Hospital (AKTH)", type: "PUBLIC_TERTIARY", state: "Kano", city: "Kano" },
  { name: "Nnamdi Azikiwe University Teaching Hospital (NAUTH) Nnewi", type: "PUBLIC_TERTIARY", state: "Anambra", city: "Nnewi" },
  { name: "Usmanu Danfodiyo University Teaching Hospital (UDUTH) Sokoto", type: "PUBLIC_TERTIARY", state: "Sokoto", city: "Sokoto" },
];

const MAJOR_PRIVATE_HOSPITALS: FacilitySeed[] = [
  { name: "Reddington Hospital", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Lagoon Hospital", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "EKO Hospital", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "St. Nicholas Hospital", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "First Consultants Medical Centre", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Duchess International Hospital", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Evercare Hospital Lagos", type: "PRIVATE_TERTIARY", state: "Lagos", city: "Lagos" },
  { name: "Cedarcrest Hospitals", type: "PRIVATE_TERTIARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Nizamiye Hospital", type: "PRIVATE_TERTIARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Kelina Hospital", type: "PRIVATE_SECONDARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Trucare Specialist Hospital", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Havana Specialist Hospital", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Rainbow Specialist Medical Centre", type: "PRIVATE_SECONDARY", state: "Lagos", city: "Lagos" },
  { name: "Lily Hospital", type: "PRIVATE_SECONDARY", state: "Edo", city: "Benin City" },
  { name: "Memfys Hospital for Neurosurgery", type: "PRIVATE_TERTIARY", state: "Enugu", city: "Enugu" },
  { name: "Nisa Premier Hospital", type: "PRIVATE_TERTIARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Primus International Super Specialty Hospital", type: "PRIVATE_TERTIARY", state: "FCT Abuja", city: "Abuja" },
];

const FAITH_BASED_HOSPITALS: FacilitySeed[] = [
  { name: "Wesley Guild Hospital Ilesa", type: "FAITH_BASED", state: "Osun", city: "Ilesa" },
  { name: "Baptist Medical Centre Ogbomoso", type: "FAITH_BASED", state: "Oyo", city: "Ogbomoso" },
  { name: "ECWA Evangel Hospital Jos", type: "FAITH_BASED", state: "Plateau", city: "Jos" },
  { name: "Sacred Heart Hospital Lantoro Abeokuta", type: "FAITH_BASED", state: "Ogun", city: "Abeokuta" },
  { name: "Our Lady of Apostles Hospital Ibadan", type: "FAITH_BASED", state: "Oyo", city: "Ibadan" },
  { name: "St. Gerard Catholic Hospital Kaduna", type: "FAITH_BASED", state: "Kaduna", city: "Kaduna" },
  { name: "Catholic Hospital Oluyoro Ibadan", type: "FAITH_BASED", state: "Oyo", city: "Ibadan" },
  { name: "SDA Hospital Ile-Ife", type: "FAITH_BASED", state: "Osun", city: "Ile-Ife" },
  { name: "Baptist Medical Centre Saki", type: "FAITH_BASED", state: "Oyo", city: "Saki" },
  { name: "Borromeo Hospital Onitsha", type: "FAITH_BASED", state: "Anambra", city: "Onitsha" },
];

const MILITARY_HOSPITALS: FacilitySeed[] = [
  { name: "Military Hospital Lagos (68 Nigerian Army Reference Hospital Yaba)", type: "MILITARY", state: "Lagos", city: "Lagos" },
  { name: "44 Nigerian Army Reference Hospital Kaduna", type: "MILITARY", state: "Kaduna", city: "Kaduna" },
  { name: "Defence Reference Hospital Abuja", type: "MILITARY", state: "FCT Abuja", city: "Abuja" },
  { name: "Nigerian Navy Reference Hospital Lagos", type: "MILITARY", state: "Lagos", city: "Lagos" },
  { name: "Nigerian Air Force Hospital Abuja", type: "MILITARY", state: "FCT Abuja", city: "Abuja" },
  { name: "7 Division Hospital Maiduguri", type: "MILITARY", state: "Borno", city: "Maiduguri" },
];

async function seed() {
  const allFacilities = [
    ...FEDERAL_MEDICAL_CENTRES,
    ...TEACHING_HOSPITALS,
    ...MAJOR_PRIVATE_HOSPITALS,
    ...FAITH_BASED_HOSPITALS,
    ...MILITARY_HOSPITALS,
  ];

  console.log(`Seeding ${allFacilities.length} hospitals...`);

  let created = 0;
  let skipped = 0;

  for (const facility of allFacilities) {
    const slug = slugify(facility.name);

    // Check if already exists
    const existing = await prisma.cadreFacility.findUnique({
      where: { slug },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.cadreFacility.create({
      data: {
        name: facility.name,
        slug,
        type: facility.type,
        state: facility.state,
        city: facility.city,
      },
    });

    created++;
  }

  console.log(`Done. Created: ${created}, Skipped (already exists): ${skipped}`);
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
