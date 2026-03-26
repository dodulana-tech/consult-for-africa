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

  // Validate trackId belongs to this engagement if provided
  if (body.trackId) {
    const track = await prisma.engagementTrack.findFirst({
      where: { id: body.trackId, engagementId: projectId },
    });
    if (!track) {
      return Response.json({ error: "Track not found or does not belong to this engagement" }, { status: 400 });
    }
  }

  // If trackId is set and no assignmentId provided, auto-assign to Track Lead
  let resolvedAssignmentId = body.assignmentId || null;
  if (body.trackId && !resolvedAssignmentId) {
    const trackLead = await prisma.assignment.findFirst({
      where: {
        engagementId: projectId,
        trackId: body.trackId,
        trackRole: "Track Lead",
        status: { in: ["ACTIVE", "PENDING", "PENDING_ACCEPTANCE"] },
      },
      select: { id: true },
    });
    if (trackLead) {
      resolvedAssignmentId = trackLead.id;
    }
  }

  const deliverable = await prisma.deliverable.create({
    data: {
      engagementId: projectId,
      name: body.name.trim(),
      description: body.description?.trim() || "",
      milestoneId: body.milestoneId || null,
      assignmentId: resolvedAssignmentId,
      trackId: body.trackId || null,
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
    engagementId: projectId,
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
