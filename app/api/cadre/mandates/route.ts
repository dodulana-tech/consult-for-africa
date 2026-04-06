import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const cadre = url.searchParams.get("cadre");
    const type = url.searchParams.get("type");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status) where.status = status;
    if (cadre) where.cadre = cadre;
    if (type) where.type = type;

    const mandates = await prisma.cadreMandate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { matches: true } },
        facility: { select: { name: true } },
      },
    });

    return NextResponse.json(mandates);
  } catch (error) {
    console.error("Error fetching mandates:", error);
    return NextResponse.json({ error: "Failed to fetch mandates" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      title,
      description,
      cadre,
      subSpecialty,
      minYearsExperience,
      requiredQualifications,
      preferredQualifications,
      valuesRequirements,
      locationState,
      locationCity,
      isRemoteOk,
      isRelocationRequired,
      type,
      salaryRangeMin,
      salaryRangeMax,
      salaryCurrency,
      urgency,
      facilityId,
      facilityName,
      clientContact,
    } = body;

    if (!title || !cadre || !type) {
      return NextResponse.json(
        { error: "Title, cadre, and type are required" },
        { status: 400 }
      );
    }

    const mandate = await prisma.cadreMandate.create({
      data: {
        title,
        description: description || null,
        cadre,
        subSpecialty: subSpecialty || null,
        minYearsExperience: minYearsExperience ?? null,
        requiredQualifications: requiredQualifications || [],
        preferredQualifications: preferredQualifications || [],
        valuesRequirements: valuesRequirements || null,
        locationState: locationState || null,
        locationCity: locationCity || null,
        isRemoteOk: isRemoteOk ?? false,
        isRelocationRequired: isRelocationRequired ?? false,
        type,
        salaryRangeMin: salaryRangeMin ?? null,
        salaryRangeMax: salaryRangeMax ?? null,
        salaryCurrency: salaryCurrency || "NGN",
        urgency: urgency || null,
        facilityId: facilityId || null,
        facilityName: facilityName || null,
        clientContact: clientContact || null,
        status: "OPEN",
      },
    });

    return NextResponse.json({ id: mandate.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating mandate:", error);
    return NextResponse.json({ error: "Failed to create mandate" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Mandate ID required" }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body;

    const updateData: Record<string, unknown> = {};
    if (status) {
      updateData.status = status;
      if (status === "CLOSED" || status === "CANCELLED") {
        updateData.closedAt = new Date();
      }
    }

    const mandate = await prisma.cadreMandate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ id: mandate.id, status: mandate.status });
  } catch (error) {
    console.error("Error updating mandate:", error);
    return NextResponse.json({ error: "Failed to update mandate" }, { status: 500 });
  }
}
