import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { canUseOfficeDesk, nextChaseDate } from "@/lib/office";
import { COMMITMENT_SELECT } from "../route";
import type { CommitmentStatus, Prisma } from "@prisma/client";

const CLOSED: CommitmentStatus[] = ["HONOURED", "MISSED", "DROPPED"];

/**
 * PATCH /api/commitments/[id]
 *
 * Two things happen here: the office records a chase, and somebody closes the
 * commitment out. `chased: true` is its own action rather than a status write,
 * because the count and the date are the evidence that the office did its job
 * even when the other side did not.
 */
export const PATCH = handler(async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const existing = await prisma.commitment.findUnique({ where: { id }, select: { id: true, dueDate: true, status: true, chaseCount: true } });
  if (!existing) return Response.json({ error: "Commitment not found" }, { status: 404 });

  const body = await req.json();
  const data: Prisma.CommitmentUpdateInput = {};
  const now = new Date();

  if (body.chased === true) {
    data.lastChasedAt = now;
    data.chaseCount = existing.chaseCount + 1;
    data.nextChaseAt = nextChaseDate(existing.dueDate, now);
    if (existing.status === "OPEN") data.status = "CHASED";
  }

  if (typeof body.status === "string" && body.status !== existing.status) {
    const next = body.status as CommitmentStatus;
    if (!["OPEN", "CHASED", ...CLOSED].includes(next)) {
      return Response.json({ error: "Unknown status" }, { status: 400 });
    }
    data.status = next;
    if (CLOSED.includes(next)) {
      data.closedAt = now;
      data.nextChaseAt = null;
    } else {
      data.closedAt = null;
      data.nextChaseAt = nextChaseDate(existing.dueDate, now);
    }
  }

  if (typeof body.what === "string") {
    if (!body.what.trim()) return Response.json({ error: "Say what was promised." }, { status: 400 });
    data.what = body.what.trim();
  }
  if ("dueDate" in body) {
    const due = body.dueDate ? new Date(body.dueDate) : null;
    data.dueDate = due;
    // A moved date resets the chase rhythm, otherwise it keeps the old urgency.
    if (!CLOSED.includes((data.status as CommitmentStatus) ?? existing.status)) {
      data.nextChaseAt = nextChaseDate(due, now);
    }
  }
  if ("note" in body) data.note = body.note?.trim() || null;
  if ("owedByName" in body) data.owedByName = body.owedByName?.trim() || null;
  if ("owedByEmail" in body) data.owedByEmail = body.owedByEmail?.trim().toLowerCase() || null;

  if (!Object.keys(data).length) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const commitment = await prisma.commitment.update({ where: { id }, data, select: COMMITMENT_SELECT });

  await logAudit({
    userId: session.user.id,
    action: body.chased === true ? "UPDATE" : "STATUS_CHANGE",
    entityType: "Commitment",
    entityId: commitment.id,
    entityName: commitment.what.slice(0, 120),
    details: { chased: body.chased === true, status: commitment.status },
  });

  return Response.json({ commitment: JSON.parse(JSON.stringify(commitment)) });
});

export const DELETE = handler(async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const existing = await prisma.commitment.findUnique({ where: { id }, select: { recordedById: true } });
  if (!existing) return Response.json({ error: "Commitment not found" }, { status: 404 });
  // Only the person who wrote it down can remove it. Everyone else marks it
  // DROPPED, which keeps the record of it having existed.
  if (existing.recordedById !== session.user.id) {
    return Response.json({ error: "Mark it dropped rather than deleting somebody else's record." }, { status: 403 });
  }
  await prisma.commitment.delete({ where: { id } });
  return Response.json({ ok: true });
});
