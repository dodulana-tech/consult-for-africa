import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { emailDeliverableAssigned } from "@/lib/email";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

export const POST = handler(async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        select: { id: true, consultantId: true, consultant: { select: { name: true } } },
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

  // Notify assigned consultant
  if (deliverable.assignment?.consultantId) {
    try {
      const consultant = await prisma.user.findUnique({
        where: { id: deliverable.assignment.consultantId },
        select: { email: true, name: true },
      });
      const project = await prisma.engagement.findUnique({
        where: { id: projectId },
        select: { name: true },
      });
      const track = body.trackId
        ? await prisma.engagementTrack.findUnique({ where: { id: body.trackId }, select: { name: true } })
        : null;

      if (consultant?.email) {
        await emailDeliverableAssigned({
          consultantEmail: consultant.email,
          consultantName: consultant.name ?? "Consultant",
          deliverableName: deliverable.name,
          projectName: project?.name ?? "Project",
          dueDate: body.dueDate,
          trackName: track?.name,
        });
      }
    } catch (err) {
      console.error("[deliverables] Failed to send assignment email:", err);
    }
  }

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
});
