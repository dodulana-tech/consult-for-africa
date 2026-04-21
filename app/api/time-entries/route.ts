import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import type { TimeEntryStatus } from "@prisma/client";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const consultantId = searchParams.get("consultantId");

  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  const isEM = session.user.role === "ENGAGEMENT_MANAGER";

  const baseWhere = isElevated
    ? {}
    : isEM
    ? { assignment: { engagement: { engagementManagerId: session.user.id } } }
    : { consultantId: session.user.id };

  const entries = await prisma.timeEntry.findMany({
    where: {
      ...baseWhere,
      ...(status ? { status: status as TimeEntryStatus } : {}),
      ...(consultantId && (isEM || isElevated) ? { consultantId } : {}),
    },
    include: {
      consultant: { select: { id: true, name: true, email: true } },
      assignment: {
        include: { engagement: { select: { id: true, name: true } } },
      },
    },
    orderBy: { date: "desc" },
  });

  return Response.json(
    entries.map((e) => ({
      ...e,
      hours: Number(e.hours),
      hoursWorked: e.hoursWorked ? Number(e.hoursWorked) : null,
      billableAmount: e.billableAmount ? Number(e.billableAmount) : null,
      date: e.date.toISOString(),
      approvedAt: e.approvedAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }))
  );
});

export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canLog = ["CONSULTANT", "ENGAGEMENT_MANAGER"].includes(session.user.role);
  if (!canLog) return new Response("Forbidden", { status: 403 });

  const { assignmentId, date, description, hours: inputHours, periodMonth, periodYear, trackId: inputTrackId } = await req.json();

  if (!assignmentId || !date) {
    return new Response("Invalid input", { status: 400 });
  }

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      rateAmount: true,
      rateType: true,
      rateCurrency: true,
      estimatedHours: true,
      estimatedDays: true,
      trackId: true,
      engagement: {
        select: {
          id: true,
          engagementType: true,
          retainerHoursPool: true,
        },
      },
    },
  });

  if (!assignment) return new Response("Assignment not found", { status: 404 });

  // Resolve trackId: use explicit input, fall back to assignment's trackId
  const resolvedTrackId = inputTrackId ?? assignment.trackId ?? null;

  let hours: number;
  let hoursWorked: number | null = null;
  let billableAmount: number | null = null;

  switch (assignment.rateType) {
    case "HOURLY": {
      const h = Number(inputHours);
      if (!h || h < 0.25 || h > 24) {
        return new Response("Hours must be between 0.25 and 24", { status: 400 });
      }
      hoursWorked = h;
      hours = h;
      billableAmount = Number(assignment.rateAmount) * h;
      break;
    }
    case "DAILY": {
      hours = 8;
      billableAmount = Number(assignment.rateAmount);
      break;
    }
    case "MONTHLY": {
      if (!periodMonth || !periodYear) {
        return new Response("periodMonth and periodYear required for monthly rate", { status: 400 });
      }
      hours = 0;
      billableAmount = Number(assignment.rateAmount);
      break;
    }
    case "FIXED_PROJECT":
    case "FIXED_DELIVERABLE": {
      hours = inputHours ? Number(inputHours) : 0;
      billableAmount = null;
      break;
    }
    default: {
      hours = assignment.estimatedHours ?? 0;
      billableAmount = null;
    }
  }

  const entry = await prisma.timeEntry.create({
    data: {
      assignmentId,
      consultantId: session.user.id,
      date: new Date(date),
      hours,
      hoursWorked,
      description: description ?? "",
      status: "PENDING",
      billableAmount,
      currency: assignment.rateCurrency,
      periodMonth: periodMonth ?? null,
      periodYear: periodYear ?? null,
      ...(resolvedTrackId ? { trackId: resolvedTrackId } : {}),
    },
  });

  // Check for retainer overage: if this is a RETAINER engagement with an hours pool,
  // check if total hours logged this month exceeds the pool allocation.
  let overageWarning = false;
  if (
    assignment.engagement &&
    assignment.engagement.engagementType === "RETAINER" &&
    assignment.engagement.retainerHoursPool
  ) {
    const entryDate = new Date(date);
    const monthStart = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
    const monthEnd = new Date(entryDate.getFullYear(), entryDate.getMonth() + 1, 1);

    // Sum all hours logged for this engagement in the same month
    const monthlyEntries = await prisma.timeEntry.findMany({
      where: {
        assignment: {
          engagementId: assignment.engagement.id,
        },
        date: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
      select: { hours: true },
    });

    const totalHoursThisMonth = monthlyEntries.reduce(
      (sum, e) => sum + Number(e.hours),
      0,
    );

    if (totalHoursThisMonth > assignment.engagement.retainerHoursPool) {
      overageWarning = true;
    }
  }

  return Response.json({
    ...entry,
    hours: Number(entry.hours),
    hoursWorked: entry.hoursWorked ? Number(entry.hoursWorked) : null,
    billableAmount: entry.billableAmount ? Number(entry.billableAmount) : null,
    date: entry.date.toISOString(),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    ...(overageWarning ? { overageWarning: true } : {}),
  });
});
