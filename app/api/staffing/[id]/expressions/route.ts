import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const ELEVATED = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

/**
 * GET /api/staffing/[id]/expressions
 * List all expressions of interest for a staffing request.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const request = await prisma.staffingRequest.findUnique({
    where: { id },
    include: {
      engagement: { select: { id: true, name: true, client: { select: { name: true } } } },
    },
  });

  if (!request) return Response.json({ error: "Not found" }, { status: 404 });

  const expressions = await prisma.staffingExpression.findMany({
    where: { staffingRequestId: id },
    include: {
      consultant: {
        select: {
          id: true,
          name: true,
          email: true,
          consultantProfile: {
            select: {
              title: true,
              location: true,
              tier: true,
              yearsExperience: true,
              expertiseAreas: true,
              availabilityStatus: true,
              averageRating: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return Response.json({
    request: {
      id: request.id,
      role: request.role,
      description: request.description,
      skillsRequired: request.skillsRequired,
      status: request.status,
      engagement: request.engagement,
    },
    expressions: expressions.map((e) => ({
      id: e.id,
      note: e.note,
      status: e.status,
      matchScore: e.matchScore,
      createdAt: e.createdAt.toISOString(),
      consultant: {
        id: e.consultant.id,
        name: e.consultant.name,
        email: e.consultant.email,
        profile: e.consultant.consultantProfile
          ? {
              ...e.consultant.consultantProfile,
              averageRating: e.consultant.consultantProfile.averageRating
                ? Number(e.consultant.consultantProfile.averageRating)
                : null,
            }
          : null,
      },
    })),
  });
}

/**
 * PATCH /api/staffing/[id]/expressions
 * Update expression status (shortlist, select, pass) and optionally create assignment.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || !ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { expressionId, action } = body; // action: SHORTLISTED, SELECTED, PASSED

  if (!expressionId || !action) {
    return Response.json({ error: "expressionId and action required" }, { status: 400 });
  }

  const validActions = ["SHORTLISTED", "SELECTED", "PASSED"];
  if (!validActions.includes(action)) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  const expression = await prisma.staffingExpression.findUnique({
    where: { id: expressionId },
    include: {
      staffingRequest: { select: { engagementId: true, role: true } },
    },
  });

  if (!expression || expression.staffingRequestId !== id) {
    return Response.json({ error: "Expression not found" }, { status: 404 });
  }

  await prisma.staffingExpression.update({
    where: { id: expressionId },
    data: { status: action },
  });

  // If SELECTED, create an assignment and close the staffing request
  if (action === "SELECTED") {
    const { rateType, rateAmount, rateCurrency, startDate, endDate } = body;

    await prisma.assignment.create({
      data: {
        engagementId: expression.staffingRequest.engagementId,
        consultantId: expression.consultantId,
        role: expression.staffingRequest.role,
        responsibilities: "",
        rateType: rateType || "MONTHLY",
        rateAmount: rateAmount || 0,
        rateCurrency: rateCurrency || "NGN",
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        status: "PENDING",
      },
    });

    // Mark staffing request as filled
    await prisma.staffingRequest.update({
      where: { id },
      data: { status: "FILLED" },
    });
  }

  return Response.json({ ok: true, action });
}
