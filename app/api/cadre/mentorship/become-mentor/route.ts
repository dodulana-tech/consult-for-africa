import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";

const VALID_AREAS = [
  "UK Migration",
  "US Residency Match",
  "Fellowship Preparation",
  "Career Transition",
  "Specialty Selection",
  "Locum Strategy",
  "Exam Preparation",
  "Research & Publications",
  "Leadership Development",
  "Private Practice Setup",
  "NGO & Development Work",
  "Diaspora Return Planning",
];

const VALID_CADRES = [
  "MEDICINE", "DENTISTRY", "NURSING", "MIDWIFERY", "PHARMACY",
  "MEDICAL_LABORATORY_SCIENCE", "RADIOGRAPHY_IMAGING", "REHABILITATION_THERAPY",
  "OPTOMETRY", "COMMUNITY_HEALTH", "ENVIRONMENTAL_HEALTH", "NUTRITION_DIETETICS",
  "PSYCHOLOGY_SOCIAL_WORK", "PUBLIC_HEALTH", "HEALTH_ADMINISTRATION", "BIOMEDICAL_ENGINEERING",
];

const VALID_AVAILABILITY = ["ASYNC", "SCHEDULED", "BOTH"];

const VALID_PARTNER_ORGS = ["MANSAG", "ANPA", "DFC", "NDF_SA", "OTHER", "NONE"];

export async function POST(req: NextRequest) {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already has a mentor profile
    const existing = await prisma.cadreMentorProfile.findUnique({
      where: { professionalId: session.sub },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a mentor profile", profile: existing },
        { status: 409 }
      );
    }

    const body = await req.json();
    const {
      bio,
      mentorAreas,
      mentorCadres,
      maxMentees,
      availabilityType,
      availabilityNote,
      partnerOrg,
      countryOfPractice,
      yearsAbroad,
    } = body;

    // Validation
    if (!mentorAreas || !Array.isArray(mentorAreas) || mentorAreas.length === 0) {
      return NextResponse.json({ error: "Select at least one mentor area" }, { status: 400 });
    }
    if (!mentorCadres || !Array.isArray(mentorCadres) || mentorCadres.length === 0) {
      return NextResponse.json({ error: "Select at least one cadre to mentor" }, { status: 400 });
    }
    for (const area of mentorAreas) {
      if (!VALID_AREAS.includes(area)) {
        return NextResponse.json({ error: `Invalid mentor area: ${area}` }, { status: 400 });
      }
    }
    for (const cadre of mentorCadres) {
      if (!VALID_CADRES.includes(cadre)) {
        return NextResponse.json({ error: `Invalid cadre: ${cadre}` }, { status: 400 });
      }
    }
    if (availabilityType && !VALID_AVAILABILITY.includes(availabilityType)) {
      return NextResponse.json({ error: "Invalid availability type" }, { status: 400 });
    }
    if (partnerOrg && !VALID_PARTNER_ORGS.includes(partnerOrg)) {
      return NextResponse.json({ error: "Invalid partner organization" }, { status: 400 });
    }

    const profile = await prisma.cadreMentorProfile.create({
      data: {
        professionalId: session.sub,
        bio: bio?.trim() || null,
        mentorAreas,
        mentorCadres,
        maxMentees: Math.min(Math.max(parseInt(maxMentees) || 3, 1), 10),
        availabilityType: availabilityType || "ASYNC",
        availabilityNote: availabilityNote?.trim() || null,
        partnerOrg: partnerOrg === "NONE" ? null : partnerOrg || null,
        countryOfPractice: countryOfPractice?.trim() || null,
        yearsAbroad: yearsAbroad ? parseInt(yearsAbroad) : null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error) {
    console.error("Become mentor error:", error);
    return NextResponse.json({ error: "Failed to create mentor profile" }, { status: 500 });
  }
}
