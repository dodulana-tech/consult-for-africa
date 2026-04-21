import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PUT /api/admin/consultants/[id]/own-gig-override
 * Grant or update own gig override for a consultant.
 */
export const PUT = handler(async function PUT(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id: consultantId } = await params;
  const body = await req.json();

  const { maxConcurrent, maxBudgetNGN, maxBudgetUSD, minFeePct, reason } = body;

  if (!reason?.trim()) {
    return Response.json({ error: "Reason is required" }, { status: 400 });
  }

  const mc = Number(maxConcurrent ?? 1);
  const bn = Number(maxBudgetNGN ?? 5_000_000);
  const bu = Number(maxBudgetUSD ?? 3_500);
  const fp = Number(minFeePct ?? 10);

  if (isNaN(mc) || mc < 1 || mc > 100) return Response.json({ error: "maxConcurrent must be 1-100" }, { status: 400 });
  if (isNaN(bn) || bn < 0) return Response.json({ error: "maxBudgetNGN must be positive" }, { status: 400 });
  if (isNaN(bu) || bu < 0) return Response.json({ error: "maxBudgetUSD must be positive" }, { status: 400 });
  if (isNaN(fp) || fp < 5 || fp > 20) return Response.json({ error: "minFeePct must be 5-20" }, { status: 400 });

  const profile = await prisma.consultantProfile.findUnique({
    where: { userId: consultantId },
    select: { id: true },
  });

  if (!profile) {
    return Response.json({ error: "Consultant profile not found" }, { status: 404 });
  }

  const override = {
    enabled: true,
    maxConcurrent: mc,
    maxBudgetNGN: bn,
    maxBudgetUSD: bu,
    minFeePct: fp,
    reason: reason.trim(),
    grantedBy: session.user.id,
    grantedAt: new Date().toISOString(),
  };

  await prisma.consultantProfile.update({
    where: { userId: consultantId },
    data: { ownGigOverride: override },
  });

  return Response.json({ override });
});

/**
 * DELETE /api/admin/consultants/[id]/own-gig-override
 * Revoke own gig override.
 */
export const DELETE = handler(async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id: consultantId } = await params;

  await prisma.consultantProfile.update({
    where: { userId: consultantId },
    data: { ownGigOverride: Prisma.DbNull },
  });

  return Response.json({ ok: true });
});
