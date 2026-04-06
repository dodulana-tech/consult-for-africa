import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = [
  "PRIMARY_DEGREE",
  "POSTGRADUATE",
  "FELLOWSHIP",
  "CERTIFICATION",
  "INTERNATIONAL_EXAM",
];

export async function GET() {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const qualifications = await prisma.cadreQualification.findMany({
      where: { professionalId: session.sub },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(qualifications);
  } catch (error) {
    console.error("Qualifications fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch qualifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, name, institution, yearObtained, score, expiryDate, documentUrl } =
      body;

    if (!type || !name) {
      return NextResponse.json(
        { error: "Type and name are required" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid qualification type" },
        { status: 400 }
      );
    }

    const qualification = await prisma.cadreQualification.create({
      data: {
        professionalId: session.sub,
        type,
        name: name.trim(),
        institution: institution?.trim() || null,
        yearObtained: yearObtained ? parseInt(yearObtained) : null,
        score: score?.trim() || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        documentUrl: documentUrl || null,
        verificationStatus: "PENDING",
      },
    });

    // Recompute completeness
    await recomputeCompleteness(session.sub);

    return NextResponse.json(qualification, { status: 201 });
  } catch (error) {
    console.error("Qualification creation error:", error);
    return NextResponse.json(
      { error: "Failed to add qualification" },
      { status: 500 }
    );
  }
}

async function recomputeCompleteness(professionalId: string) {
  const prof = await prisma.cadreProfessional.findUnique({
    where: { id: professionalId },
    include: {
      credentials: true,
      qualifications: true,
      cpdEntries: true,
      workHistory: true,
    },
  });
  if (!prof) return;

  let completeness = 20;
  if (prof.phone) completeness += 5;
  if (prof.cadre) completeness += 5;
  if (prof.subSpecialty) completeness += 5;
  if (prof.yearsOfExperience) completeness += 5;
  if (prof.state || prof.isDiaspora) completeness += 5;
  if (prof.credentials.length > 0) completeness += 15;
  if (prof.qualifications.length > 0) completeness += 15;
  if (prof.cpdEntries.length > 0) completeness += 10;
  if (prof.workHistory.length > 0) completeness += 10;
  if (prof.salaryReportedAt) completeness += 5;

  await prisma.cadreProfessional.update({
    where: { id: professionalId },
    data: { profileCompleteness: Math.min(completeness, 100) },
  });
}
