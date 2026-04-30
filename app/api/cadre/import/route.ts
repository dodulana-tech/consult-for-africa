import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { handler } from "@/lib/api-handler";

function generateReferralCode(): string {
  return "CH" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

// Generates a random password hash (professionals imported this way will need to reset password)
function generatePlaceholderHash(): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(crypto.randomBytes(32).toString("hex"), salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

const VALID_CADRES = [
  "MEDICINE",
  "DENTISTRY",
  "NURSING",
  "MIDWIFERY",
  "PHARMACY",
  "MEDICAL_LABORATORY_SCIENCE",
  "RADIOGRAPHY_IMAGING",
  "REHABILITATION_THERAPY",
  "OPTOMETRY",
  "COMMUNITY_HEALTH",
  "ENVIRONMENTAL_HEALTH",
  "NUTRITION_DIETETICS",
  "PSYCHOLOGY_SOCIAL_WORK",
  "PUBLIC_HEALTH",
  "HEALTH_RECORDS",
  "HOSPITAL_MANAGEMENT",
  "HEALTH_ADMINISTRATION",
  "BIOMEDICAL_ENGINEERING",
];

export const POST = handler(async function POST(req: NextRequest) {
  try {
    const { records } = await req.json();

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "No records provided" },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of records) {
      try {
        const {
          firstName,
          lastName,
          email,
          phone,
          cadre,
          subSpecialty,
          yearsOfExperience,
          state,
          city,
        } = record;

        // Validate required fields
        if (!firstName || !lastName || !email || !cadre) {
          errors++;
          continue;
        }

        // Validate cadre
        if (!VALID_CADRES.includes(cadre)) {
          errors++;
          continue;
        }

        // Check email uniqueness
        const emailNormalized = email.toLowerCase().trim();
        const existing = await prisma.cadreProfessional.findUnique({
          where: { email: emailNormalized },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Compute initial profile completeness
        let completeness = 20;
        if (phone) completeness += 5;
        if (cadre) completeness += 10;
        if (yearsOfExperience) completeness += 5;
        if (state) completeness += 5;

        await prisma.cadreProfessional.create({
          data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: emailNormalized,
            phone: phone?.trim() || null,
            passwordHash: generatePlaceholderHash(),
            cadre,
            subSpecialty: subSpecialty?.trim() || null,
            yearsOfExperience:
              typeof yearsOfExperience === "number" ? yearsOfExperience : null,
            state: state?.trim() || null,
            city: city?.trim() || null,
            referralCode: generateReferralCode(),
            accountStatus: "UNVERIFIED",
            profileCompleteness: completeness,
          },
        });

        imported++;
      } catch {
        errors++;
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
});
