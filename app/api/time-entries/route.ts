import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { TimeEntryStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const consultantId = searchParams.get("consultantId");

  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  const isEM = session.user.role === "ENGAGEMENT_MANAGER";

  // Build scope: elevated roles see all; EM sees only their projects; consultants see only their own
  // consultantId param is only allowed for EM/elevated and must be within their scope
  const baseWhere = isElevated
    ? {}
    : isEM
    ? { assignment: { project: { engagementManagerId: session.user.id } } }
    : { consultantId: session.user.id };

  const entries = await prisma.timeEntry.findMany({
    where: {
      ...baseWhere,
      ...(status ? { status: status as TimeEntryStatus } : {}),
      // Only EM/elevated may filter by a specific consultant
      ...(consultantId && (isEM || isElevated) ? { consultantId } : {}),
    },
    include: {
      consultant: { select: { id: true, name: true, email: true } },
      assignment: {
        include: { project: { select: { id: true, name: true } } },
      },
    },
    orderBy: { date: "desc" },
  });

  return Response.json(
    entries.map((e) => ({
      ...e,
      hours: Number(e.hours),
      billableAmount: e.billableAmount ? Number(e.billableAmount) : null,
      date: e.date.toISOString(),
      approvedAt: e.approvedAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  // Only consultants and EMs may log time
  const canLog = ["CONSULTANT", "ENGAGEMENT_MANAGER"].includes(session.user.role);
  if (!canLog) return new Response("Forbidden", { status: 403 });

  const { assignmentId, date, description } = await req.json();

  if (!assignmentId || !date) {
    return new Response("Invalid input", { status: 400 });
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, rateAmount: true, rateType: true, rateCurrency: true, estimatedHours: true },
  });

  if (!assignment) return new Response("Assignment not found", { status: 404 });

  if (!assignment.estimatedHours) {
    return new Response("Hours not configured for this assignment", { status: 422 });
  }

  const hours = assignment.estimatedHours;
  const billableAmount =
    assignment.rateType === "HOURLY" ? Number(assignment.rateAmount) * hours : null;

  const entry = await prisma.timeEntry.create({
    data: {
      assignmentId,
      consultantId: session.user.id,
      date: new Date(date),
      hours,
      description: description ?? "",
      status: "PENDING",
      billableAmount,
      currency: assignment.rateCurrency,
    },
  });

  return Response.json({
    ...entry,
    hours: Number(entry.hours),
    billableAmount: entry.billableAmount ? Number(entry.billableAmount) : null,
    date: entry.date.toISOString(),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  });
}
