import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string; phaseId: string }> };

export const PATCH = handler(async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id: projectId, phaseId } = await params;
  const { name, description, status, percentComplete, startDate, endDate } = await req.json();

  const updates: Record<string, unknown> = {};
  if (name?.trim()) updates.name = name.trim();
  if (description !== undefined) updates.description = description;

  let oldStatus: string | undefined;
  if (status) {
    const VALID = ["PENDING", "ACTIVE", "COMPLETED", "SKIPPED"];
    if (!VALID.includes(status)) return new Response("Invalid status", { status: 400 });
    const existing = await prisma.engagementPhase.findUnique({ where: { id: phaseId }, select: { status: true } });
    oldStatus = existing?.status;
    updates.status = status;
    if (status === "COMPLETED") updates.completedAt = new Date();
  }
  if (percentComplete !== undefined) {
    updates.percentComplete = Math.min(100, Math.max(0, Number(percentComplete)));
  }
  if (startDate !== undefined) updates.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;

  if (Object.keys(updates).length === 0) return new Response("No valid fields", { status: 400 });

  const phase = await prisma.engagementPhase.update({
    where: { id: phaseId },
    data: updates,
    select: {
      id: true,
      name: true,
      description: true,
      order: true,
      status: true,
      percentComplete: true,
      startDate: true,
      endDate: true,
      completedAt: true,
      createdAt: true,
      gates: { select: { id: true, name: true, passed: true, passedAt: true, notes: true } },
    },
  });

  await logAudit({
    userId: session.user.id,
    action: status ? "STATUS_CHANGE" : "UPDATE",
    entityType: "Phase",
    entityId: phase.id,
    entityName: phase.name,
    engagementId: projectId,
    details: status ? { before: oldStatus, after: status } : undefined,
  });

  if (status) {
    await prisma.engagementUpdate.create({
      data: {
        engagementId: projectId,
        content: status === "COMPLETED"
          ? `Phase completed: ${phase.name}`
          : `Phase "${phase.name}" moved to ${status.replace(/_/g, " ")}`,
        type: status === "COMPLETED" ? "MILESTONE_COMPLETED" : "GENERAL",
        createdById: session.user.id,
      },
    });
  }

  return Response.json({
    ok: true,
    phase: {
      ...phase,
      startDate: phase.startDate?.toISOString() ?? null,
      endDate: phase.endDate?.toISOString() ?? null,
      completedAt: phase.completedAt?.toISOString() ?? null,
      createdAt: phase.createdAt.toISOString(),
      gates: phase.gates.map((g) => ({ ...g, passedAt: g.passedAt?.toISOString() ?? null })),
    },
  });
});

export const DELETE = handler(async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id: projectId, phaseId } = await params;
  const phase = await prisma.engagementPhase.findUnique({ where: { id: phaseId }, select: { name: true } });
  await prisma.engagementPhase.delete({ where: { id: phaseId } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "Phase",
    entityId: phaseId,
    entityName: phase?.name,
    engagementId: projectId,
  });

  return Response.json({ ok: true });
});
