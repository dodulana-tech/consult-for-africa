/**
 * Import healthcare professionals from Debo's databases into CadreHealth.
 * Strict deduplication by name, email, and phone.
 * Maps specialties to CadreHealth cadres.
 *
 * Run: npx ts-node --compiler-options '{"module":"CommonJS","strict":false}' scripts/import-professionals.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RawProfessional {
  name: string;
  specialty: string;
  email?: string;
  phone?: string;
  isFellow?: boolean;
}

// Normalize phone to +234 format
function normalizePhone(phone?: string): string | null {
  if (!phone) return null;
  let p = phone.replace(/\D/g, "");
  if (p.length === 11 && p.startsWith("0")) p = "234" + p.slice(1);
  if (p.length === 10 && !p.startsWith("0")) p = "234" + p;
  if (!p.startsWith("234")) return null;
  return "+" + p;
}

// Normalize email
function normalizeEmail(email?: string): string | null {
  if (!email) return null;
  const e = email.trim().toLowerCase().replace(/\s/g, "");
  if (!e.includes("@")) return null;
  return e;
}

// Map specialty to CadreHealth cadre
function mapCadre(specialty: string): string {
  const s = specialty.toLowerCase();

  // Medicine specialties
  if (s.includes("surgery") || s.includes("surgical") || s.includes("ortho") || s.includes("neuro") && s.includes("surg")
    || s.includes("plastic") || s.includes("burns") || s.includes("cardiothoracic") || s.includes("ctsu")
    || s.includes("urol")) return "MEDICINE";
  if (s.includes("cardiol")) return "MEDICINE";
  if (s.includes("neurol") && !s.includes("surg")) return "MEDICINE";
  if (s.includes("nephrol")) return "MEDICINE";
  if (s.includes("endocrin") || s.includes("diabet")) return "MEDICINE";
  if (s.includes("dermat")) return "MEDICINE";
  if (s.includes("pulmon") || s.includes("respiratory")) return "MEDICINE";
  if (s.includes("gastro")) return "MEDICINE";
  if (s.includes("rheumat")) return "MEDICINE";
  if (s.includes("haemato") || s.includes("hematol") || s.includes("blood")) return "MEDICINE";
  if (s.includes("oncol")) return "MEDICINE";
  if (s.includes("anaesth") || s.includes("pain")) return "MEDICINE";
  if (s.includes("obstet") || s.includes("gynae") || s.includes("gynec") || s.includes("o&g") || s.includes("maternal")) return "MEDICINE";
  if (s.includes("paediatr") || s.includes("pediatr") || s.includes("neonat")) return "MEDICINE";
  if (s.includes("emergency")) return "MEDICINE";
  if (s.includes("family medicine")) return "MEDICINE";
  if (s.includes("physician") || s.includes("internal medicine") || s.includes("medicine")) return "MEDICINE";
  if (s.includes("microbiol")) return "MEDICINE";
  if (s.includes("pathol")) return "MEDICINE";
  if (s.includes("radiolog") || s.includes("radiotherap")) return "RADIOGRAPHY_IMAGING";
  if (s.includes("ophthalm") || s.includes("opthalm") || s.includes("glaucoma") || s.includes("retina") || s.includes("retin")) return "OPTOMETRY";

  // Psychiatry
  if (s.includes("psychiat") || s.includes("neuropsych")) return "PSYCHOLOGY_SOCIAL_WORK";

  // Dentistry
  if (s.includes("dent") || s.includes("orthodon") || s.includes("periodon") || s.includes("oral") || s.includes("maxillofac")) return "DENTISTRY";

  // Community/Public Health
  if (s.includes("community health") || s.includes("public health") || s.includes("epidemiol") || s.includes("preventive")) return "PUBLIC_HEALTH";

  // Pharmacy
  if (s.includes("pharmac")) return "PHARMACY";

  // Lab
  if (s.includes("laborator") || s.includes("lab sci")) return "MEDICAL_LABORATORY_SCIENCE";

  // Physiotherapy
  if (s.includes("physiother") || s.includes("rehab")) return "REHABILITATION_THERAPY";

  // Default
  return "MEDICINE";
}

// Extract first and last name from "Dr. Firstname Lastname" or "Dr Lastname"
function parseName(raw: string): { firstName: string; lastName: string } {
  let name = raw.replace(/^(Dr\.?\s*|Prof\.?\s*|Fellow\s*)/i, "").trim();
  // Remove trailing underscores etc
  name = name.replace(/_/g, " ").replace(/\s+/g, " ").trim();

  const parts = name.split(" ");
  if (parts.length === 1) {
    return { firstName: "", lastName: parts[0] };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

// ─── DATA ───────────────────────────────────────────────────────────────────

const LIST_1: RawProfessional[] = [
  { name: "Dr. Adediran Adewunmi", specialty: "Haemato-pathologist", email: "adediranadewunmi@yahoo.com" },
  { name: "Dr. Adesoji Ademuyiwa", specialty: "Paediatric Surgery", email: "adesojiademuyiwa@yahoo.co.uk" },
  { name: "Dr. Adenekan Adetunji Olusesan", specialty: "Vitero-Retin", email: "trielkin@yahoo.com" },
  { name: "Dr. Wasiu Lanre Adeyemo", specialty: "Oral and Maxillofacial Surgery" },
  { name: "Dr. Bosede Bukola Afolabi", specialty: "Obstetrics & Gynaecology", phone: "8023154064" },
  { name: "Dr. Afolayan Micheal Olatunji", specialty: "General Surgery", phone: "8023133417" },
  { name: "Dr. Agabi Paul Osigwe", specialty: "Neurology", phone: "7081716110" },
  { name: "Dr. Olatunji F. Aina", specialty: "Psychiatry" },
  { name: "Dr. Ajuluchukwu Janet Ngozi", specialty: "Adult Cardiology" },
  { name: "Dr. Akanmu Alani Sulaimon", specialty: "Haematology and Blood Transfusion" },
  { name: "Dr. Akanmu Olarewaju", specialty: "Pain Management and Critical Care", email: "lanreakanmu@gmail.com" },
  { name: "Dr. Akinajo Opeyemi Rebecca", specialty: "Obstetrics & Gynaecology", email: "opeyemiakinajo@gmail.com" },
  { name: "Dr. Akinkugbe Ayesha", specialty: "Dermatology", email: "ahseya68@yahoo.com" },
  { name: "Dr. Akinmokun Olasode Isreal", specialty: "Trauma and Orthopaedic Surgery", phone: "8023173140" },
  { name: "Dr. Akujobi Henry", specialty: "Family Medicine", email: "henryakujobi@yahoo.com" },
  { name: "Dr. Rose I. Anorlu", specialty: "Gynaecologic Oncology" },
  { name: "Dr. Adetola Olubunmi Daramola", specialty: "Anatomic Pathology" },
  { name: "Dr. Ayanlowo Olusola", specialty: "Dermatology", email: "solayan14@gmail.com" },
  { name: "Dr. Balogun Mobolanle R.", specialty: "Community Health", email: "mbalogun@cmul.edu.ng" },
  { name: "Dr. Ebun Ladipo Bamgboye", specialty: "Nephrology" },
  { name: "Dr. Olufemi B. Bankole", specialty: "Neurosurgery", email: "f_baba@yahoo.com", phone: "8033012042" },
  { name: "Dr. Chris Bode", specialty: "Paediatric Surgery", email: "cobode@yahoo.com" },
  { name: "Dr. Gbemisola O. Boyede", specialty: "Neurodevelopmental Paediatrics", phone: "7082703376" },
  { name: "Dr. Elizabeth Adebola Campbell", specialty: "Psychiatry" },
  { name: "Dr. Danesi Mustapha Abudu", specialty: "Neurology" },
  { name: "Dr. Ibironke Desalu", specialty: "Anaesthesia" },
  { name: "Dr. M. G. Dania", specialty: "Respiratory Physician" },
  { name: "Dr. Iretioluwa Fajolu", specialty: "Paediatrics/Neonatology" },
  { name: "Dr. Elebute Olumide", specialty: "Paediatric Surgery", email: "doctoroae@gmail.com" },
  { name: "Dr. Chris Esezobor", specialty: "Paediatrics", phone: "8058440582" },
  { name: "Dr. Olutola Mary Eweka", specialty: "Oral Medicine", email: "tolaeweka@yahoo.com" },
  { name: "Dr. Chinyere Ezeaka", specialty: "Paediatrics/Neonatology" },
  { name: "Dr. Ezenwa Beatrice", specialty: "Paediatrics/Neonatology" },
  { name: "Dr. Babatunde Fadipe", specialty: "Neuropsychiatry" },
  { name: "Dr. Yetunde Fadipe", specialty: "Family Medicine", email: "yettyfadipe@gmail.com" },
  { name: "Dr. Fatiregun Olamijulo Adedeji", specialty: "Psychiatry" },
  { name: "Dr. Olufemi Fasanmade", specialty: "Diabetology and Internal Medicine", phone: "8070591188" },
  { name: "Dr. Layi Giwa", specialty: "Orthopaedics" },
  { name: "Dr. Ilo Olubanke Theodora", specialty: "Ophthalmology", email: "tedbanky@gmail.com" },
  { name: "Dr. Micheal C. Isiekwe", specialty: "Orthodontics" },
  { name: "Dr. Irurhe Nicholas Kayode", specialty: "Radiology", email: "nick3irurhe@gmail.com" },
  { name: "Dr. Ladipo-Ajayi Oluwaseun", specialty: "Paediatric Surgery", email: "yawy2@yahoo.com" },
  { name: "Dr. Lawal Abdulrazzaq", specialty: "Breast & Endocrine Surgery", email: "razzaklawal@gmail.com", phone: "8082336029" },
  { name: "Dr. Bolaji Mofikoya", specialty: "Plastic Surgery", email: "bmofikoya@gmail.com", phone: "8023016425" },
  { name: "Dr. Nebe Juliet Nwamaka", specialty: "Family Medicine", email: "amakanebe@yahoo.com" },
  { name: "Dr. Odeniyi Ifedayo Adeola", specialty: "Endocrinology", phone: "8023169004" },
  { name: "Dr. Olabisi Hajarat Oderinu", specialty: "Dental Surgery", email: "bisioderinu@yahoo.co.uk" },
  { name: "Dr. Raphael Emeka Ogbolu", specialty: "Psychiatry" },
  { name: "Dr. Olasuruboni K. Ogedengbe", specialty: "Obstetrics & Gynaecology" },
  { name: "Dr. Ogunleye Ezekiel Olayiwola", specialty: "Cardiothoracic Surgery" },
  { name: "Dr. Folashade T. Ogunsola", specialty: "Medical Microbiology" },
  { name: "Dr. Rufus Ojewola", specialty: "Urology", email: "rwaleojewola@yahoo.com", phone: "8035448878" },
  { name: "Dr. Ojini Francis Ibe", specialty: "Neurology", email: "fojini@yahoo.co.uk", phone: "8023173373" },
  { name: "Dr. Ojo Oluwadamilola Omolara", specialty: "Movement Disorders", email: "olujo@unilag.edu.ng", phone: "8033606414" },
  { name: "Dr. Omotayo Abimbola Ojo", specialty: "Neurosurgery", phone: "8033922181" },
  { name: "Dr. Christy An Okoromah", specialty: "Paediatric Cardiology" },
  { name: "Dr. Kehinde S. Okunade", specialty: "Obstetrics & Gynaecology" },
  { name: "Dr. Okusanya Babasola O.", specialty: "Obstetrics & Gynaecology" },
  { name: "Dr. Andrew Toyin Olagunju", specialty: "Psychiatry", email: "andyolagus@yahoo.com" },
  { name: "Dr. Olajide Thomas Olagboyega", specialty: "General Surgery", email: "seyiolajide@gmail.com" },
  { name: "Dr. Olubukola Olatosi", specialty: "Paediatric Dentistry" },
  { name: "Dr. Olurotimi Olojede", specialty: "Oral Surgery" },
  { name: "Dr. Olowoselu Festus Olusola", specialty: "Bone Marrow Transplant", email: "solifes@yahoo.com" },
  { name: "Dr. Olufunlayo Tolulope Florence", specialty: "Community Health", email: "tosisanya@yahoo.com", phone: "8023218162" },
  { name: "Dr. Akinsanya Daniel Oluwasegun", specialty: "Cardiology", phone: "8033471659" },
  { name: "Dr. Omisakin", specialty: "Obstetrics and Gynaecology", email: "omishb@yahoo.co.uk", phone: "8177511423" },
  { name: "Dr. Omolola Olubonmi Orenuga", specialty: "Paediatric Dentistry" },
  { name: "Dr. Akin Osibogun", specialty: "Public Health & Epidemiology" },
  { name: "Dr. Oshodi Temitope Adesola", specialty: "Medical Microbiology" },
  { name: "Dr. Boniface Adedeji Oye-Adeniran", specialty: "Maternal Medicine/Reproductive Health" },
  { name: "Dr. Elizabeth Eberchi Oyenusi", specialty: "Paediatric Endocrinology", email: "ebikike@yahoo.com" },
  { name: "Dr. Obianuju Ozoh", specialty: "Pulmonology" },
  { name: "Dr. Oluwatosin O. Sanu", specialty: "Orthodontics" },
  { name: "Dr. Seyi-Olajide Justina O.", specialty: "Pediatric Surgery", email: "justinaseyiolajide@yahoo.com", phone: "8027107187" },
  { name: "Dr. Sofola Oyinkansola", specialty: "Preventive and Community Dentistry" },
  { name: "Dr. Kehinde Habbeb Tijani", specialty: "Urological Surgery" },
  { name: "Dr. Andrew O. Ugburo", specialty: "Plastic Surgery", email: "andyugburo@yahoo.com" },
  { name: "Dr. Umeh Oyinye Dorothy", specialty: "Orthodontics" },
  { name: "Dr. Umeizudike Kehinde Adesola", specialty: "Periodontology", email: "kumeiz09@gmail.com" },
  { name: "Dr. Donna Umesi", specialty: "Restorative Dentistry" },
  { name: "Dr. Yakubu Caleb", specialty: "Radiology", email: "ckelllyakubu@gmail.com" },
  { name: "Dr. Roberts Alero", specialty: "Community Health", email: "aaroberts@cmul.edu.ng", phone: "8033083071" },
  { name: "Dr. Habeebu", specialty: "Radiotherapy", phone: "8181970036" },
  { name: "Prof. Mbakwem", specialty: "Adult Cardiology", phone: "8023033675" },
  { name: "Dr. Olugbemi", specialty: "Cardiothoracic Surgery", phone: "8082550192" },
  { name: "Dr. Ohazurike", specialty: "Obstetrics & Gynaecology", phone: "8037051800" },
  { name: "Dr. Peter", specialty: "Psychiatry", phone: "8057886636" },
  { name: "Dr. Osinowo", specialty: "General Surgery", phone: "8023120260" },
  { name: "Dr. Alabi", specialty: "Orthopaedics", phone: "8056579425" },
  { name: "Dr. Adewunmi", specialty: "Emergency Medicine", phone: "8069433629" },
  { name: "Dr. Osinaike", specialty: "Paediatric Dermatology", phone: "8099099345" },
  { name: "Dr. Olopade", specialty: "Adult Endocrinology" },
];

const LIST_2: RawProfessional[] = [
  { name: "Dr. Njokanma", specialty: "General Surgery", phone: "8023713351" },
  { name: "Dr. Badmus", specialty: "Urology", phone: "8028867016" },
  { name: "Dr. Idowu", specialty: "Orthopedics", phone: "8035796523", isFellow: true },
  { name: "Dr. Abdulsalam", specialty: "Paediatric Surgery", phone: "8063691919" },
  { name: "Dr. Owelarate", specialty: "Cardiothoracic Surgery", phone: "8063131783" },
  { name: "Dr. Adesina", specialty: "Burns and Plastic Surgery", phone: "8096505927" },
  { name: "Dr. Omosebi Taiwo", specialty: "Plastic Surgery", phone: "8034061362", isFellow: true },
  { name: "Dr. Ayodele", specialty: "Neurosurgery", phone: "8037483045" },
  { name: "Dr. Eke", specialty: "General Surgery", phone: "8033292859", isFellow: true },
  { name: "Dr. Abolarinura", specialty: "Urology", phone: "8033292473", isFellow: true },
  { name: "Dr. Mbajah", specialty: "Cardiothoracic Surgery", phone: "9023348362", isFellow: true },
  { name: "Dr. Faboya", specialty: "Paediatric Surgery", isFellow: true },
  { name: "Dr. Kila", specialty: "Pathology", phone: "7033451859", isFellow: true },
  { name: "Dr. Ojo", specialty: "Respiratory Medicine", phone: "8038344342", isFellow: true },
  { name: "Dr. Temi Nwakpele", specialty: "Paediatrics", phone: "8033339579" },
  { name: "Dr. Akinola", specialty: "Paediatrics", phone: "8033159884", isFellow: true },
  { name: "Dr. Ebuane", specialty: "Paediatrics", phone: "8085645675", isFellow: true },
  { name: "Dr. Shittu", specialty: "Obstetrics & Gynaecology", phone: "8173171436" },
  { name: "Dr. Adedeji", specialty: "Obstetrics & Gynaecology", phone: "8034046962", isFellow: true },
  { name: "Dr. Moore", specialty: "Obstetrics & Gynaecology", phone: "7087871062" },
  { name: "Dr. Ajibare", specialty: "Cardiology", phone: "8033251010", isFellow: true },
  { name: "Dr. Okunuga", specialty: "Cardiology", phone: "8063501091" },
  { name: "Dr. Soaga", specialty: "Cardiology", phone: "8077579442" },
  { name: "Dr. Williams", specialty: "Endocrinology", phone: "8092409336" },
  { name: "Dr. Folakemi Cole", specialty: "Dermatology", phone: "8037133139" },
  { name: "Dr. Gold", specialty: "Dermatology", phone: "8036675193", isFellow: true },
  { name: "Dr. Ekere", specialty: "Gastroenterology", phone: "8036213233", isFellow: true },
  { name: "Dr. Arabambi", specialty: "Neurology", phone: "8033959860" },
  { name: "Dr. Olaniyan", specialty: "Neurology", phone: "7038490860" },
  { name: "Dr. Olaosebikan", specialty: "Rheumatology", phone: "8035751154", isFellow: true },
  { name: "Dr. Akinsiku", specialty: "Nephrology", phone: "8023264549", isFellow: true },
];

async function main() {
  console.log("Importing healthcare professionals into CadreHealth...\n");

  const allRaw = [...LIST_1, ...LIST_2];
  console.log(`Total raw entries: ${allRaw.length}`);

  // Dedup tracking
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  const seenNames = new Set<string>(); // normalized last name as fallback
  let skippedDupe = 0;
  let skippedNoContact = 0;
  let created = 0;
  let existedInDb = 0;

  for (const raw of allRaw) {
    const { firstName, lastName } = parseName(raw.name);
    const email = normalizeEmail(raw.email);
    const phone = normalizePhone(raw.phone);
    const cadre = mapCadre(raw.specialty);
    const nameKey = lastName.toLowerCase().replace(/[^a-z]/g, "");

    // Skip entries with no usable contact info AND no meaningful name
    if (!email && !phone && !firstName && nameKey.length < 3) {
      skippedNoContact++;
      continue;
    }

    // Deduplicate within this import batch
    let isDupe = false;

    if (email && seenEmails.has(email)) { isDupe = true; }
    if (phone && seenPhones.has(phone)) { isDupe = true; }
    // Name-based dedup: if same last name and same specialty, likely same person
    const nameSpecKey = nameKey + ":" + cadre;
    if (nameKey.length >= 4 && seenNames.has(nameSpecKey)) { isDupe = true; }

    if (isDupe) {
      skippedDupe++;
      continue;
    }

    // Mark as seen
    if (email) seenEmails.add(email);
    if (phone) seenPhones.add(phone);
    if (nameKey.length >= 4) seenNames.add(nameSpecKey);

    // Check if already exists in DB by email or phone
    if (email) {
      const existing = await prisma.cadreProfessional.findUnique({ where: { email } });
      if (existing) {
        existedInDb++;
        continue;
      }
    }
    if (phone) {
      const existing = await prisma.cadreProfessional.findFirst({ where: { phone } });
      if (existing) {
        existedInDb++;
        continue;
      }
    }

    // Create the professional
    const useEmail = email || `imported.${nameKey}.${Date.now()}@cadrehealth.imported`;

    await prisma.cadreProfessional.create({
      data: {
        firstName: firstName || "",
        lastName: lastName || raw.name.replace(/^(Dr\.?\s*|Prof\.?\s*)/i, "").trim(),
        email: useEmail,
        phone: phone || null,
        cadre: cadre as any,
        accountStatus: "IMPORTED",
        subSpecialty: raw.specialty,
      },
    });
    created++;
  }

  console.log(`\nResults:`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (duplicate in batch): ${skippedDupe}`);
  console.log(`  Skipped (already in DB): ${existedInDb}`);
  console.log(`  Skipped (no contact info): ${skippedNoContact}`);
  console.log(`  Total processed: ${allRaw.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
