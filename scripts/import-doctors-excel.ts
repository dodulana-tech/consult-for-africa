/**
 * Import specialist doctors from the Excel/CSV data into CadreHealth.
 *
 * Expected CSV format: S/No, Full Name, Email, Phone, Specialty
 *
 * Run with: npx tsx scripts/import-doctors-excel.ts <path-to-csv>
 *
 * Features:
 * - Maps specialty names to CadreHealth sub-specialties
 * - Cleans phone numbers (handles various Nigerian formats)
 * - Deduplicates by email (keeps first occurrence)
 * - Fixes common email domain typos
 * - Strips "Dr", "Prof", trailing dots from names
 * - Strips location suffixes from names (e.g. "Zamfara", "Katsina", "Plateau")
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import crypto from "crypto";
import path from "path";

const prisma = new PrismaClient();

// ─── Specialty mapping to CadreHealth sub-specialties ──────────────────

const SPECIALTY_MAP: Record<string, string> = {
  // Surgery
  "general surgeon": "General Surgery",
  "orthopaedic surgeon": "Orthopaedic Surgery",
  "plastic surgeon": "Plastic Surgery",
  "neurosurgeon": "Neurosurgery",
  "paediatric surgeon": "Paediatric Surgery",
  "oral and maxillofacial surgeon": "Oral & Maxillofacial Surgery",

  // Medicine
  "internal medicine": "Internal Medicine",
  "family medicine": "General Practice / Family Medicine",
  "emergency medicine": "Emergency Medicine",
  "community medicine": "Public Health Medicine",

  // Specialties
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

  // Pathology
  "pathologist": "Pathology",
  "chemical pathologist": "Pathology",
  "histopathologist": "Pathology",
  "medical microbiologist": "Infectious Disease",

  // ENT
  "ear, nose & throat doctor (ent)": "ENT / Otorhinolaryngology",

  // Dentistry (will override cadre to DENTISTRY)
  "general dentistry": "General Dentistry",
  "orthodontist": "Orthodontics",
  "paediatric dentist": "Paediatric Dentistry",

  // Public Health
  "public health physician": "Public Health Medicine",
};

// Location suffixes commonly appended to names
const LOCATION_SUFFIXES = [
  "Niger", "Katsina", "Zamfara", "Sokoto", "Plateau", "Yobe", "Oyo",
  "Lagos", "Abuja", "Kaduna", "Borno", "Kebbi", "Bauchi",
];

// ─── Helpers ───────────────────────────────────────────────────────────

function cleanName(raw: string): { firstName: string; lastName: string; title: string } {
  let name = raw.trim();

  // Extract title
  let title = "";
  const titleMatch = name.match(/^(Prof\.?|Dr\.?|PROF\.?|DR\.?)\s*/i);
  if (titleMatch) {
    title = titleMatch[1].replace(/\.$/, "");
    name = name.slice(titleMatch[0].length);
  }

  // Remove trailing dots and location suffixes
  name = name.replace(/\s*\.\s*$/, "").trim();
  for (const loc of LOCATION_SUFFIXES) {
    const re = new RegExp(`\\s+${loc}\\s*$`, "i");
    name = name.replace(re, "").trim();
  }

  // Remove backticks and other artifacts
  name = name.replace(/[`]/g, "").trim();

  // Split into parts
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return { firstName: "Unknown", lastName: "Unknown", title };
  if (parts.length === 1) return { firstName: parts[0], lastName: "", title };

  // Handle initials like "A.D" or "M.M"
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");

  return { firstName, lastName, title };
}

function cleanPhone(raw: string): string | null {
  if (!raw || raw === "-") return null;

  let phone = raw.trim();

  // Remove spaces, dashes, dots
  phone = phone.replace(/[\s\-\.]/g, "");

  // Handle scientific notation (e.g., "2.35E+12")
  if (phone.includes("E+") || phone.includes("e+")) {
    try {
      phone = Math.round(parseFloat(phone)).toString();
    } catch {
      return null;
    }
  }

  // Remove +234 prefix, replace with 0
  phone = phone.replace(/^\+?234/, "0");

  // Ensure starts with 0
  if (phone.match(/^[789]\d{9}$/)) {
    phone = "0" + phone;
  }

  // Validate: should be 11 digits starting with 0
  if (!phone.match(/^0[789]\d{9}$/)) {
    // Try to salvage - if it's close
    if (phone.match(/^\d{10,13}$/)) {
      return phone; // store as-is, not perfect but usable
    }
    return null;
  }

  return phone;
}

function cleanEmail(raw: string): string | null {
  if (!raw || raw === "-") return null;

  let email = raw.trim().toLowerCase();

  // Remove trailing/leading spaces
  email = email.replace(/\s+/g, "");

  // Fix common domain typos
  email = email.replace(/@yahooo\.com$/, "@yahoo.com");
  email = email.replace(/@yahoo\.cpm$/, "@yahoo.com");
  email = email.replace(/@hotmaile\.com$/, "@hotmail.com");

  // Basic email validation
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return null;
  }

  return email;
}

function mapSpecialty(raw: string): { subSpecialty: string; cadre: string } {
  const key = raw.trim().toLowerCase();
  const mapped = SPECIALTY_MAP[key];

  // Check if it's a dentistry specialty
  if (key.includes("dentist") || key.includes("orthodont")) {
    return { subSpecialty: mapped || raw.trim(), cadre: "DENTISTRY" };
  }

  return { subSpecialty: mapped || raw.trim(), cadre: "MEDICINE" };
}

function generateReferralCode(): string {
  return "CH" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

// ─── Parse CSV ─────────────────────────────────────────────────────────

function parseCSV(content: string): Array<{
  sno: string;
  fullName: string;
  email: string;
  phone: string;
  specialty: string;
}> {
  const lines = content.split("\n").filter((l) => l.trim());
  const results: Array<{
    sno: string;
    fullName: string;
    email: string;
    phone: string;
    specialty: string;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    // Handle tab-separated and comma-separated
    let parts: string[];
    if (lines[i].includes("\t")) {
      parts = lines[i].split("\t");
    } else {
      // Simple CSV split (doesn't handle quoted commas, but this data shouldn't have them)
      parts = lines[i].split(",");
    }

    if (parts.length < 5) continue;

    results.push({
      sno: parts[0].trim(),
      fullName: parts[1].trim(),
      email: parts[2].trim(),
      phone: parts[3].trim(),
      specialty: parts[4].trim(),
    });
  }

  return results;
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  const csvPath = process.argv[2];

  if (!csvPath) {
    console.error("Usage: npx tsx scripts/import-doctors-excel.ts <path-to-csv>");
    console.error("");
    console.error("Export the Google Sheet as CSV first:");
    console.error("  File > Download > Comma Separated Values (.csv)");
    process.exit(1);
  }

  const fullPath = path.resolve(csvPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(fullPath, "utf-8");
  const rows = parseCSV(content);

  console.log(`Parsed ${rows.length} rows from CSV`);

  // Default password for imported accounts (they'll need to reset)
  const defaultPasswordHash = hashPassword("CadreHealth2026!");

  let imported = 0;
  let skippedDuplicate = 0;
  let skippedNoEmail = 0;
  let errors = 0;
  const seenEmails = new Set<string>();
  const specialtyCounts = new Map<string, number>();

  // First pass: clean and deduplicate in memory
  const cleanedRows: Array<{
    firstName: string; lastName: string; email: string; phone: string | null;
    subSpecialty: string; cadre: string;
  }> = [];

  for (const row of rows) {
    const email = cleanEmail(row.email);
    if (!email) { skippedNoEmail++; continue; }
    if (seenEmails.has(email)) { skippedDuplicate++; continue; }
    seenEmails.add(email);

    const { firstName, lastName, title } = cleanName(row.fullName);
    const phone = cleanPhone(row.phone);
    const { subSpecialty, cadre } = mapSpecialty(row.specialty);
    specialtyCounts.set(subSpecialty, (specialtyCounts.get(subSpecialty) || 0) + 1);

    cleanedRows.push({
      firstName: title ? `${title} ${firstName}` : firstName,
      lastName, email, phone, subSpecialty, cadre,
    });
  }

  console.log(`Cleaned: ${cleanedRows.length} unique records (${skippedDuplicate} dupes, ${skippedNoEmail} no email)`);

  // Fetch all existing emails in one query
  console.log("Checking existing emails...");
  const existingEmails = new Set(
    (await prisma.cadreProfessional.findMany({
      where: { email: { in: cleanedRows.map(r => r.email) } },
      select: { email: true },
    })).map(e => e.email)
  );
  const dbDupes = existingEmails.size;
  console.log(`Found ${dbDupes} already in database, skipping those`);
  skippedDuplicate += dbDupes;

  // Filter out existing
  const toInsert = cleanedRows.filter(r => !existingEmails.has(r.email));
  console.log(`Inserting ${toInsert.length} new professionals...`);

  // Batch insert in chunks of 50 using createMany
  const BATCH_SIZE = 50;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    try {
      await prisma.cadreProfessional.createMany({
        data: batch.map(r => ({
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          phone: r.phone,
          passwordHash: defaultPasswordHash,
          cadre: r.cadre as "MEDICINE" | "DENTISTRY",
          subSpecialty: r.subSpecialty,
          country: "Nigeria",
          isDiaspora: false,
          accountStatus: "UNVERIFIED",
          referralCode: generateReferralCode(),
          profileCompleteness: 30,
        })),
        skipDuplicates: true,
      });
      imported += batch.length;
      console.log(`  ... imported ${imported} / ${toInsert.length}`);
    } catch (err) {
      // Fall back to individual inserts for this batch
      for (const r of batch) {
        try {
          await prisma.cadreProfessional.create({
            data: {
              firstName: r.firstName, lastName: r.lastName, email: r.email,
              phone: r.phone, passwordHash: defaultPasswordHash,
              cadre: r.cadre as "MEDICINE" | "DENTISTRY", subSpecialty: r.subSpecialty,
              country: "Nigeria", isDiaspora: false, accountStatus: "UNVERIFIED",
              referralCode: generateReferralCode(), profileCompleteness: 30,
            },
          });
          imported++;
        } catch (innerErr) {
          errors++;
          console.error(`  Error: ${r.email}:`, innerErr instanceof Error ? innerErr.message : innerErr);
        }
      }
      console.log(`  ... imported ${imported} / ${toInsert.length} (batch fallback)`);
    }

    // Small delay between batches to not overwhelm the connection pool
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log("");
  console.log("=== Import Summary ===");
  console.log(`Total rows:       ${rows.length}`);
  console.log(`Imported:         ${imported}`);
  console.log(`Skipped (dupes):  ${skippedDuplicate}`);
  console.log(`Skipped (no email): ${skippedNoEmail}`);
  console.log(`Errors:           ${errors}`);
  console.log("");
  console.log("=== Specialty Distribution ===");
  const sorted = [...specialtyCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [spec, count] of sorted) {
    console.log(`  ${spec}: ${count}`);
  }
  console.log("");
  console.log(`Default password for imported accounts: CadreHealth2026!`);
  console.log("Professionals should be prompted to change their password on first login.");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Import failed:", err);
  prisma.$disconnect();
  process.exit(1);
});
