import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPartnerPortalSession } from "@/lib/partnerPortalAuth";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET() {
  const session = await getPartnerPortalSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const requests = await prisma.partnerStaffingRequest.findMany({
    where: { partnerId: session.partnerId },
    include: {
      deployments: {
        select: {
          id: true,
          status: true,
          role: true,
          startDate: true,
          endDate: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
});

export const POST = handler(async function POST(req: NextRequest) {
  const session = await getPartnerPortalSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: {
    projectName?: string;
    projectDescription?: string;
    rolesNeeded?: number;
    skillsRequired?: string[];
    serviceTypes?: string[];
    seniority?: string | null;
    hoursPerWeek?: number | null;
    startDate?: string | null;
    durationWeeks?: number | null;
    clientBudgetPerDay?: number | null;
  };

  try {
    body = await req.json();
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  // Validate required fields
  if (!body.projectName || !body.projectName.trim()) {
    return new NextResponse("Project name is required", { status: 400 });
  }
  if (!body.projectDescription || !body.projectDescription.trim()) {
    return new NextResponse("Project description is required", { status: 400 });
  }

  // Validate numeric fields
  if (body.rolesNeeded !== undefined && body.rolesNeeded !== null) {
    const roles = Number(body.rolesNeeded);
    if (!Number.isInteger(roles) || roles < 1 || roles > 50) {
      return new NextResponse("rolesNeeded must be a positive integer between 1 and 50", { status: 400 });
    }
  }
  if (body.hoursPerWeek !== undefined && body.hoursPerWeek !== null) {
    const hours = Number(body.hoursPerWeek);
    if (isNaN(hours) || hours < 1 || hours > 60) {
      return new NextResponse("hoursPerWeek must be between 1 and 60", { status: 400 });
    }
  }
  if (body.durationWeeks !== undefined && body.durationWeeks !== null) {
    const weeks = Number(body.durationWeeks);
    if (isNaN(weeks) || weeks < 1 || weeks > 104) {
      return new NextResponse("durationWeeks must be between 1 and 104", { status: 400 });
    }
  }
  if (body.clientBudgetPerDay !== undefined && body.clientBudgetPerDay !== null) {
    const budget = Number(body.clientBudgetPerDay);
    if (isNaN(budget) || budget <= 0) {
      return new NextResponse("clientBudgetPerDay must be a positive number", { status: 400 });
    }
  }

  // Generate request code: PSR-YYYY-NNN
  const year = new Date().getFullYear();
  const lastRequest = await prisma.partnerStaffingRequest.findFirst({
    where: {
      requestCode: { startsWith: `PSR-${year}-` },
    },
    orderBy: { requestCode: "desc" },
    select: { requestCode: true },
  });

  let nextNum = 1;
  if (lastRequest) {
    const parts = lastRequest.requestCode.split("-");
    const lastNum = parseInt(parts[2], 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }
  const requestCode = `PSR-${year}-${String(nextNum).padStart(3, "0")}`;

  const request = await prisma.partnerStaffingRequest.create({
    data: {
      partnerId: session.partnerId,
      requestCode,
      projectName: body.projectName.trim(),
      projectDescription: body.projectDescription.trim(),
      rolesNeeded: body.rolesNeeded || 1,
      skillsRequired: body.skillsRequired || [],
      serviceTypes: body.serviceTypes || [],
      seniority: body.seniority || null,
      hoursPerWeek: body.hoursPerWeek || null,
      startDate: body.startDate ? new Date(body.startDate) : null,
      durationWeeks: body.durationWeeks || null,
      clientBudgetPerDay: body.clientBudgetPerDay || null,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  // Calculate matchability score (not stored in DB)
  const requestedSkills = [
    ...(body.skillsRequired || []),
    ...(body.serviceTypes || []),
  ].map((s: string) => s.toUpperCase());

  let matchCount = 0;
  if (requestedSkills.length > 0) {
    matchCount = await prisma.consultantProfile.count({
      where: {
        availabilityStatus: { in: ["AVAILABLE", "PARTIALLY_AVAILABLE"] },
        OR: [
          { expertiseAreas: { hasSome: requestedSkills } },
          { specialties: { hasSome: requestedSkills } },
        ],
      },
    });
  } else {
    matchCount = await prisma.consultantProfile.count({
      where: {
        availabilityStatus: { in: ["AVAILABLE", "PARTIALLY_AVAILABLE"] },
      },
    });
  }

  let matchabilityScore: number;
  let matchabilityLabel: string;
  if (matchCount === 0) {
    matchabilityScore = 10;
    matchabilityLabel = "Low";
  } else if (matchCount <= 3) {
    matchabilityScore = 40;
    matchabilityLabel = "Moderate";
  } else if (matchCount <= 10) {
    matchabilityScore = 70;
    matchabilityLabel = "Good";
  } else {
    matchabilityScore = 95;
    matchabilityLabel = "Excellent";
  }

  return NextResponse.json(
    { ...request, matchabilityScore, matchabilityLabel },
    { status: 201 }
  );
});
