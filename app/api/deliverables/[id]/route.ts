import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name.trim();
  if (body.description !== undefined) data.description = body.description.trim();
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.assignmentId !== undefined) data.assignmentId = body.assignmentId || null;
  if (body.status !== undefined) data.status = body.status;
  if (body.clientVisible !== undefined) data.clientVisible = body.clientVisible;

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
    projectId: deliverable.projectId,
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
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canDelete = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canDelete) return new Response("Forbidden", { status: 403 });

  const { id } = await params;

  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    select: { name: true, projectId: true },
  });
  await prisma.deliverable.delete({ where: { id } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "Deliverable",
    entityId: id,
    entityName: deliverable?.name,
    projectId: deliverable?.projectId,
  });

  return Response.json({ ok: true });
}
