import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id: projectId } = await params;
  const body = await req.json();

  if (!body.name?.trim()) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const deliverable = await prisma.deliverable.create({
    data: {
      projectId,
      name: body.name.trim(),
      description: body.description?.trim() || "",
      milestoneId: body.milestoneId || null,
      assignmentId: body.assignmentId || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      status: "DRAFT",
      reviewStage: "DRAFT",
      clientVisible: false,
    },
    include: {
      assignment: {
        include: { consultant: { select: { name: true } } },
      },
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Deliverable",
    entityId: deliverable.id,
    entityName: deliverable.name,
    projectId,
  });

  return Response.json({
    deliverable: {
      ...deliverable,
      createdAt: deliverable.createdAt.toISOString(),
      updatedAt: deliverable.updatedAt.toISOString(),
      dueDate: deliverable.dueDate?.toISOString() ?? null,
      submittedAt: null,
      reviewedAt: null,
      approvedAt: null,
    },
  }, { status: 201 });
}
