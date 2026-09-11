import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { canUseOfficeDesk, nextOccurrenceAfter } from "@/lib/office";
import { canAssignToOthers } from "@/lib/tasks";
import { FINANCE_READ_ROLES, PIPELINE_ROLES } from "@/lib/constants";

/**
 * GET /api/desk?forUserId=...
 *
 * One question, asked of everything: whose move is it?
 *
 * At any moment a thing is waiting on you, waiting on somebody else, waiting on
 * a date, or waiting on nobody. That is exhaustive and it does not overlap.
 *
 * This replaced a second screen, the principal's brief, which answered "what is
 * the state of the firm" and duplicated five of its nine categories here. The
 * two differences it had are kept as features rather than as a separate page:
 * you can open somebody else's desk, and firm-level facts appear alongside
 * personal ones. An ageing invoice nobody has chased is the office's move, and
 * saying so is more useful than listing it on a status board.
 *
 * The rule that keeps the buckets exclusive: work somebody submitted to you is
 * YOUR move, even though they own the task. Ownership is not the axis.
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

export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const requested = req.nextUrl.searchParams.get("forUserId");
  // Opening somebody else's desk is what the office does for the principal it
  // serves. Everyone else sees their own and only their own.
  if (requested && requested !== session.user.id && !canAssignToOthers(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const subjectId = requested || session.user.id;
  const subject = await prisma.user.findUnique({
    where: { id: subjectId },
    select: { id: true, name: true, role: true },
  });
  if (!subject) return Response.json({ error: "Not found" }, { status: 404 });

  const me = subject.id;
  const viewingSelf = me === session.user.id;
  const now = new Date();
  const weekOut = new Date(now.getTime() + 7 * 86400000);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  // Firm-level rows are gated on the VIEWER, not the subject: the office can
  // open the Founding Partner's desk without inheriting his finance sight.
  const seesFinance = FINANCE_READ_ROLES.includes(session.user.role as typeof FINANCE_READ_ROLES[number]);
  const seesPipeline = PIPELINE_ROLES.includes(session.user.role as typeof PIPELINE_ROLES[number]);

  const [
    myTasks, toReview, myDecisions, myCommitments, raisedDecisions, assignedOut,
    meetings, rhythms, nextActions, overdueInvoices, silentProposals, lowStock,
  ] = await Promise.all([
    prisma.task.findMany({
      where: { assigneeId: me, status: { in: ["ASSIGNED", "IN_PROGRESS", "CHANGES_REQUESTED", "BLOCKED"] } },
      select: { id: true, title: true, status: true, dueDate: true, checkInAt: true, assigner: { select: { name: true } } },
    }),
    prisma.task.findMany({
      where: { assignerId: me, status: "SUBMITTED" },
      select: { id: true, title: true, submittedAt: true, assignee: { select: { name: true } } },
    }),
    prisma.decision.findMany({
      where: { forUserId: me, status: "PENDING" },
      select: { id: true, title: true, dueBy: true, raisedBy: { select: { name: true } } },
    }),
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
    prisma.decision.findMany({
      where: { raisedById: me, status: "PENDING", NOT: { forUserId: me } },
      select: { id: true, title: true, dueBy: true, forUser: { select: { name: true } } },
    }),
    prisma.task.findMany({
      where: { assignerId: me, status: { in: ["ASSIGNED", "IN_PROGRESS", "CHANGES_REQUESTED", "BLOCKED"] }, NOT: { assigneeId: me } },
      select: { id: true, title: true, status: true, dueDate: true, assignee: { select: { name: true } } },
    }),
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
    prisma.communication.findMany({
      where: { nextActionAssignedToId: me, nextActionDate: { lte: weekOut } },
      orderBy: { nextActionDate: "asc" },
      select: { id: true, subject: true, nextAction: true, nextActionDate: true },
      take: 15,
    }),
    seesFinance
      ? prisma.invoice.findMany({
          where: { status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"] }, dueDate: { lt: now } },
          orderBy: { dueDate: "asc" },
          select: { id: true, invoiceNumber: true, dueDate: true, balanceDue: true, currency: true, client: { select: { name: true } } },
          take: 15,
        })
      : Promise.resolve([]),
    seesPipeline
      ? prisma.proposal.findMany({
          where: { status: "SENT", sentAt: { lt: weekAgo } },
          orderBy: { sentAt: "asc" },
          select: { id: true, title: true, clientName: true, sentAt: true },
          take: 15,
        })
      : Promise.resolve([]),
    prisma.$queryRaw<Array<{ id: string; name: string; quantityOnHand: number; reorderLevel: number; unit: string }>>`
      SELECT "id", "name", "quantityOnHand", "reorderLevel", "unit"
      FROM "StockItem" WHERE "quantityOnHand" <= "reorderLevel"
      ORDER BY "quantityOnHand" ASC LIMIT 15
    `,
  ]);

  const yoursNow: Row[] = [];
  const waitingOnOthers: Row[] = [];
  const scheduled: Row[] = [];

  for (const t of myTasks) {
    const isBlocked = t.status === "BLOCKED";
    yoursNow.push({
      kind: "TASK", id: t.id, title: t.title,
      detail: isBlocked
        ? `Marked blocked. ${t.assigner.name} has been told.`
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
        kind: "CHECK_IN", id: `${t.id}-checkin`, title: `Check in on: ${t.title}`,
        detail: `The mid-point conversation with ${t.assigner.name} was set for today or earlier.`,
        href: `/tasks/${t.id}`, date: t.checkInAt.toISOString(),
        urgency: urgencyOf(t.checkInAt, now), action: "Have the conversation",
      });
    }
  }

  for (const t of toReview) {
    yoursNow.push({
      kind: "REVIEW", id: t.id, title: t.title,
      detail: `${t.assignee.name} submitted this and it is waiting.`,
      href: `/tasks/${t.id}`, date: t.submittedAt?.toISOString() ?? null,
      urgency: "TODAY", action: "Review it",
    });
  }

  for (const d of myDecisions) {
    yoursNow.push({
      kind: "DECISION", id: d.id, title: d.title,
      detail: `${d.raisedBy.name} needs a decision.`,
      href: `/decisions#${d.id}`, date: d.dueBy?.toISOString() ?? null,
      urgency: urgencyOf(d.dueBy, now), action: "Decide",
    });
  }

  for (const c of nextActions) {
    const due = c.nextActionDate && c.nextActionDate <= now;
    const row: Row = {
      kind: "FOLLOW_UP", id: c.id, title: c.nextAction ?? c.subject ?? "Follow up",
      detail: "A follow-up set on a logged conversation.",
      href: "/communications", date: c.nextActionDate?.toISOString() ?? null,
      urgency: urgencyOf(c.nextActionDate, now), action: due ? "Follow up" : "Coming up",
    };
    (due ? yoursNow : scheduled).push(row);
  }

  // Firm-level, and all of it is somebody's move rather than a status line.
  for (const i of overdueInvoices) {
    yoursNow.push({
      kind: "INVOICE", id: i.id, title: `${i.invoiceNumber}, ${i.client.name}`,
      detail: `${i.currency} ${Number(i.balanceDue).toLocaleString()} outstanding, past its due date.`,
      href: `/finance/invoices/${i.id}`, date: i.dueDate?.toISOString() ?? null,
      urgency: "OVERDUE", action: "Chase it",
    });
  }
  for (const p of silentProposals) {
    yoursNow.push({
      kind: "PROPOSAL", id: p.id, title: `${p.title}, ${p.clientName}`,
      detail: "Sent over a week ago and nobody has replied.",
      href: "/proposals", date: p.sentAt?.toISOString() ?? null,
      urgency: "SOON", action: "Follow up",
    });
  }
  for (const s of lowStock) {
    yoursNow.push({
      kind: "STOCK", id: s.id, title: s.name,
      detail: `${s.quantityOnHand} ${s.unit}${s.quantityOnHand === 1 ? "" : "s"} left, reorder at ${s.reorderLevel}.`,
      href: "/inventory", date: null, urgency: "SOON", action: "Reorder",
    });
  }

  for (const c of myCommitments) {
    const who = c.owedByUser?.name ?? c.owedByName ?? "someone";
    const dueChase = !!c.nextChaseAt && c.nextChaseAt <= now;
    waitingOnOthers.push({
      kind: "COMMITMENT", id: c.id, title: c.what,
      detail: `${who}. ${c.chaseCount ? `Chased ${c.chaseCount} time${c.chaseCount === 1 ? "" : "s"}.` : "Never chased."}`,
      href: "/commitments", date: c.dueDate?.toISOString() ?? null,
      urgency: dueChase ? "TODAY" : urgencyOf(c.dueDate, now),
      action: dueChase ? "Chase it" : "Watching",
    });
  }
  for (const d of raisedDecisions) {
    waitingOnOthers.push({
      kind: "DECISION_OUT", id: d.id, title: d.title, detail: `With ${d.forUser.name}.`,
      href: `/decisions#${d.id}`, date: d.dueBy?.toISOString() ?? null,
      urgency: urgencyOf(d.dueBy, now), action: "Waiting",
    });
  }
  for (const t of assignedOut) {
    waitingOnOthers.push({
      kind: "TASK_OUT", id: t.id, title: t.title,
      detail: t.status === "BLOCKED" ? `${t.assignee.name} is blocked and needs an answer.` : `With ${t.assignee.name}.`,
      href: `/tasks/${t.id}`, date: t.dueDate?.toISOString() ?? null,
      urgency: t.status === "BLOCKED" ? "TODAY" : urgencyOf(t.dueDate, now),
      action: t.status === "BLOCKED" ? "Unblock them" : "Waiting",
    });
  }

  for (const m of meetings) {
    scheduled.push({
      kind: "MEETING", id: m.id, title: m.title,
      detail: `${m._count.participants} attending.${m.meetLink ? "" : " No join link, so nobody was invited."}`,
      href: `/meetings/${m.id}`, date: m.scheduledAt.toISOString(),
      urgency: urgencyOf(m.scheduledAt, now), action: m.meetLink ? "Prepare" : "Fix the link",
    });
  }
  for (const r of rhythms) {
    const next = nextOccurrenceAfter(r, now);
    if (!next) continue;
    if (new Date(next.getTime() - r.leadTimeDays * 86400000) > weekOut) continue;
    scheduled.push({
      kind: "RHYTHM", id: r.id, title: r.title,
      detail: "Recurring. It appears on the desk automatically.",
      href: "/rhythm", date: next.toISOString(), urgency: "NONE", action: "Coming up",
    });
  }

  const sortedNow = sortRows(yoursNow);
  return Response.json({
    generatedAt: now.toISOString(),
    subject: { ...subject, viewingSelf },
    canViewOthers: canAssignToOthers(session.user.role),
    yoursNow: sortedNow,
    waitingOnOthers: sortRows(waitingOnOthers),
    scheduled: sortRows(scheduled),
    headline: {
      yoursNow: sortedNow.length,
      late: sortedNow.filter((r) => r.urgency === "OVERDUE").length,
      waiting: waitingOnOthers.length,
      blocked: waitingOnOthers.filter((r) => r.action === "Unblock them").length,
      toChase: waitingOnOthers.filter((r) => r.action === "Chase it").length,
      scheduled: scheduled.length,
    },
  });
});
