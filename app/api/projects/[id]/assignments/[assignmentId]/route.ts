import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emailAssignmentTerminated } from "@/lib/email";
import { NextRequest } from "next/server";
import type { AssignmentStatus } from "@prisma/client";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string; assignmentId: string }> };

// PATCH — update assignment (status, rate, role)
// EM can change status on their projects; Partner/Admin can change rate
export const PATCH = handler(async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, assignmentId } = await params;
  const role = session.user.role;
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(role);
  const isEM = role === "ENGAGEMENT_MANAGER";
  const canManageFinancials = ["PARTNER", "ADMIN"].includes(role);

  if (!isElevated && !isEM) return Response.json({ error: "Forbidden" }, { status: 403 });

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { engagement: { select: { engagementManagerId: true } } },
  });

  if (!assignment || assignment.engagementId !== projectId) {
    return Response.json({ error: "Assignment not found" }, { status: 404 });
  }

  // EM can only manage their own projects
  if (isEM && assignment.engagement.engagementManagerId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { status, rateAmount, rateType, rateCurrency, role: assignmentRole } = await req.json();

  const updates: Record<string, unknown> = {};

  if (status) {
    const VALID: AssignmentStatus[] = ["ACTIVE", "PENDING", "COMPLETED", "TERMINATED"];
    if (!VALID.includes(status)) return Response.json({ error: "Invalid status" }, { status: 400 });
    updates.status = status;
  }

  if (assignmentRole?.trim()) {
    updates.role = assignmentRole.trim();
  }

  // Only Partner/Admin can change financial terms
  if (rateAmount !== undefined || rateType !== undefined || rateCurrency !== undefined) {
    if (!canManageFinancials) return Response.json({ error: "Only Partner/Admin can change rates" }, { status: 403 });
    if (rateAmount !== undefined) updates.rateAmount = rateAmount;
    if (rateType !== undefined) updates.rateType = rateType;
    if (rateCurrency !== undefined) updates.rateCurrency = rateCurrency;
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: updates,
    select: { id: true, status: true, role: true, rateAmount: true, rateType: true, rateCurrency: true, consultant: { select: { name: true } } },
  });

  if (status) {
    await prisma.engagementUpdate.create({
      data: {
        engagementId: projectId,
        content: `${updated.consultant?.name ?? "Consultant"} assignment ${status === "COMPLETED" ? "completed" : `moved to ${status.replace(/_/g, " ")}`}`,
        type: "TEAM_CHANGE",
        createdById: session.user.id,
      },
    });
  }

  return Response.json({
    ok: true,
    assignment: { ...updated, rateAmount: Number(updated.rateAmount) },
  });
});

// DELETE — remove consultant from project (set status TERMINATED)
export const DELETE = handler(async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId, assignmentId } = await params;
  const role = session.user.role;
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(role);
  const isEM = role === "ENGAGEMENT_MANAGER";

  if (!isElevated && !isEM) return Response.json({ error: "Forbidden" }, { status: 403 });

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { engagement: { select: { engagementManagerId: true } } },
  });

  if (!assignment || assignment.engagementId !== projectId) {
    return Response.json({ error: "Assignment not found" }, { status: 404 });
  }

  if (isEM && assignment.engagement.engagementManagerId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Soft-delete: mark as TERMINATED rather than hard delete
  const terminated = await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: "TERMINATED" },
    select: { role: true, consultantId: true, engagement: { select: { name: true } } },
  });

  // Notify the consultant
  try {
    const consultant = await prisma.user.findUnique({
      where: { id: terminated.consultantId },
      select: { email: true, name: true },
    });
    if (consultant?.email) {
      await emailAssignmentTerminated({
        consultantEmail: consultant.email,
        consultantName: consultant.name ?? "Consultant",
        projectName: terminated.engagement.name,
        role: terminated.role,
      });
    }
  } catch (err) {
    console.error("[assignments] Failed to send termination email:", err);
  }

  return Response.json({ ok: true });
});
