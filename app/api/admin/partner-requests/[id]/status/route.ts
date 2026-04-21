import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const ALLOWED_ROLES = ["PARTNER", "ADMIN", "DIRECTOR"];

const VALID_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["MATCHING", "CANCELLED"],
  MATCHING: ["SHORTLIST_SENT", "CANCELLED"],
  SHORTLIST_SENT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
};

export const POST = handler(async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role))
    return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id: requestId } = await params;

  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status } = body;
  if (!status) {
    return Response.json({ error: "status is required" }, { status: 400 });
  }

  const request = await prisma.partnerStaffingRequest.findUnique({
    where: { id: requestId },
    include: {
      partner: { select: { name: true } },
      deployments: { select: { id: true, status: true } },
    },
  });

  if (!request) {
    return Response.json({ error: "Staffing request not found" }, { status: 404 });
  }

  // Validate transition
  const allowed = VALID_TRANSITIONS[request.status];
  if (!allowed || !allowed.includes(status)) {
    return Response.json({ error: `Invalid transition: ${request.status} -> ${status}` }, { status: 400 });
  }

  // Update request status
  const updateData: Record<string, unknown> = { status };

  if (status === "ACTIVE") {
    updateData.activatedAt = new Date();
  } else if (status === "COMPLETED") {
    updateData.completedAt = new Date();
  }

  const updated = await prisma.partnerStaffingRequest.update({
    where: { id: requestId },
    data: updateData,
  });

  // Cascade deployment status changes
  if (status === "ACTIVE") {
    // Move all ACCEPTED deployments to ACTIVE
    await prisma.partnerDeployment.updateMany({
      where: {
        requestId,
        status: "ACCEPTED",
      },
      data: {
        status: "ACTIVE",
        startDate: new Date(),
      },
    });
  } else if (status === "COMPLETED") {
    // Move all ACTIVE deployments to COMPLETED
    await prisma.partnerDeployment.updateMany({
      where: {
        requestId,
        status: "ACTIVE",
      },
      data: {
        status: "COMPLETED",
        endDate: new Date(),
        completedAt: new Date(),
      },
    });
  } else if (status === "CANCELLED") {
    // Cancel all non-completed deployments
    await prisma.partnerDeployment.updateMany({
      where: {
        requestId,
        status: { notIn: ["COMPLETED", "DECLINED"] },
      },
      data: {
        status: "RECALLED",
      },
    });
  }

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "PartnerStaffingRequest",
    entityId: requestId,
    entityName: request.projectName,
    details: {
      action: "status-change",
      from: request.status,
      to: status,
      partnerName: request.partner.name,
    },
  });

  return Response.json({
    ok: true,
    request: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      submittedAt: updated.submittedAt?.toISOString() ?? null,
      matchedAt: updated.matchedAt?.toISOString() ?? null,
    },
  });
});
