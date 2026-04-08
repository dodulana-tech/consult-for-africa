import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createMandateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  cadre: z.enum([
    "MEDICINE", "DENTISTRY", "NURSING", "MIDWIFERY", "PHARMACY",
    "MEDICAL_LABORATORY_SCIENCE", "RADIOGRAPHY_IMAGING", "REHABILITATION_THERAPY",
    "OPTOMETRY", "COMMUNITY_HEALTH", "ENVIRONMENTAL_HEALTH", "NUTRITION_DIETETICS",
    "PSYCHOLOGY_SOCIAL_WORK", "PUBLIC_HEALTH", "HEALTH_ADMINISTRATION", "BIOMEDICAL_ENGINEERING",
  ]),
  subSpecialty: z.string().nullable().optional(),
  minYearsExperience: z.number().nullable().optional(),
  requiredQualifications: z.array(z.string()).optional().default([]),
  preferredQualifications: z.array(z.string()).optional().default([]),
  valuesRequirements: z.string().nullable().optional(),
  locationState: z.string().nullable().optional(),
  locationCity: z.string().nullable().optional(),
  isRemoteOk: z.boolean().optional().default(false),
  isRelocationRequired: z.boolean().optional().default(false),
  type: z.enum(["PERMANENT", "LOCUM", "CONTRACT", "CONSULTING", "INTERNATIONAL"]),
  salaryRangeMin: z.number().nullable().optional(),
  salaryRangeMax: z.number().nullable().optional(),
  salaryCurrency: z.enum(["USD", "NGN"]).optional().default("NGN"),
  urgency: z.string().nullable().optional(),
  facilityId: z.string().nullable().optional(),
  facilityName: z.string().nullable().optional(),
  clientContact: z.string().nullable().optional(),
});

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
    const parsed = createMandateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      title, description, cadre, subSpecialty, minYearsExperience,
      requiredQualifications, preferredQualifications, valuesRequirements,
      locationState, locationCity, isRemoteOk, isRelocationRequired,
      type, salaryRangeMin, salaryRangeMax, salaryCurrency,
      urgency, facilityId, facilityName, clientContact,
    } = parsed.data;

    const mandate = await prisma.cadreMandate.create({
      data: {
        title,
        description: description ?? null,
        cadre,
        subSpecialty: subSpecialty ?? null,
        minYearsExperience: minYearsExperience ?? null,
        requiredQualifications,
        preferredQualifications,
        valuesRequirements: valuesRequirements ?? null,
        locationState: locationState ?? null,
        locationCity: locationCity ?? null,
        isRemoteOk,
        isRelocationRequired,
        type,
        salaryRangeMin: salaryRangeMin ?? null,
        salaryRangeMax: salaryRangeMax ?? null,
        salaryCurrency,
        urgency: urgency ?? null,
        facilityId: facilityId ?? null,
        facilityName: facilityName ?? null,
        clientContact: clientContact ?? null,
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
    const {
      status, title, description, cadre, subSpecialty, minYearsExperience,
      requiredQualifications, preferredQualifications, valuesRequirements,
      locationState, locationCity, isRemoteOk, isRelocationRequired,
      type, salaryRangeMin, salaryRangeMax, salaryCurrency, urgency,
      facilityId, facilityName, clientContact,
    } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    if (status) {
      updateData.status = status;
      if (status === "CLOSED" || status === "CANCELLED") {
        updateData.closedAt = new Date();
      }
    }

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (cadre !== undefined) updateData.cadre = cadre;
    if (subSpecialty !== undefined) updateData.subSpecialty = subSpecialty || null;
    if (minYearsExperience !== undefined) updateData.minYearsExperience = minYearsExperience;
    if (Array.isArray(requiredQualifications)) updateData.requiredQualifications = requiredQualifications;
    if (Array.isArray(preferredQualifications)) updateData.preferredQualifications = preferredQualifications;
    if (valuesRequirements !== undefined) updateData.valuesRequirements = valuesRequirements || null;
    if (locationState !== undefined) updateData.locationState = locationState || null;
    if (locationCity !== undefined) updateData.locationCity = locationCity || null;
    if (isRemoteOk !== undefined) updateData.isRemoteOk = isRemoteOk;
    if (isRelocationRequired !== undefined) updateData.isRelocationRequired = isRelocationRequired;
    if (type !== undefined) updateData.type = type;
    if (salaryRangeMin !== undefined) updateData.salaryRangeMin = salaryRangeMin;
    if (salaryRangeMax !== undefined) updateData.salaryRangeMax = salaryRangeMax;
    if (salaryCurrency !== undefined) updateData.salaryCurrency = salaryCurrency;
    if (urgency !== undefined) updateData.urgency = urgency || null;
    if (facilityId !== undefined) updateData.facilityId = facilityId || null;
    if (facilityName !== undefined) updateData.facilityName = facilityName || null;
    if (clientContact !== undefined) updateData.clientContact = clientContact || null;

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

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Mandate ID required" }, { status: 400 });
    }

    await prisma.cadreMandate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting mandate:", error);
    return NextResponse.json({ error: "Failed to delete mandate" }, { status: 500 });
  }
}
