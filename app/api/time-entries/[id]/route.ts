import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";
import { emailTimesheetApproved, emailTimesheetRejected } from "@/lib/email";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const { action, reason } = await req.json();
  // action: "approve" | "reject"

  const canApprove = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canApprove) return new Response("Forbidden", { status: 403 });

  // EMs can only approve entries in their projects
  if (session.user.role === "ENGAGEMENT_MANAGER") {
    const entryCheck = await prisma.timeEntry.findUnique({
      where: { id },
      select: { assignment: { select: { project: { select: { engagementManagerId: true } } } } },
    });
    if (!entryCheck) return new Response("Not found", { status: 404 });
    if (entryCheck.assignment.project.engagementManagerId !== session.user.id) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const entry = await prisma.timeEntry.update({
    where: { id },
    data: {
      status: action === "approve" ? "APPROVED" : "REJECTED",
      approvedById: session.user.id,
      approvedAt: new Date(),
    },
    include: {
      consultant: { select: { name: true, email: true } },
      assignment: { include: { project: { select: { name: true } } } },
    },
  });

  if (action === "approve") {
    await emailTimesheetApproved({
      consultantEmail: entry.consultant.email,
      consultantName: entry.consultant.name,
      totalHours: Number(entry.hours),
      totalAmount: entry.billableAmount ? Number(entry.billableAmount) : 0,
      currency: entry.currency,
      projectName: entry.assignment.project.name,
    });
  } else if (reason) {
    await emailTimesheetRejected({
      consultantEmail: entry.consultant.email,
      consultantName: entry.consultant.name,
      totalHours: Number(entry.hours),
      projectName: entry.assignment.project.name,
      reason,
    });
  }

  await logAudit({
    userId: session.user.id,
    action: action === "approve" ? "APPROVE" : "REJECT",
    entityType: "TimeEntry",
    entityId: id,
    entityName: `${Number(entry.hours)}h - ${entry.assignment.project.name}`,
    projectId: entry.assignment.projectId,
  });

  return Response.json({ ok: true });
}
