import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { canUseOfficeDesk, nextChaseDate } from "@/lib/office";
import type { CommitmentStatus, Prisma } from "@prisma/client";

const PERSON = { select: { id: true, name: true, email: true } };

export const COMMITMENT_SELECT = {
  id: true,
  what: true,
  owedByName: true,
  owedByEmail: true,
  dueDate: true,
  status: true,
  sourceType: true,
  sourceId: true,
  lastChasedAt: true,
  chaseCount: true,
  nextChaseAt: true,
  closedAt: true,
  note: true,
  createdAt: true,
  owedByUser: PERSON,
  owedToUser: PERSON,
  recordedBy: PERSON,
  meeting: { select: { id: true, title: true, scheduledAt: true } },
} satisfies Prisma.CommitmentSelect;

const VALID_STATUSES: CommitmentStatus[] = ["OPEN", "CHASED", "HONOURED", "MISSED", "DROPPED"];

/**
 * GET /api/commitments
 *
 * The register of who promised what. `view=owing` is what somebody owes, and
 * `view=chasing` is what the office is chasing on the principal's behalf.
 */
export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const view = searchParams.get("view") ?? "all";
  const statusParam = searchParams.get("status");
  const owedToUserId = searchParams.get("owedToUserId");
  const meetingId = searchParams.get("meetingId");

  const where: Prisma.CommitmentWhereInput = {};
  if (view === "owing") where.owedByUserId = session.user.id;
  if (view === "chasing") where.recordedById = session.user.id;
  if (owedToUserId) where.owedToUserId = owedToUserId;
  if (meetingId) where.meetingId = meetingId;

  if (statusParam === "open") {
    where.status = { in: ["OPEN", "CHASED"] };
  } else if (statusParam) {
    const requested = statusParam
      .split(",")
      .filter((s): s is CommitmentStatus => VALID_STATUSES.includes(s as CommitmentStatus));
    if (requested.length) where.status = { in: requested };
  }

  const commitments = await prisma.commitment.findMany({
    where,
    select: COMMITMENT_SELECT,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    take: 300,
  });

  return Response.json({ commitments: JSON.parse(JSON.stringify(commitments)) });
});

/**
 * POST /api/commitments
 *
 * Records a promise. The person who owes it can be one of ours or a name and an
 * email, because most of what gets forgotten was promised by somebody we cannot
 * assign a task to.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { what, owedByUserId, owedByName, owedByEmail, owedToUserId, dueDate, sourceType, sourceId, meetingId, note } = body;

  if (!what?.trim()) {
    return Response.json({ error: "Say what was promised." }, { status: 400 });
  }
  if (!owedByUserId && !owedByName?.trim()) {
    return Response.json({ error: "Say who owes it, by name if they are not on the platform." }, { status: 400 });
  }

  const due = dueDate ? new Date(dueDate) : null;
  const commitment = await prisma.commitment.create({
    data: {
      what: what.trim(),
      owedByUserId: owedByUserId || null,
      owedByName: owedByName?.trim() || null,
      owedByEmail: owedByEmail?.trim().toLowerCase() || null,
      owedToUserId: owedToUserId || null,
      dueDate: due,
      sourceType: sourceType?.trim() || "MANUAL",
      sourceId: sourceId || null,
      meetingId: meetingId || null,
      note: note?.trim() || null,
      nextChaseAt: nextChaseDate(due),
      recordedById: session.user.id,
    },
    select: COMMITMENT_SELECT,
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Commitment",
    entityId: commitment.id,
    entityName: commitment.what.slice(0, 120),
  });

  return Response.json({ commitment: JSON.parse(JSON.stringify(commitment)) }, { status: 201 });
});
