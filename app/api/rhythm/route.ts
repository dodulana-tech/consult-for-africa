import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { canManageRhythm, canUseOfficeDesk, nextOccurrenceAfter } from "@/lib/office";
import { canUseTaskBoard } from "@/lib/tasks";
import type { Prisma, RecurrenceCadence } from "@prisma/client";

const PERSON = { select: { id: true, name: true, email: true, role: true } };

export const RHYTHM_SELECT = {
  id: true,
  title: true,
  brief: true,
  definitionOfDone: true,
  cadence: true,
  dayOfWeek: true,
  dayOfMonth: true,
  monthOfYear: true,
  leadTimeDays: true,
  checkInOffsetDays: true,
  estimatedMinutes: true,
  active: true,
  lastGeneratedFor: true,
  createdAt: true,
  assignee: PERSON,
  assigner: PERSON,
  _count: { select: { generatedTasks: true } },
} satisfies Prisma.RecurringTaskSelect;

const CADENCES: RecurrenceCadence[] = ["WEEKLY", "FORTNIGHTLY", "MONTHLY", "QUARTERLY", "ANNUAL"];

export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const includeInactive = req.nextUrl.searchParams.get("includeInactive") === "true";
  const rhythms = await prisma.recurringTask.findMany({
    where: includeInactive ? {} : { active: true },
    select: RHYTHM_SELECT,
    orderBy: [{ active: "desc" }, { cadence: "asc" }, { title: "asc" }],
  });

  // The next date each one falls due, so the page reads as a calendar rather
  // than as a list of rules.
  const now = new Date();
  const withNext = rhythms.map((r) => ({
    ...r,
    nextOccurrence: nextOccurrenceAfter(r, now)?.toISOString() ?? null,
  }));

  return Response.json({ rhythms: JSON.parse(JSON.stringify(withNext)) });
});

/**
 * POST /api/rhythm
 *
 * Defining the firm's cadence is narrower than running it: the Administrative
 * Assistant works the rhythm, she does not set it.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageRhythm(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, brief, definitionOfDone, assigneeId, cadence, dayOfWeek, dayOfMonth, monthOfYear, leadTimeDays, checkInOffsetDays, estimatedMinutes } = body;

  if (!title?.trim()) return Response.json({ error: "Give it a title." }, { status: 400 });
  if (!brief?.trim()) return Response.json({ error: "A brief is required, the same as any other task." }, { status: 400 });
  if (!definitionOfDone?.trim()) return Response.json({ error: "A definition of done is required." }, { status: 400 });
  if (!CADENCES.includes(cadence)) return Response.json({ error: "Pick a cadence." }, { status: 400 });
  if (!assigneeId?.trim()) return Response.json({ error: "Say whose desk this lands on." }, { status: 400 });

  if (["WEEKLY", "FORTNIGHTLY"].includes(cadence) && !dayOfWeek) {
    return Response.json({ error: "Pick a day of the week." }, { status: 400 });
  }
  if (["MONTHLY", "QUARTERLY", "ANNUAL"].includes(cadence) && !dayOfMonth) {
    return Response.json({ error: "Pick a day of the month." }, { status: 400 });
  }

  const assignee = await prisma.user.findUnique({ where: { id: assigneeId }, select: { id: true, role: true } });
  if (!assignee) return Response.json({ error: "Assignee not found" }, { status: 404 });
  if (!canUseTaskBoard(assignee.role)) {
    return Response.json({ error: "That person does not have a task board." }, { status: 400 });
  }

  const clamp = (n: unknown, lo: number, hi: number) => {
    const v = Number(n);
    return Number.isFinite(v) ? Math.min(Math.max(Math.round(v), lo), hi) : null;
  };

  const rhythm = await prisma.recurringTask.create({
    data: {
      title: title.trim(),
      brief: brief.trim(),
      definitionOfDone: definitionOfDone.trim(),
      assigneeId: assignee.id,
      assignerId: session.user.id,
      cadence,
      dayOfWeek: clamp(dayOfWeek, 1, 7),
      // Capped at 28 so a monthly cadence never skips February.
      dayOfMonth: clamp(dayOfMonth, 1, 28),
      monthOfYear: clamp(monthOfYear, 1, 12),
      leadTimeDays: clamp(leadTimeDays, 0, 60) ?? 0,
      checkInOffsetDays: clamp(checkInOffsetDays, 0, 60),
      estimatedMinutes: clamp(estimatedMinutes, 1, 10000),
    },
    select: RHYTHM_SELECT,
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "RecurringTask",
    entityId: rhythm.id,
    entityName: rhythm.title,
  });

  return Response.json({ rhythm: JSON.parse(JSON.stringify(rhythm)) }, { status: 201 });
});
