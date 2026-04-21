import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const PATCH = handler(async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const body = await req.json();

  // Verify deliverable exists and user has project access
  const existing = await prisma.deliverable.findUnique({
    where: { id },
    select: { engagementId: true, engagement: { select: { engagementManagerId: true } } },
  });
  if (!existing) return new Response("Deliverable not found", { status: 404 });

  // EMs can only edit deliverables on their projects
  if (session.user.role === "ENGAGEMENT_MANAGER" && existing.engagement.engagementManagerId !== session.user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.description !== undefined) data.description = body.description.trim();
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.assignmentId !== undefined) data.assignmentId = body.assignmentId || null;
  if (body.status !== undefined) data.status = body.status;
  if (body.clientVisible !== undefined) data.clientVisible = body.clientVisible;
  if (body.fee !== undefined) data.fee = body.fee ? parseFloat(String(body.fee)) : null;
  if (body.feeCurrency !== undefined) data.feeCurrency = body.feeCurrency || null;

  const deliverable = await prisma.deliverable.update({
    where: { id },
    data,
    include: {
      assignment: { include: { consultant: { select: { name: true } } } },
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Deliverable",
    entityId: deliverable.id,
    entityName: deliverable.name,
    engagementId: deliverable.engagementId,
  });

  return Response.json({
    deliverable: {
      ...deliverable,
      createdAt: deliverable.createdAt.toISOString(),
      updatedAt: deliverable.updatedAt.toISOString(),
      dueDate: deliverable.dueDate?.toISOString() ?? null,
      submittedAt: deliverable.submittedAt?.toISOString() ?? null,
      reviewedAt: deliverable.reviewedAt?.toISOString() ?? null,
      approvedAt: deliverable.approvedAt?.toISOString() ?? null,
    },
  });
});

export const DELETE = handler(async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canDelete = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canDelete) return new Response("Forbidden", { status: 403 });

  const { id } = await params;

  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    select: { name: true, engagementId: true },
  });
  if (!deliverable) return new Response("Deliverable not found", { status: 404 });

  await prisma.deliverable.delete({ where: { id } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "Deliverable",
    entityId: id,
    entityName: deliverable.name,
    engagementId: deliverable.engagementId,
  });

  return Response.json({ ok: true });
});
