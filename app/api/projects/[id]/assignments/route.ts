import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { checkCapacityForAssignment } from "@/lib/capacity";
import { emailAssignmentCreated } from "@/lib/email";
import { NextRequest } from "next/server";
import type { RateType, Currency } from "@prisma/client";

const VALID_RATE_TYPES: RateType[] = ["HOURLY", "DAILY", "MONTHLY", "FIXED_PROJECT", "FIXED_DELIVERABLE"];
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

  const project = await prisma.engagement.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, startDate: true, endDate: true, engagementManagerId: true },
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
    estimatedHoursPerWeek,
    forceAssign = false, // bypass capacity warning (still blocked if >100%)
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
    where: { engagementId: projectId, consultantId, status: { in: ["ACTIVE", "PENDING", "PENDING_ACCEPTANCE"] } },
  });
  if (existing) {
    return new Response("Consultant is already assigned to this project", { status: 409 });
  }

  // Verify the consultantId belongs to a CONSULTANT user
  const consultant = await prisma.user.findUnique({
    where: { id: consultantId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!consultant || consultant.role !== "CONSULTANT") {
    return new Response("Invalid consultant", { status: 400 });
  }

  // Capacity check
  const hoursToAdd = estimatedHoursPerWeek ?? estimatedHours ?? 0;
  const capacityCheck = await checkCapacityForAssignment(consultantId, hoursToAdd);

  if (!capacityCheck.allowed) {
    return Response.json(
      { error: capacityCheck.warning, capacity: capacityCheck.capacity },
      { status: 422 }
    );
  }

  if (capacityCheck.warning && !forceAssign) {
    return Response.json(
      {
        error: "CAPACITY_WARNING",
        warning: capacityCheck.warning,
        capacity: capacityCheck.capacity,
        requiresConfirmation: true,
      },
      { status: 409 }
    );
  }

  // Create assignment as PENDING_ACCEPTANCE (consultant must accept)
  const assignment = await prisma.assignment.create({
    data: {
      engagementId: projectId,
      consultantId,
      role: role.trim(),
      responsibilities,
      startDate: startDate ? new Date(startDate) : project.startDate,
      endDate: endDate ? new Date(endDate) : project.endDate ?? undefined,
      rateAmount,
      rateCurrency,
      rateType,
      estimatedHours: estimatedHours ?? null,
      estimatedHoursPerWeek: estimatedHoursPerWeek ?? null,
      status: "PENDING_ACCEPTANCE",
      capacityAtAssignment: capacityCheck.capacity.utilizationPercent,
    },
    select: { id: true, role: true, status: true, rateAmount: true, rateCurrency: true, rateType: true },
  });

  // Create project update
  await prisma.engagementUpdate.create({
    data: {
      engagementId: projectId,
      createdById: session.user.id,
      type: "TEAM_CHANGE",
      content: `Assignment request sent to ${consultant.name} for the ${role.trim()} role. Awaiting acceptance.`,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "ASSIGN",
    entityType: "Assignment",
    entityId: assignment.id,
    entityName: `${role.trim()} - ${project.name} (pending acceptance)`,
    engagementId: projectId,
  });

  // Email the consultant
  emailAssignmentCreated({
    consultantEmail: consultant.email,
    consultantName: consultant.name,
    projectName: project.name,
    role: role.trim(),
    rateType,
    rateAmount: String(rateAmount),
    currency: rateCurrency,
  }).catch((err) => console.error("[email] assignment notification failed:", err));

  return Response.json({
    ok: true,
    assignment: { ...assignment, rateAmount: Number(assignment.rateAmount) },
    capacityWarning: capacityCheck.warning,
    message: `Assignment request sent to ${consultant.name}. They will need to accept before the assignment becomes active.`,
  }, { status: 201 });
}
