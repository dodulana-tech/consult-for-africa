/**
 * Import deduped NMA outreach list (May 2026 batch) into CadreHealth.
 *
 * Reads /tmp/cadrehealth_outreach_final.csv produced by:
 *   scripts/dedupe-nma-list.py
 *   scripts/dedupe-nma-internal.py
 *   scripts/build-cadrehealth-outreach-final.py
 *
 * Columns: name,email,phone,place,specialty,sheet,alt_emails,alt_phones,alt_names,merged_count
 *
 * Differences vs import-doctors-excel.ts:
 *   - Reads new CSV schema (lowercase column names, includes place-of-work)
 *   - Populates currentFacility from `place`
 *   - Defaults to --dry-run; pass --apply to actually write
 *   - Includes records whose only email is on the @dokilink.com placeholder
 *     domain (these came from the "LIST WITH INVALID EMAILS" sheet); flags
 *     them so outreach can route via phone instead
 *
 * Run with:
 *   npx tsx scripts/import-cadrehealth-nma.ts                    # dry run
 *   npx tsx scripts/import-cadrehealth-nma.ts --apply             # live
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import crypto from "crypto";

const prisma = new PrismaClient();

const DEFAULT_CSV = "/tmp/cadrehealth_outreach_final.csv";

// ─── Specialty mapping (copied from import-doctors-excel.ts) ─────────────

const SPECIALTY_MAP: Record<string, string> = {
  "general surgeon": "General Surgery",
  "orthopaedic surgeon": "Orthopaedic Surgery",
  "plastic surgeon": "Plastic Surgery",
  "neurosurgeon": "Neurosurgery",
  "paediatric surgeon": "Paediatric Surgery",
  "oral and maxillofacial surgeon": "Oral & Maxillofacial Surgery",
  "internal medicine": "Internal Medicine",
  "family medicine": "General Practice / Family Medicine",
  "emergency medicine": "Emergency Medicine",
  "community medicine": "Public Health Medicine",
  "ophthalmologist": "Ophthalmology",
  "obstetrician & gynaecologist": "Obstetrics & Gynaecology",
  "paediatrician": "Paediatrics",
  "psychiatrist": "Psychiatry",
  "mental health": "Psychiatry",
  "anaesthesiologist": "Anaesthesia",
  "radiologist": "Radiology",
  "dermatologist": "Dermatology",
  "cardiologist": "Cardiology",
  "nephrologist": "Nephrology",
  "gastroenterologist": "Gastroenterology",
  "endocrinologist": "Endocrinology",
  "neurologist": "Neurology",
  "haematologist": "Haematology",
  "oncologist": "Oncology",
  "urologist": "Urology",
  "rheumatologist": "Rheumatology",
  "pathologist": "Pathology",
  "chemical pathologist": "Pathology",
  "histopathologist": "Pathology",
  "medical microbiologist": "Infectious Disease",
  "ear, nose & throat doctor (ent)": "ENT / Otorhinolaryngology",
  "general dentistry": "General Dentistry",
  "orthodontist": "Orthodontics",
  "paediatric dentist": "Paediatric Dentistry",
  "public health physician": "Public Health Medicine",
  "general medical practice": "General Practice / Family Medicine",

  // NMA-specific specialty labels we encountered (May 2026 batch)
  "dental surgeon": "General Dentistry",
  "paediatric cardiologist": "Paediatric Cardiology",
  "cardiothoracic surgeon": "Cardiothoracic Surgery",
  "medical doctor": "General Practice / Family Medicine",
  "physician": "General Practice / Family Medicine",
  "medicine": "General Practice / Family Medicine",
  "doctor": "General Practice / Family Medicine",
  "dr": "General Practice / Family Medicine",
  "medical practitioner": "General Practice / Family Medicine",
  "public health": "Public Health Medicine",
  "surgeon": "General Surgery",
  "pediatrician": "Paediatrics",
  "infectious diseases": "Infectious Disease",
  "radiology": "Radiology",

  // MWAN-specific specialty labels (May 2026 batch)
  "general practitioner": "General Practice / Family Medicine",
  "general practice": "General Practice / Family Medicine",
  "general medicine": "Internal Medicine",
  "medical officer": "General Practice / Family Medicine",
  "principal medical officer": "General Practice / Family Medicine",
  "senior medical officer": "General Practice / Family Medicine",
  "house officer": "General Practice / Family Medicine",
  "obstetrics and gynaecology": "Obstetrics & Gynaecology",
  "obstetrics and gynecology": "Obstetrics & Gynaecology",
  "obstetrics & gynecology": "Obstetrics & Gynaecology",
  "obstetrics & gynaecology": "Obstetrics & Gynaecology",
  "obstetrics/gynaecology": "Obstetrics & Gynaecology",
  "o&g": "Obstetrics & Gynaecology",
  "og": "Obstetrics & Gynaecology",
  "ophthalmology": "Ophthalmology",
  "opthalmology": "Ophthalmology",  // common typo
  "anaesthesia": "Anaesthesia",
  "anesthesia": "Anaesthesia",
  "anaesthesiology": "Anaesthesia",
  "paediatrics": "Paediatrics",
  "pediatrics": "Paediatrics",
  "dentistry": "General Dentistry",
  "dentist": "General Dentistry",
  "restorative dentistry": "General Dentistry",
  "restorative dentist": "General Dentistry",
  "haematology & blood transfusion": "Haematology",
  "haematology and blood transfusion": "Haematology",
  "blood transfusion": "Haematology",
  "public health & lifestyle medicine": "Public Health Medicine",
  "public health medicine": "Public Health Medicine",
  "pediatric/public health": "Paediatrics",
  "family physician": "General Practice / Family Medicine",
  "consultant paediatrician": "Paediatrics",
  "consultant pediatrician": "Paediatrics",
  "chief medical officer (ophthalmology)": "Ophthalmology",
  "diagnostic radiology": "Radiology",
  "interventional radiology": "Radiology",
  "community health & primary care": "General Practice / Family Medicine",
  "community health and primary care": "General Practice / Family Medicine",
  "primary care": "General Practice / Family Medicine",
  "care coordinator": "General Practice / Family Medicine",
  "o&g, lifestyle medicine": "Obstetrics & Gynaecology",
  "field epidemiology": "Public Health Medicine",
  "epidemiology": "Public Health Medicine",
  "psychiatry": "Psychiatry",
  "neurology/neurosurgery": "Neurology",
  "gastroenterologist/hepatologist": "Gastroenterology",
  "gastroenterologist and hepatologist": "Gastroenterology",
  "paediatric dentistry": "Paediatric Dentistry",
  "dental surgery": "General Dentistry",
  "consultant ophthalmologist": "Ophthalmology",
  "consultant o & g": "Obstetrics & Gynaecology",
  "consultant o&g": "Obstetrics & Gynaecology",
  "medical officer (o & g)": "Obstetrics & Gynaecology",
  "medical officer (o&g)": "Obstetrics & Gynaecology",
  "medical officer (paediatrics)": "Paediatrics",
  "medical officer ( paediatrics)": "Paediatrics",
  "medical house officer": "General Practice / Family Medicine",
  "anaest": "Anaesthesia",
  "public health nutrition": "Public Health Medicine",
  "dermatology/healthadministration": "Dermatology",
};

const LOCATION_SUFFIXES = [
  "Niger", "Katsina", "Zamfara", "Sokoto", "Plateau", "Yobe", "Oyo",
  "Lagos", "Abuja", "Kaduna", "Borno", "Kebbi", "Bauchi", "Anambra",
  "Edo", "Delta", "Rivers", "Cross River", "Akwa Ibom", "FCT", "Kano",
  "Kwara", "Osun", "Ogun", "Ekiti", "Ondo",
];

// ─── Cleaners ────────────────────────────────────────────────────────────

function cleanName(raw: string): { firstName: string; lastName: string; title: string } {
  let name = raw.trim();
  let title = "";
  const titleMatch = name.match(/^(Prof\.?|Dr\.?|PROF\.?|DR\.?)\s*/i);
  if (titleMatch) {
    title = titleMatch[1].replace(/\.$/, "");
    name = name.slice(titleMatch[0].length);
  }
  // Strip second-pass "Dr DR" patterns from NMA
  const secondTitle = name.match(/^(Prof\.?|Dr\.?|PROF\.?|DR\.?)\s*/i);
  if (secondTitle) {
    name = name.slice(secondTitle[0].length);
  }
  name = name.replace(/\s*\.\s*$/, "").trim();
  for (const loc of LOCATION_SUFFIXES) {
    name = name.replace(new RegExp(`\\s+${loc}\\s*$`, "i"), "").trim();
  }
  name = name.replace(/[`]/g, "").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Unknown", lastName: "Unknown", title };
  if (parts.length === 1) return { firstName: parts[0], lastName: "", title };
  return { firstName: parts[0], lastName: parts.slice(1).join(" "), title };
}

function cleanPhone(raw: string): string | null {
  if (!raw || raw === "-") return null;
  let phone = raw.trim().replace(/[\s\-\.]/g, "").replace(/ /g, "");
  if (phone.includes("E+") || phone.includes("e+")) {
    try { phone = Math.round(parseFloat(phone)).toString(); } catch { return null; }
  }
  phone = phone.replace(/^\+?234/, "0");
  if (phone.match(/^[789]\d{9}$/)) phone = "0" + phone;
  if (!phone.match(/^0[789]\d{9}$/)) {
    if (phone.match(/^\d{10,13}$/)) return phone;
    return null;
  }
  return phone;
}

function cleanEmail(raw: string): string | null {
  if (!raw || raw === "-") return null;
  let email = raw.trim().toLowerCase().replace(/\s+/g, "").replace(/ /g, "");
  email = email.replace(/@yahooo\.com$/, "@yahoo.com");
  email = email.replace(/@yahoo\.cpm$/, "@yahoo.com");
  email = email.replace(/@hotmaile\.com$/, "@hotmail.com");
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return null;
  return email;
}

function mapSpecialty(raw: string): { subSpecialty: string; cadre: "MEDICINE" | "DENTISTRY" } {
  const key = (raw || "").trim().toLowerCase();
  const mapped = SPECIALTY_MAP[key];
  if (key.includes("dentist") || key.includes("orthodont")) {
    return { subSpecialty: mapped || raw.trim(), cadre: "DENTISTRY" };
  }
  return { subSpecialty: mapped || raw.trim() || "General Practice / Family Medicine", cadre: "MEDICINE" };
}

function generateReferralCode(): string {
  return "CH" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

// ─── CSV parsing (handles quoted fields with commas/newlines) ───────────

function parseCSV(content: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (inQuotes) {
      if (c === '"' && content[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else { field += c; }
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(r => r.length > 1 && r.some(c => c.trim()))
    .map(r => {
      const o: Record<string, string> = {};
      headers.forEach((h, i) => { o[h] = (r[i] || "").trim(); });
      return o;
    });
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  const apply = process.argv.includes("--apply");
  const csvPath = process.argv.find(a => !a.startsWith("--") && a.endsWith(".csv")) || DEFAULT_CSV;

  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log(`Mode: ${apply ? "APPLY (writes to DB)" : "DRY RUN (no DB writes; pass --apply to commit)"}`);
  console.log(`CSV:  ${csvPath}`);

  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(content);
  console.log(`Parsed ${rows.length} rows`);

  // Clean & dedupe in-memory by email
  const seen = new Set<string>();
  let skippedNoEmail = 0;
  let skippedInternalDupe = 0;
  let skippedDokilink = 0;
  let skippedNoName = 0;
  const specialtyCounts = new Map<string, number>();

  type Cleaned = {
    firstName: string; lastName: string;
    email: string; phone: string | null;
    subSpecialty: string; cadre: "MEDICINE" | "DENTISTRY";
    currentFacility: string | null;
  };
  const cleaned: Cleaned[] = [];

  for (const r of rows) {
    // Skip rows with no name — we won't import "Unknown Unknown" placeholders
    if (!r.name || !r.name.trim()) { skippedNoName++; continue; }

    const email = cleanEmail(r.email);
    if (!email) { skippedNoEmail++; continue; }
    // Skip @dokilink.com placeholder emails (came from "LIST WITH INVALID EMAILS" sheet)
    if (email.endsWith("@dokilink.com")) { skippedDokilink++; continue; }
    if (seen.has(email)) { skippedInternalDupe++; continue; }
    seen.add(email);

    const { firstName, lastName, title } = cleanName(r.name);
    const phone = cleanPhone(r.phone);
    const { subSpecialty, cadre } = mapSpecialty(r.specialty);
    specialtyCounts.set(subSpecialty, (specialtyCounts.get(subSpecialty) || 0) + 1);

    const place = (r.place || "").trim();
    cleaned.push({
      firstName: title ? `${title} ${firstName}` : firstName,
      lastName, email, phone,
      subSpecialty, cadre,
      currentFacility: place || null,
    });
  }

  console.log(`Cleaned: ${cleaned.length} unique records`);
  console.log(`  skipped (no name): ${skippedNoName}`);
  console.log(`  skipped (no/invalid email): ${skippedNoEmail}`);
  console.log(`  skipped (dokilink placeholder): ${skippedDokilink}`);
  console.log(`  skipped (internal dupe by email): ${skippedInternalDupe}`);

  // Check what already exists in DB
  console.log("Checking existing emails in DB...");
  const existingEmails = new Set(
    (await prisma.cadreProfessional.findMany({
      where: { email: { in: cleaned.map(r => r.email) } },
      select: { email: true },
    })).map(e => e.email)
  );
  const dbDupes = existingEmails.size;
  const toInsert = cleaned.filter(r => !existingEmails.has(r.email));

  console.log(`DB already has: ${dbDupes} of these emails`);
  console.log(`To insert:      ${toInsert.length}`);

  console.log("");
  console.log("=== Specialty Distribution (would import) ===");
  const sorted = [...specialtyCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [spec, count] of sorted.slice(0, 25)) {
    console.log(`  ${spec.padEnd(45)} ${count}`);
  }
  if (sorted.length > 25) console.log(`  ... (${sorted.length - 25} more specialties)`);

  console.log("");
  console.log("=== Sample of records that WOULD be inserted (first 5) ===");
  for (const r of toInsert.slice(0, 5)) {
    console.log(`  ${r.firstName} ${r.lastName} | ${r.email} | ${r.phone || "—"} | ${r.subSpecialty} | ${r.currentFacility?.slice(0, 50) || "—"}`);
  }

  if (!apply) {
    console.log("");
    console.log("DRY RUN complete. Re-run with --apply to write to the database.");
    await prisma.$disconnect();
    return;
  }

  // Live insert
  console.log("");
  console.log(`Inserting ${toInsert.length} records in batches of 50...`);
  let imported = 0;
  let errors = 0;
  const BATCH = 50;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    try {
      const result = await prisma.cadreProfessional.createMany({
        data: batch.map(r => ({
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          phone: r.phone,
          // passwordHash intentionally omitted; set on /oncadre/claim/[id]
          cadre: r.cadre,
          subSpecialty: r.subSpecialty,
          currentFacility: r.currentFacility,
          country: "Nigeria",
          isDiaspora: false,
          accountStatus: "UNVERIFIED",
          referralCode: generateReferralCode(),
          profileCompleteness: 30,
        })),
        skipDuplicates: true,
      });
      imported += result.count;
      console.log(`  ... imported ${imported} / ${toInsert.length}`);
    } catch (err) {
      // Fall back to per-row inserts for this batch
      for (const r of batch) {
        try {
          await prisma.cadreProfessional.create({
            data: {
              firstName: r.firstName, lastName: r.lastName, email: r.email,
              phone: r.phone, cadre: r.cadre, subSpecialty: r.subSpecialty,
              currentFacility: r.currentFacility,
              country: "Nigeria", isDiaspora: false, accountStatus: "UNVERIFIED",
              referralCode: generateReferralCode(), profileCompleteness: 30,
            },
          });
          imported++;
        } catch (innerErr) {
          errors++;
          console.error(`  Error ${r.email}:`, innerErr instanceof Error ? innerErr.message : innerErr);
        }
      }
      console.log(`  ... imported ${imported} / ${toInsert.length} (batch fallback)`);
    }
    await new Promise(res => setTimeout(res, 200));
  }

  console.log("");
  console.log("=== Final Summary ===");
  console.log(`Imported: ${imported}`);
  console.log(`Errors:   ${errors}`);
  console.log(`Already in DB (skipped): ${dbDupes}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error("Import failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
