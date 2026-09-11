import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { canUseOfficeDesk } from "@/lib/office";
import type { DecisionStatus, Prisma } from "@prisma/client";

const PERSON = { select: { id: true, name: true, email: true, role: true } };

export const DECISION_SELECT = {
  id: true,
  title: true,
  background: true,
  options: true,
  recommendation: true,
  costOfDelay: true,
  dueBy: true,
  status: true,
  outcome: true,
  decidedAt: true,
  linkedEntityType: true,
  linkedEntityId: true,
  createdAt: true,
  forUser: PERSON,
  raisedBy: PERSON,
  decidedBy: PERSON,
} satisfies Prisma.DecisionSelect;

const VALID: DecisionStatus[] = ["PENDING", "DECIDED", "DEFERRED", "DECLINED"];

/**
 * GET /api/decisions
 *
 * `view=mine` is the principal's own queue: everything waiting on them, oldest
 * and most urgent first, so it can be cleared in one sitting.
 */
export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const view = searchParams.get("view") ?? "mine";
  const statusParam = searchParams.get("status");
  const forUserId = searchParams.get("forUserId");

  const where: Prisma.DecisionWhereInput = {};
  if (view === "mine") where.forUserId = session.user.id;
  else if (view === "raised") where.raisedById = session.user.id;
  if (forUserId) where.forUserId = forUserId;

  if (statusParam === "open") where.status = "PENDING";
  else if (statusParam) {
    const requested = statusParam.split(",").filter((s): s is DecisionStatus => VALID.includes(s as DecisionStatus));
    if (requested.length) where.status = { in: requested };
  }

  const decisions = await prisma.decision.findMany({
    where,
    select: DECISION_SELECT,
    orderBy: [{ status: "asc" }, { dueBy: "asc" }, { createdAt: "asc" }],
    take: 200,
  });

  return Response.json({ decisions: JSON.parse(JSON.stringify(decisions)) });
});

/**
 * POST /api/decisions
 *
 * The required fields are the whole point. Background, at least two options and
 * a recommendation mean the assistant has done the thinking before the
 * principal is interrupted. A decision raised without them is just a forwarded
 * problem, so this refuses one.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseOfficeDesk(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, background, options, recommendation, costOfDelay, dueBy, forUserId, linkedEntityType, linkedEntityId } = body;

  if (!title?.trim()) return Response.json({ error: "Give the decision a title." }, { status: 400 });
  if (!background?.trim()) {
    return Response.json({ error: "Set out the background. The point is that it can be decided without a meeting." }, { status: 400 });
  }
  const cleanOptions = Array.isArray(options) ? options.map((o: string) => String(o).trim()).filter(Boolean) : [];
  if (cleanOptions.length < 2) {
    return Response.json({ error: "Give at least two options. One option is not a decision." }, { status: 400 });
  }
  if (!recommendation?.trim()) {
    return Response.json({ error: "Say which one you would pick and why. Raising a decision without a recommendation just moves the work." }, { status: 400 });
  }
  if (!forUserId?.trim()) return Response.json({ error: "Say whose decision this is." }, { status: 400 });

  const principal = await prisma.user.findUnique({ where: { id: forUserId }, select: { id: true, name: true } });
  if (!principal) return Response.json({ error: "That person was not found." }, { status: 404 });

  const decision = await prisma.decision.create({
    data: {
      title: title.trim(),
      background: background.trim(),
      options: cleanOptions,
      recommendation: recommendation.trim(),
      costOfDelay: costOfDelay?.trim() || null,
      dueBy: dueBy ? new Date(dueBy) : null,
      forUserId: principal.id,
      raisedById: session.user.id,
      linkedEntityType: linkedEntityType?.trim() || null,
      linkedEntityId: linkedEntityId?.trim() || null,
    },
    select: DECISION_SELECT,
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Decision",
    entityId: decision.id,
    entityName: decision.title,
    details: { forUserId: principal.id },
  });

  return Response.json({ decision: JSON.parse(JSON.stringify(decision)) }, { status: 201 });
});
