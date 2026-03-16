import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";

/**
 * POST /api/assignments/[id]/respond
 * Consultant accepts or declines an assignment request.
 * Body: { action: "accept" | "decline", reason?: string }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const { action, reason } = await req.json();

  if (!["accept", "decline"].includes(action)) {
    return Response.json({ error: "action must be 'accept' or 'decline'" }, { status: 400 });
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true, engagementManagerId: true } },
      consultant: { select: { id: true, name: true } },
    },
  });

  if (!assignment) {
    return Response.json({ error: "Assignment not found" }, { status: 404 });
  }

  // Only the assigned consultant can respond
  if (assignment.consultantId !== session.user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  if (assignment.status !== "PENDING_ACCEPTANCE") {
    return Response.json(
      { error: `Cannot respond to assignment with status ${assignment.status}` },
      { status: 400 }
    );
  }

  if (action === "accept") {
    await prisma.assignment.update({
      where: { id },
      data: {
        status: "ACTIVE",
        respondedAt: new Date(),
      },
    });

    // Notify EM via project update
    await prisma.projectUpdate.create({
      data: {
        projectId: assignment.projectId,
        createdById: session.user.id,
        type: "TEAM_CHANGE",
        content: `${assignment.consultant.name} accepted the ${assignment.role} assignment.`,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "APPROVE",
      entityType: "Assignment",
      entityId: id,
      entityName: `${assignment.role} - ${assignment.project.name}`,
      projectId: assignment.projectId,
    });

    return Response.json({ ok: true, status: "ACTIVE" });
  }

  // Decline
  if (!reason?.trim()) {
    return Response.json({ error: "Please provide a reason for declining" }, { status: 400 });
  }

  await prisma.assignment.update({
    where: { id },
    data: {
      status: "DECLINED",
      respondedAt: new Date(),
      declineReason: reason.trim(),
    },
  });

  // Notify EM
  await prisma.projectUpdate.create({
    data: {
      projectId: assignment.projectId,
      createdById: session.user.id,
      type: "TEAM_CHANGE",
      content: `${assignment.consultant.name} declined the ${assignment.role} assignment. Reason: ${reason.trim()}`,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "REJECT",
    entityType: "Assignment",
    entityId: id,
    entityName: `${assignment.role} - ${assignment.project.name} (declined)`,
    projectId: assignment.projectId,
  });

  return Response.json({ ok: true, status: "DECLINED" });
}
