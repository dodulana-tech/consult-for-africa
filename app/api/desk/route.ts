import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { canUseOfficeDesk, nextOccurrenceAfter } from "@/lib/office";

/**
 * GET /api/desk
 *
 * One question, asked of everything: whose move is it?
 *
 * At any moment a thing is waiting on you, waiting on somebody else, waiting on
 * a date, or waiting on nobody. That is exhaustive and it does not overlap,
 * which is what the sidebar could never be, because the sidebar is grouped by
 * what the software is rather than by what the person has to do.
 *
 * The rule that keeps it exclusive: a task somebody submitted to you is YOUR
 * move, not theirs, even though they own the task. Ownership is not the axis.
 */

type Urgency = "OVERDUE" | "TODAY" | "SOON" | "NONE";

interface Row {
  kind: string;
  id: string;
  title: string;
  detail: string;
  href: string;
  date: string | null;
  urgency: Urgency;
  /** What the person is expected to do with it, in two or three words. */
  action: string;
}

function urgencyOf(date: Date | null, now: Date): Urgency {
  if (!date) return "NONE";
  const days = Math.floor((date.getTime() - now.getTime()) / 86400000);
  if (days < 0) return "OVERDUE";
  if (days === 0) return "TODAY";
  if (days <= 3) return "SOON";
  return "NONE";
}

const ORDER: Record<Urgency, number> = { OVERDUE: 0, TODAY: 1, SOON: 2, NONE: 3 };

function sortRows(rows: Row[]): Row[] {
  return rows.sort((a, b) => {
    if (ORDER[a.urgency] !== ORDER[b.urgency]) return ORDER[a.urgency] - ORDER[b.urgency];
    if (a.date && b.date) return a.date.localeCompare(b.date);
    return a.date ? -1 : b.date ? 1 : 0;
  });
}

export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const me = session.user.id;
  const now = new Date();
  const weekOut = new Date(now.getTime() + 7 * 86400000);

  const [myTasks, toReview, myDecisions, myCommitments, raisedDecisions, assignedOut, meetings, rhythms] =
    await Promise.all([
      // Mine: work on my desk, and anything sent back to me.
      prisma.task.findMany({
        where: { assigneeId: me, status: { in: ["ASSIGNED", "IN_PROGRESS", "CHANGES_REQUESTED", "BLOCKED"] } },
        select: { id: true, title: true, status: true, dueDate: true, checkInAt: true, assigner: { select: { name: true } } },
      }),
      // Mine: somebody handed work back and it is sitting on me.
      prisma.task.findMany({
        where: { assignerId: me, status: "SUBMITTED" },
        select: { id: true, title: true, submittedAt: true, assignee: { select: { name: true } } },
      }),
      // Mine: a decision addressed to me.
      prisma.decision.findMany({
        where: { forUserId: me, status: "PENDING" },
        select: { id: true, title: true, dueBy: true, raisedBy: { select: { name: true } } },
      }),
      // Theirs: promises owed, and whether they are due a chase.
      prisma.commitment.findMany({
        where: {
          status: { in: ["OPEN", "CHASED"] },
          OR: [{ owedToUserId: me }, { recordedById: me }],
          NOT: { owedByUserId: me },
        },
        select: {
          id: true, what: true, dueDate: true, nextChaseAt: true, chaseCount: true,
          owedByName: true, owedByUser: { select: { name: true } },
        },
      }),
      // Theirs: a decision I put in front of somebody else.
      prisma.decision.findMany({
        where: { raisedById: me, status: "PENDING", NOT: { forUserId: me } },
        select: { id: true, title: true, dueBy: true, forUser: { select: { name: true } } },
      }),
      // Theirs: work I handed out that is still being done.
      prisma.task.findMany({
        where: { assignerId: me, status: { in: ["ASSIGNED", "IN_PROGRESS", "CHANGES_REQUESTED", "BLOCKED"] }, NOT: { assigneeId: me } },
        select: { id: true, title: true, status: true, dueDate: true, assignee: { select: { name: true } } },
      }),
      // Scheduled.
      prisma.meeting.findMany({
        where: {
          scheduledAt: { gte: now, lte: weekOut },
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          OR: [{ organizerId: me }, { participants: { some: { userId: me } } }],
        },
        select: { id: true, title: true, scheduledAt: true, meetLink: true, _count: { select: { participants: true } } },
      }),
      prisma.recurringTask.findMany({
        where: { active: true, assigneeId: me },
        select: { id: true, title: true, cadence: true, dayOfWeek: true, dayOfMonth: true, monthOfYear: true, leadTimeDays: true },
      }),
    ]);

  const yoursNow: Row[] = [];
  const waitingOnOthers: Row[] = [];
  const scheduled: Row[] = [];

  for (const t of myTasks) {
    // A blocked task is still your move: you raised the block, and it sits
    // until the other side answers. Surfaced here so it cannot be forgotten.
    const isBlocked = t.status === "BLOCKED";
    yoursNow.push({
      kind: "TASK",
      id: t.id,
      title: t.title,
      detail: isBlocked
        ? `You marked this blocked. ${t.assigner.name} has been told.`
        : t.status === "CHANGES_REQUESTED"
          ? `${t.assigner.name} sent this back with a note.`
          : `From ${t.assigner.name}.`,
      href: `/tasks/${t.id}`,
      date: t.dueDate?.toISOString() ?? null,
      urgency: isBlocked ? "NONE" : urgencyOf(t.dueDate, now),
      action: t.status === "CHANGES_REQUESTED" ? "Pick it back up" : isBlocked ? "Waiting on an answer" : "Do it",
    });

    if (t.checkInAt && t.checkInAt <= now && !isBlocked) {
      yoursNow.push({
        kind: "CHECK_IN",
        id: `${t.id}-checkin`,
        title: `Check in on: ${t.title}`,
        detail: `The mid-point conversation with ${t.assigner.name} was set for today or earlier.`,
        href: `/tasks/${t.id}`,
        date: t.checkInAt.toISOString(),
        urgency: urgencyOf(t.checkInAt, now),
        action: "Have the conversation",
      });
    }
  }

  for (const t of toReview) {
    yoursNow.push({
      kind: "REVIEW",
      id: t.id,
      title: t.title,
      detail: `${t.assignee.name} submitted this and it is waiting on you.`,
      href: `/tasks/${t.id}`,
      date: t.submittedAt?.toISOString() ?? null,
      urgency: "TODAY",
      action: "Review it",
    });
  }

  for (const d of myDecisions) {
    yoursNow.push({
      kind: "DECISION",
      id: d.id,
      title: d.title,
      detail: `${d.raisedBy.name} needs a decision from you.`,
      href: `/decisions#${d.id}`,
      date: d.dueBy?.toISOString() ?? null,
      urgency: urgencyOf(d.dueBy, now),
      action: "Decide",
    });
  }

  for (const c of myCommitments) {
    const who = c.owedByUser?.name ?? c.owedByName ?? "someone";
    const dueChase = !!c.nextChaseAt && c.nextChaseAt <= now;
    waitingOnOthers.push({
      kind: "COMMITMENT",
      id: c.id,
      title: c.what,
      detail: `${who}. ${c.chaseCount ? `Chased ${c.chaseCount} time${c.chaseCount === 1 ? "" : "s"}.` : "Never chased."}`,
      href: "/commitments",
      date: c.dueDate?.toISOString() ?? null,
      urgency: dueChase ? "TODAY" : urgencyOf(c.dueDate, now),
      action: dueChase ? "Chase it" : "Watching",
    });
  }

  for (const d of raisedDecisions) {
    waitingOnOthers.push({
      kind: "DECISION_OUT",
      id: d.id,
      title: d.title,
      detail: `With ${d.forUser.name}.`,
      href: `/decisions#${d.id}`,
      date: d.dueBy?.toISOString() ?? null,
      urgency: urgencyOf(d.dueBy, now),
      action: "Waiting",
    });
  }

  for (const t of assignedOut) {
    waitingOnOthers.push({
      kind: "TASK_OUT",
      id: t.id,
      title: t.title,
      detail: t.status === "BLOCKED" ? `${t.assignee.name} is blocked and needs you.` : `With ${t.assignee.name}.`,
      href: `/tasks/${t.id}`,
      date: t.dueDate?.toISOString() ?? null,
      urgency: t.status === "BLOCKED" ? "TODAY" : urgencyOf(t.dueDate, now),
      action: t.status === "BLOCKED" ? "Unblock them" : "Waiting",
    });
  }

  for (const m of meetings) {
    scheduled.push({
      kind: "MEETING",
      id: m.id,
      title: m.title,
      detail: `${m._count.participants} attending.${m.meetLink ? "" : " No join link, so nobody was invited."}`,
      href: `/meetings/${m.id}`,
      date: m.scheduledAt.toISOString(),
      urgency: urgencyOf(m.scheduledAt, now),
      action: m.meetLink ? "Prepare" : "Fix the link",
    });
  }

  for (const r of rhythms) {
    const next = nextOccurrenceAfter(r, now);
    if (!next) continue;
    const raiseAt = new Date(next.getTime() - r.leadTimeDays * 86400000);
    if (raiseAt > weekOut) continue;
    scheduled.push({
      kind: "RHYTHM",
      id: r.id,
      title: r.title,
      detail: "Recurring. It will appear on your desk automatically.",
      href: "/rhythm",
      date: next.toISOString(),
      urgency: "NONE",
      action: "Coming up",
    });
  }

  return Response.json({
    generatedAt: now.toISOString(),
    yoursNow: sortRows(yoursNow),
    waitingOnOthers: sortRows(waitingOnOthers),
    scheduled: sortRows(scheduled),
  });
});
