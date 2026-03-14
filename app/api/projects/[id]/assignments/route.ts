import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { RateType, Currency } from "@prisma/client";

const VALID_RATE_TYPES: RateType[] = ["HOURLY", "MONTHLY", "FIXED_PROJECT"];
const VALID_CURRENCIES: Currency[] = ["NGN", "USD"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const isEM = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!isEM) return new Response("Forbidden", { status: 403 });

  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, startDate: true, endDate: true, engagementManagerId: true },
  });

  if (!project) return new Response("Project not found", { status: 404 });

  const {
    consultantId,
    role,
    responsibilities = "",
    startDate,
    endDate,
    rateAmount,
    rateCurrency,
    rateType,
    estimatedHours,
  } = await req.json();

  if (!consultantId || !role?.trim() || !rateAmount || !rateCurrency || !rateType) {
    return new Response("consultantId, role, rateAmount, rateCurrency, and rateType are required", { status: 400 });
  }

  if (!VALID_RATE_TYPES.includes(rateType)) {
    return new Response("Invalid rateType", { status: 400 });
  }
  if (!VALID_CURRENCIES.includes(rateCurrency)) {
    return new Response("Invalid rateCurrency", { status: 400 });
  }

  // Check the consultant isn't already on this project
  const existing = await prisma.assignment.findFirst({
    where: { projectId, consultantId, status: { in: ["ACTIVE", "PENDING"] } },
  });
  if (existing) {
    return new Response("Consultant is already assigned to this project", { status: 409 });
  }

  // Verify the consultantId belongs to a CONSULTANT user
  const consultant = await prisma.user.findUnique({
    where: { id: consultantId },
    select: { id: true, role: true },
  });
  if (!consultant || consultant.role !== "CONSULTANT") {
    return new Response("Invalid consultant", { status: 400 });
  }

  const assignment = await prisma.assignment.create({
    data: {
      projectId,
      consultantId,
      role: role.trim(),
      responsibilities,
      startDate: startDate ? new Date(startDate) : project.startDate,
      endDate: endDate ? new Date(endDate) : project.endDate ?? undefined,
      rateAmount,
      rateCurrency,
      rateType,
      estimatedHours: estimatedHours ?? null,
      status: "ACTIVE",
    },
    select: { id: true, role: true, status: true, rateAmount: true, rateCurrency: true, rateType: true },
  });

  return Response.json({ ok: true, assignment }, { status: 201 });
}
