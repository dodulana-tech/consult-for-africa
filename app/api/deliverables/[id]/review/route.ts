import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import { emailDeliverableApproved, emailRevisionRequested } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const { action, scores, notes, microFeedback } = await req.json();

  const canReview = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canReview) return new Response("Forbidden", { status: 403 });

  // Verify EM owns this project (Directors/Partners/Admins can review any)
  if (session.user.role === "ENGAGEMENT_MANAGER") {
    const deliverableCheck = await prisma.deliverable.findUnique({
      where: { id },
      select: { project: { select: { engagementManagerId: true } } },
    });
    if (!deliverableCheck) return new Response("Not found", { status: 404 });
    if (deliverableCheck.project.engagementManagerId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const overallScore = scores
    ? Math.round(((scores.technical + scores.actionability + scores.context + scores.clientReady) / 4) * 2)
    : null;

  const newStatus = action === "approve" ? "APPROVED" : "NEEDS_REVISION";

  const deliverable = await prisma.deliverable.update({
    where: { id },
    data: {
      status: newStatus,
      reviewScore: overallScore,
      reviewNotes: notes ?? null,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      microFeedback: action === "approve" && microFeedback ? microFeedback : null,
      ...(action === "approve" ? { approvedAt: new Date() } : {}),
    },
    include: {
      project: { select: { id: true, name: true } },
      assignment: {
        include: {
          consultant: { select: { name: true, email: true } },
        },
      },
    },
  });

  await prisma.projectUpdate.create({
    data: {
      projectId: deliverable.projectId,
      content:
        action === "approve"
          ? `Deliverable "${deliverable.name}" approved${overallScore ? ` (score: ${overallScore}/10)` : ""}.`
          : `Revision requested on "${deliverable.name}".${notes ? ` Notes: ${notes}` : ""}`,
      type: action === "approve" ? "GENERAL" : "ISSUE",
      createdById: session.user.id,
    },
  });

  // Fire email to consultant
  const consultant = deliverable.assignment?.consultant;
  if (consultant) {
    if (action === "approve") {
      await emailDeliverableApproved({
        consultantEmail: consultant.email,
        consultantName: consultant.name,
        deliverableName: deliverable.name,
        projectName: deliverable.project.name,
        reviewScore: overallScore,
        reviewNotes: notes ?? null,
        deliverableId: id,
      });
    } else {
      await emailRevisionRequested({
        consultantEmail: consultant.email,
        consultantName: consultant.name,
        deliverableName: deliverable.name,
        projectName: deliverable.project.name,
        reviewNotes: notes ?? null,
        deliverableId: id,
      });
    }
  }

  await logAudit({
    userId: session.user.id,
    action: action === "approve" ? "APPROVE" : "REJECT",
    entityType: "Deliverable",
    entityId: deliverable.id,
    entityName: deliverable.name,
    projectId: deliverable.projectId,
    details: { before: "SUBMITTED", after: newStatus },
  });

  return Response.json({ ok: true, status: newStatus, deliverableId: deliverable.id });
}
