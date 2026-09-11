import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { canUseOfficeDesk } from "@/lib/office";
import { DECISION_SELECT } from "../route";
import type { DecisionStatus, Prisma } from "@prisma/client";

/**
 * PATCH /api/decisions/[id]
 *
 * Deciding is the principal's alone. The person who raised it can still correct
 * the brief while it is pending, because a decision taken on a wrong background
 * is worse than one taken late.
 */
export const PATCH = handler(async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const existing = await prisma.decision.findUnique({
    where: { id },
    select: { id: true, forUserId: true, raisedById: true, status: true },
  });
  if (!existing) return Response.json({ error: "Decision not found" }, { status: 404 });

  const isPrincipal = existing.forUserId === session.user.id;
  const isRaiser = existing.raisedById === session.user.id;
  if (!isPrincipal && !isRaiser) {
    return Response.json({ error: "This decision is not yours." }, { status: 403 });
  }

  const body = await req.json();
  const data: Prisma.DecisionUpdateInput = {};

  if (typeof body.status === "string" && body.status !== existing.status) {
    if (!isPrincipal) {
      return Response.json({ error: "Only the person it is addressed to can decide it." }, { status: 403 });
    }
    const next = body.status as DecisionStatus;
    if (!["PENDING", "DECIDED", "DEFERRED", "DECLINED"].includes(next)) {
      return Response.json({ error: "Unknown status" }, { status: 400 });
    }
    if (next === "DECIDED" && !body.outcome?.trim()) {
      return Response.json({ error: "Say what you decided. An outcome nobody wrote down is not a decision." }, { status: 400 });
    }
    data.status = next;
    if (next === "PENDING") {
      data.decidedAt = null;
      data.decidedBy = { disconnect: true };
    } else {
      data.decidedAt = new Date();
      data.decidedBy = { connect: { id: session.user.id } };
    }
    if (typeof body.outcome === "string") data.outcome = body.outcome.trim() || null;
  } else if (typeof body.outcome === "string" && isPrincipal) {
    data.outcome = body.outcome.trim() || null;
  }

  // The brief itself belongs to whoever prepared it, and only while it is open.
  if (isRaiser && existing.status === "PENDING") {
    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
    if (typeof body.background === "string" && body.background.trim()) data.background = body.background.trim();
    if (Array.isArray(body.options)) {
      const cleaned = body.options.map((o: string) => String(o).trim()).filter(Boolean);
      if (cleaned.length < 2) {
        return Response.json({ error: "Give at least two options." }, { status: 400 });
      }
      data.options = cleaned;
    }
    if (typeof body.recommendation === "string" && body.recommendation.trim()) data.recommendation = body.recommendation.trim();
    if ("costOfDelay" in body) data.costOfDelay = body.costOfDelay?.trim() || null;
    if ("dueBy" in body) data.dueBy = body.dueBy ? new Date(body.dueBy) : null;
  }

  if (!Object.keys(data).length) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const decision = await prisma.decision.update({ where: { id }, data, select: DECISION_SELECT });

  await logAudit({
    userId: session.user.id,
    action: data.status ? "STATUS_CHANGE" : "UPDATE",
    entityType: "Decision",
    entityId: decision.id,
    entityName: decision.title,
    details: { status: decision.status },
  });

  return Response.json({ decision: JSON.parse(JSON.stringify(decision)) });
});
