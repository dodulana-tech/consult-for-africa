import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { emailEMChanged } from "@/lib/email";
import { NextRequest } from "next/server";

const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];

/**
 * PATCH /api/projects/[id]
 * Update project fields including EM reassignment.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, name: true, engagementManagerId: true },
  });

  if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

  // Only EM of the project or elevated roles can update
  const isProjectEM = project.engagementManagerId === session.user.id;
  const isElevated = ELEVATED.includes(session.user.role);
  if (!isProjectEM && !isElevated) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};

  // EM reassignment (Director+ only)
  if (body.engagementManagerId !== undefined) {
    if (!isElevated) {
      return Response.json({ error: "Only Directors and above can reassign Engagement Managers" }, { status: 403 });
    }

    const newEM = await prisma.user.findUnique({
      where: { id: body.engagementManagerId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!newEM) return Response.json({ error: "New EM not found" }, { status: 404 });

    const validEMRoles = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];
    if (!validEMRoles.includes(newEM.role)) {
      return Response.json({ error: "User must be an Engagement Manager or above" }, { status: 400 });
    }

    updateData.engagementManagerId = newEM.id;

    // Log the change
    await prisma.projectUpdate.create({
      data: {
        projectId: id,
        createdById: session.user.id,
        type: "TEAM_CHANGE",
        content: `Engagement Manager reassigned to ${newEM.name}.`,
      },
    });

    // Get old EM details for notification
    const oldEM = await prisma.user.findUnique({
      where: { id: project.engagementManagerId },
      select: { name: true, email: true },
    });

    // Send email notifications
    if (oldEM) {
      emailEMChanged({
        oldEMEmail: oldEM.email,
        oldEMName: oldEM.name,
        newEMEmail: newEM.email ?? "",
        newEMName: newEM.name,
        projectName: project.name,
        changedByName: session.user.name ?? "Admin",
      }).catch((err) => console.error("[email] EM change notification failed:", err));
    }
  }

  // Other updatable fields
  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.description !== undefined) updateData.description = body.description.trim();
  if (body.status !== undefined) {
    const validStatuses = ["PLANNING", "ACTIVE", "ON_HOLD", "AT_RISK", "COMPLETED", "CANCELLED"];
    if (validStatuses.includes(body.status)) updateData.status = body.status;
  }
  if (body.riskLevel !== undefined) {
    const validRisks = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    if (validRisks.includes(body.riskLevel)) updateData.riskLevel = body.riskLevel;
  }
  if (body.healthScore !== undefined) {
    const score = Math.min(10, Math.max(1, parseInt(String(body.healthScore), 10)));
    if (!isNaN(score)) updateData.healthScore = score;
  }
  if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
  if (body.budgetSensitivity !== undefined) {
    const valid = ["PREMIUM", "STANDARD", "VALUE", "BUDGET"];
    if (valid.includes(body.budgetSensitivity) || body.budgetSensitivity === null) updateData.budgetSensitivity = body.budgetSensitivity;
  }
  if (body.budgetAmount !== undefined) {
    const amt = parseFloat(String(body.budgetAmount));
    if (!isNaN(amt) && amt >= 0) updateData.budgetAmount = amt;
  }
  if (body.budgetCurrency !== undefined) {
    if (["NGN", "USD"].includes(body.budgetCurrency)) updateData.budgetCurrency = body.budgetCurrency;
  }
  if (body.consultantTierMin !== undefined) updateData.consultantTierMin = body.consultantTierMin || null;
  if (body.consultantTierMax !== undefined) updateData.consultantTierMax = body.consultantTierMax || null;
  if (body.internEligible !== undefined) updateData.internEligible = !!body.internEligible;
  if (body.pricingNotes !== undefined) updateData.pricingNotes = body.pricingNotes?.trim() || null;

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.project.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, status: true, engagementManagerId: true },
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Project",
    entityId: id,
    entityName: project.name,
    details: { fields: Object.keys(updateData) },
  });

  return Response.json({ project: updated });
}
