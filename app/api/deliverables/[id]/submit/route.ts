import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import { emailDeliverableSubmitted } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const { description, fileUrl } = await req.json();

  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    include: {
      engagement: {
        include: {
          engagementManager: { select: { name: true, email: true } },
        },
      },
      assignment: {
        include: { consultant: { select: { name: true } } },
      },
      track: { select: { name: true } },
    },
  });

  if (!deliverable) return new Response("Not found", { status: 404 });

  // Only the assigned consultant (or elevated roles) can submit
  const isElevated = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  const isAssigned = deliverable.assignment?.consultantId === session.user.id;
  if (!isElevated && !isAssigned) return new Response("Forbidden", { status: 403 });

  // Bump version if resubmitting after revision
  const newVersion =
    deliverable.status === "NEEDS_REVISION" ? deliverable.version + 1 : deliverable.version;

  const updated = await prisma.deliverable.update({
    where: { id },
    data: {
      status: "SUBMITTED",
      description: description ?? deliverable.description,
      fileUrl: fileUrl ?? deliverable.fileUrl,
      submittedAt: new Date(),
      version: newVersion,
      // Clear previous review data on resubmission
      reviewedAt: null,
      reviewScore: null,
      reviewNotes: null,
    },
  });

  await prisma.engagementUpdate.create({
    data: {
      engagementId: deliverable.engagementId,
      content: `Deliverable "${deliverable.name}" submitted for review${newVersion > 1 ? ` (v${newVersion})` : ""} by ${deliverable.assignment?.consultant.name ?? "consultant"}.`,
      type: "GENERAL",
      createdById: session.user.id,
    },
  });

  // Email the EM
  const em = deliverable.engagement.engagementManager;
  if (em) await emailDeliverableSubmitted({
    emEmail: em.email,
    emName: em.name,
    consultantName: deliverable.assignment?.consultant.name ?? "Consultant",
    deliverableName: deliverable.name,
    projectName: deliverable.engagement.name,
    deliverableId: id,
    projectId: deliverable.engagementId,
    trackName: deliverable.track?.name ?? undefined,
  });

  await logAudit({
    userId: session.user.id,
    action: "SUBMIT",
    entityType: "Deliverable",
    entityId: deliverable.id,
    entityName: deliverable.name,
    engagementId: deliverable.engagementId,
    details: { before: deliverable.status, after: "SUBMITTED" },
  });

  return Response.json({ ok: true, deliverable: updated });
}
