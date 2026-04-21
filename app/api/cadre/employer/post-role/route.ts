import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCadreEmployerSession } from "@/lib/cadreEmployerAuth";
import { handler } from "@/lib/api-handler";

function generateSlug(title: string, facility: string | null, state: string | null): string {
  const parts = [title, facility, state].filter(Boolean).join(" ");
  return parts
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export const POST = handler(async function POST(req: NextRequest) {
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

    const slug = generateSlug(title, session.companyName, locationState) + "-" + mandate.id.slice(-6);
    await prisma.cadreMandate.update({ where: { id: mandate.id }, data: { slug } });

    return NextResponse.json({ id: mandate.id, slug });
  } catch (error) {
    console.error("Post role error:", error);
    return NextResponse.json(
      { error: "Failed to create listing. Please try again." },
      { status: 500 }
    );
  }
});
