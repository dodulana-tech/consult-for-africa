import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import { emailTimesheetApproved, emailTimesheetRejected } from "@/lib/email";
import { handler } from "@/lib/api-handler";

export const PATCH = handler(async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action, reason } = await req.json();
  // action: "approve" | "reject"

  const canApprove = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canApprove) return Response.json({ error: "Forbidden" }, { status: 403 });

  // EMs can only approve entries in their projects
  if (session.user.role === "ENGAGEMENT_MANAGER") {
    const entryCheck = await prisma.timeEntry.findUnique({
      where: { id },
      select: { assignment: { select: { engagement: { select: { engagementManagerId: true } } } } },
    });
    if (!entryCheck) return Response.json({ error: "Not found" }, { status: 404 });
    if (entryCheck.assignment.engagement.engagementManagerId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const entry = await prisma.timeEntry.update({
    where: { id },
    data: {
      status: action === "approve" ? "APPROVED" : "REJECTED",
      approvedById: session.user.id,
      approvedAt: new Date(),
      ...(action === "reject" && reason ? { rejectionReason: reason } : {}),
    },
    include: {
      consultant: { select: { name: true, email: true } },
      assignment: { include: { engagement: { select: { name: true } } } },
      track: { select: { name: true } },
    },
  });

  if (action === "approve") {
    await emailTimesheetApproved({
      consultantEmail: entry.consultant.email,
      consultantName: entry.consultant.name,
      totalHours: Number(entry.hours),
      totalAmount: entry.billableAmount ? Number(entry.billableAmount) : 0,
      currency: entry.currency,
      projectName: entry.assignment.engagement.name,
      trackName: entry.track?.name ?? undefined,
    });
  } else if (reason) {
    await emailTimesheetRejected({
      consultantEmail: entry.consultant.email,
      consultantName: entry.consultant.name,
      totalHours: Number(entry.hours),
      projectName: entry.assignment.engagement.name,
      reason,
    });
  }

  await logAudit({
    userId: session.user.id,
    action: action === "approve" ? "APPROVE" : "REJECT",
    entityType: "TimeEntry",
    entityId: id,
    entityName: `${Number(entry.hours)}h - ${entry.assignment.engagement.name}`,
    engagementId: entry.assignment.engagementId,
  });

  return Response.json({ ok: true });
});
