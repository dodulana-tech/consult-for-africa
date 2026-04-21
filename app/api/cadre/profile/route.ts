import { NextRequest, NextResponse } from "next/server";
import { getCadreSession } from "@/lib/cadreAuth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET() {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const professional = await prisma.cadreProfessional.findUnique({
      where: { id: session.sub },
      select: { emailVerified: true },
    });

    if (!professional) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ emailVerified: professional.emailVerified });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
});

export const PATCH = handler(async function PATCH(req: NextRequest) {
  try {
    const session = await getCadreSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      phone,
      cadre,
      subSpecialty,
      yearsOfExperience,
      state,
      city,
      isDiaspora,
      diasporaCountry,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (cadre !== undefined) updateData.cadre = cadre;
    if (subSpecialty !== undefined)
      updateData.subSpecialty = subSpecialty?.trim() || null;
    if (yearsOfExperience !== undefined) {
      const parsed = yearsOfExperience != null && yearsOfExperience !== "" ? parseInt(yearsOfExperience) : NaN;
      updateData.yearsOfExperience = Number.isFinite(parsed) ? parsed : null;
    }
    if (state !== undefined) updateData.state = state || null;
    if (city !== undefined) updateData.city = city?.trim() || null;
    if (isDiaspora !== undefined) updateData.isDiaspora = !!isDiaspora;
    if (diasporaCountry !== undefined)
      updateData.diasporaCountry = diasporaCountry?.trim() || null;

    // Document fields
    if (body.cvFileUrl !== undefined) updateData.cvFileUrl = body.cvFileUrl || null;
    if (body.governmentIdUrl !== undefined) updateData.governmentIdUrl = body.governmentIdUrl || null;
    if (body.passportPhotoUrl !== undefined) updateData.passportPhotoUrl = body.passportPhotoUrl || null;

    const professional = await prisma.cadreProfessional.update({
      where: { id: session.sub },
      data: updateData,
    });

    // Recompute profile completeness
    await recomputeCompleteness(session.sub);

    return NextResponse.json({
      id: professional.id,
      firstName: professional.firstName,
      lastName: professional.lastName,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
});

async function recomputeCompleteness(professionalId: string) {
  const prof = await prisma.cadreProfessional.findUnique({
    where: { id: professionalId },
    select: {
      phone: true,
      cadre: true,
      subSpecialty: true,
      yearsOfExperience: true,
      state: true,
      isDiaspora: true,
      openTo: true,
      salaryReportedAt: true,
      credentials: { select: { id: true } },
      qualifications: { select: { id: true } },
      cpdEntries: { select: { id: true } },
      workHistory: { select: { id: true } },
    },
  });
  if (!prof) return;

  let completeness = 20; // base for registering
  if (prof.phone) completeness += 5;
  if (prof.cadre) completeness += 5;
  if (prof.subSpecialty) completeness += 5;
  if (prof.yearsOfExperience != null && prof.yearsOfExperience >= 0) completeness += 5;
  if (prof.state || prof.isDiaspora) completeness += 5;
  if (prof.openTo && prof.openTo.length > 0) completeness += 5;
  if (prof.credentials.length > 0) completeness += 15;
  if (prof.qualifications.length > 0) completeness += 10;
  if (prof.cpdEntries.length > 0) completeness += 10;
  if (prof.workHistory.length > 0) completeness += 10;
  if (prof.salaryReportedAt) completeness += 5;

  await prisma.cadreProfessional.update({
    where: { id: professionalId },
    data: { profileCompleteness: Math.min(completeness, 100) },
  });
}
