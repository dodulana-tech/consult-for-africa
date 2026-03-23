import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPartnerPortalSession } from "@/lib/partnerPortalAuth";

export async function GET() {
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
}

export async function POST(req: NextRequest) {
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

  return NextResponse.json(request, { status: 201 });
}
