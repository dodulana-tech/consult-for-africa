import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

const VALID_TYPES = [
  "PRACTICING_LICENSE",
  "FULL_REGISTRATION",
  "COGS",
  "SPECIALIST_REGISTRATION",
  "ADDITIONAL_LICENSE",
];

const VALID_BODIES = [
  "MDCN",
  "NMCN",
  "PCN",
  "MLSCN",
  "RRBN",
  "MRTB",
  "ODORBN",
  "CHPRBN",
  "EHORECON",
  "ICNDN",
  "COREN",
];

export const GET = handler(async function GET() {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const credentials = await prisma.cadreCredential.findMany({
      where: { professionalId: session.sub },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(credentials);
  } catch (error) {
    console.error("Credentials fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch credentials" },
      { status: 500 }
    );
  }
});

export const POST = handler(async function POST(req: NextRequest) {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, regulatoryBody, licenseNumber, issuedDate, expiryDate, documentUrl } =
      body;

    if (!type || !regulatoryBody) {
      return NextResponse.json(
        { error: "Type and regulatory body are required" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid credential type" },
        { status: 400 }
      );
    }

    if (!VALID_BODIES.includes(regulatoryBody)) {
      return NextResponse.json(
        { error: "Invalid regulatory body" },
        { status: 400 }
      );
    }

    const credential = await prisma.cadreCredential.create({
      data: {
        professionalId: session.sub,
        type,
        regulatoryBody,
        licenseNumber: licenseNumber?.trim() || null,
        issuedDate: issuedDate ? new Date(issuedDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        documentUrl: documentUrl || null,
        verificationStatus: licenseNumber ? "PENDING" : "NOT_SUBMITTED",
      },
    });

    // Recompute completeness
    await recomputeCompleteness(session.sub);

    return NextResponse.json(credential, { status: 201 });
  } catch (error) {
    console.error("Credential creation error:", error);
    return NextResponse.json(
      { error: "Failed to add credential" },
      { status: 500 }
    );
  }
});

export const PATCH = handler(async function PATCH(req: NextRequest) {
  const session = await getCadreSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, documentUrl } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Credential ID is required" }, { status: 400 });
  }

  const existing = await prisma.cadreCredential.findUnique({ where: { id } });
  if (!existing || existing.professionalId !== session.sub) {
    return NextResponse.json({ error: "Credential not found" }, { status: 404 });
  }

  const updated = await prisma.cadreCredential.update({
    where: { id },
    data: { documentUrl: documentUrl || null },
  });

  return NextResponse.json(updated);
});

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
