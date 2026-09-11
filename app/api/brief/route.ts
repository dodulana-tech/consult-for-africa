import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { canUseOfficeDesk } from "@/lib/office";
import { FINANCE_READ_ROLES } from "@/lib/constants";

/**
 * GET /api/brief?forUserId=...
 *
 * The principal's brief. One read of everything that is either waiting on them
 * or slipping away from them, so the status conversation does not have to
 * happen. The office maintains it by keeping the underlying records straight;
 * nobody types this page.
 *
 * Defaults to the caller. The office can pull the brief for the principal whose
 * diary they run, which is the whole point of the screen.
 */
export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const forUserId = req.nextUrl.searchParams.get("forUserId") || session.user.id;
  const principal = await prisma.user.findUnique({
    where: { id: forUserId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!principal) return Response.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const weekOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const seesFinance = FINANCE_READ_ROLES.includes(session.user.role as typeof FINANCE_READ_ROLES[number]);

  const [
    diary,
    decisions,
    commitmentsOwedToThem,
    dueThisWeek,
    awaitingReview,
    blockedToThem,
    slipping,
    nextActions,
    overdueInvoices,
    silentProposals,
    lowStock,
  ] = await Promise.all([
    prisma.meeting.findMany({
      where: {
        scheduledAt: { gte: now, lte: weekOut },
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        OR: [{ organizerId: principal.id }, { participants: { some: { userId: principal.id } } }],
      },
      orderBy: { scheduledAt: "asc" },
      select: { id: true, title: true, type: true, scheduledAt: true, meetLink: true, participants: { select: { name: true } } },
      take: 25,
    }),

    prisma.decision.findMany({
      where: { forUserId: principal.id, status: "PENDING" },
      orderBy: [{ dueBy: "asc" }, { createdAt: "asc" }],
      select: { id: true, title: true, dueBy: true, recommendation: true, createdAt: true, raisedBy: { select: { name: true } } },
      take: 25,
    }),

    prisma.commitment.findMany({
      where: { owedToUserId: principal.id, status: { in: ["OPEN", "CHASED"] } },
      orderBy: [{ dueDate: "asc" }],
      select: {
        id: true, what: true, dueDate: true, status: true, chaseCount: true, lastChasedAt: true, nextChaseAt: true,
        owedByName: true, owedByUser: { select: { id: true, name: true } },
      },
      take: 50,
    }),

    prisma.task.findMany({
      where: { assigneeId: principal.id, status: { in: ["ASSIGNED", "IN_PROGRESS", "CHANGES_REQUESTED"] }, dueDate: { lte: weekOut } },
      orderBy: { dueDate: "asc" },
      select: { id: true, title: true, dueDate: true, status: true, assigner: { select: { name: true } } },
      take: 25,
    }),

    prisma.task.findMany({
      where: { assignerId: principal.id, status: "SUBMITTED" },
      orderBy: { submittedAt: "asc" },
      select: { id: true, title: true, submittedAt: true, assignee: { select: { name: true } } },
      take: 25,
    }),

    prisma.task.findMany({
      where: { assignerId: principal.id, status: "BLOCKED" },
      orderBy: { updatedAt: "asc" },
      select: { id: true, title: true, blockedReason: true, updatedAt: true, assignee: { select: { name: true } } },
      take: 25,
    }),

    prisma.task.findMany({
      where: {
        assignerId: principal.id,
        status: { in: ["ASSIGNED", "IN_PROGRESS", "CHANGES_REQUESTED"] },
        dueDate: { lt: now },
      },
      orderBy: { dueDate: "asc" },
      select: { id: true, title: true, dueDate: true, status: true, assignee: { select: { name: true } } },
      take: 25,
    }),

    prisma.communication.findMany({
      where: { nextActionAssignedToId: principal.id, nextActionDate: { lte: weekOut } },
      orderBy: { nextActionDate: "asc" },
      select: { id: true, subject: true, nextAction: true, nextActionDate: true, subjectType: true },
      take: 25,
    }),

    seesFinance
      ? prisma.invoice.findMany({
          where: { status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"] }, dueDate: { lt: now } },
          orderBy: { dueDate: "asc" },
          select: { id: true, invoiceNumber: true, dueDate: true, balanceDue: true, currency: true, client: { select: { name: true } } },
          take: 15,
        })
      : Promise.resolve([]),

    // Sent and heard nothing for over a week. A proposal nobody has chased is
    // the cheapest revenue in the building.
    prisma.proposal.findMany({
      where: { status: "SENT", sentAt: { lt: weekAgo } },
      orderBy: { sentAt: "asc" },
      select: { id: true, title: true, clientName: true, sentAt: true },
      take: 15,
    }),

    // Supplies at or below the reorder level. Running out of paper on the
    // morning of a board meeting is an office failure like any other, so it
    // belongs on the same page as everything else that is about to go wrong.
    prisma.$queryRaw<Array<{ id: string; name: string; quantityOnHand: number; reorderLevel: number; unit: string }>>`
      SELECT "id", "name", "quantityOnHand", "reorderLevel", "unit"
      FROM "StockItem"
      WHERE "quantityOnHand" <= "reorderLevel"
      ORDER BY "quantityOnHand" ASC
      LIMIT 15
    `,
  ]);

  const overdueCommitments = commitmentsOwedToThem.filter((c) => c.dueDate && c.dueDate < now);
  const dueForChase = commitmentsOwedToThem.filter((c) => c.nextChaseAt && c.nextChaseAt <= now);

  const payload = {
    principal,
    generatedAt: now.toISOString(),
    diary,
    decisions,
    commitments: {
      open: commitmentsOwedToThem,
      overdue: overdueCommitments,
      dueForChase,
    },
    tasks: { dueThisWeek, awaitingReview, blocked: blockedToThem, slipping },
    nextActions,
    money: { overdueInvoices, silentProposals, visible: seesFinance },
    lowStock,
    // What the office should clear first, in the order it should be cleared.
    headline: {
      decisionsWaiting: decisions.length,
      reviewsWaiting: awaitingReview.length,
      blocked: blockedToThem.length,
      commitmentsOverdue: overdueCommitments.length,
      tasksSlipping: slipping.length,
      meetingsThisWeek: diary.length,
      suppliesLow: lowStock.length,
    },
  };

  return Response.json(JSON.parse(JSON.stringify(payload)));
});
