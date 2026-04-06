import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCadreEmployerSession } from "@/lib/cadreEmployerAuth";

export async function POST(req: NextRequest) {
  try {
    const session = await getCadreEmployerSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      cadre,
      subSpecialty,
      type,
      minYearsExperience,
      locationState,
      locationCity,
      salaryRangeMin,
      salaryRangeMax,
      urgency,
      requiredQualifications,
      preferredQualifications,
      isRemoteOk,
      isRelocationRequired,
    } = body;

    if (!title || !cadre || !type) {
      return NextResponse.json(
        { error: "Title, cadre, and type are required" },
        { status: 400 }
      );
    }

    const mandate = await prisma.cadreMandate.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        cadre,
        subSpecialty: subSpecialty?.trim() || null,
        type,
        minYearsExperience: minYearsExperience || null,
        locationState: locationState || null,
        locationCity: locationCity?.trim() || null,
        salaryRangeMin: salaryRangeMin || null,
        salaryRangeMax: salaryRangeMax || null,
        salaryCurrency: "NGN",
        urgency: urgency || "MEDIUM",
        requiredQualifications: requiredQualifications || [],
        preferredQualifications: preferredQualifications || [],
        isRemoteOk: !!isRemoteOk,
        isRelocationRequired: !!isRelocationRequired,
        facilityId: session.facilityId || null,
        facilityName: session.facilityId ? null : session.companyName,
        status: "OPEN",
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({ id: mandate.id });
  } catch (error) {
    console.error("Post role error:", error);
    return NextResponse.json(
      { error: "Failed to create listing. Please try again." },
      { status: 500 }
    );
  }
}
