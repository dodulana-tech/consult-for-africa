import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const { assignmentId, reason } = await req.json();

  if (!assignmentId) {
    return Response.json({ error: "assignmentId is required" }, { status: 400 });
  }

  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    include: {
      assignment: { include: { consultant: { select: { name: true } } } },
      project: { select: { id: true, name: true } },
    },
  });

  if (!deliverable) {
    return Response.json({ error: "Deliverable not found" }, { status: 404 });
  }

  // Verify new assignment belongs to the same project
  const newAssignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { consultant: { select: { id: true, name: true } } },
  });

  if (!newAssignment) {
    return Response.json({ error: "Assignment not found" }, { status: 404 });
  }

  if (newAssignment.projectId !== deliverable.projectId) {
    return Response.json({ error: "Assignment must belong to the same project" }, { status: 400 });
  }

  if (deliverable.assignmentId === assignmentId) {
    return Response.json({ error: "Deliverable is already assigned to this consultant" }, { status: 400 });
  }

  const previousConsultant = deliverable.assignment?.consultant?.name ?? "Unassigned";

  // Reassign: reset to DRAFT, clear review data
  const updated = await prisma.deliverable.update({
    where: { id },
    data: {
      assignmentId,
      status: "DRAFT",
      reviewStage: "DRAFT",
      reviewScore: null,
      reviewNotes: null,
      reviewedAt: null,
      reviewedById: null,
      submittedAt: null,
      approvedAt: null,
    },
    include: {
      assignment: { include: { consultant: { select: { name: true } } } },
    },
  });

  // Create a project update for audit trail
  await prisma.projectUpdate.create({
    data: {
      projectId: deliverable.projectId,
      createdById: session.user.id,
      type: "TEAM_CHANGE",
      content: `Deliverable "${deliverable.name}" reassigned from ${previousConsultant} to ${newAssignment.consultant.name}.${reason ? ` Reason: ${reason}` : ""}`,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Deliverable",
    entityId: deliverable.id,
    entityName: `${deliverable.name} (reassigned)`,
    projectId: deliverable.projectId,
  });

  return Response.json({
    deliverable: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      dueDate: updated.dueDate?.toISOString() ?? null,
      submittedAt: updated.submittedAt?.toISOString() ?? null,
      reviewedAt: updated.reviewedAt?.toISOString() ?? null,
      approvedAt: updated.approvedAt?.toISOString() ?? null,
    },
  });
}
