import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

/**
 * PUT /api/admin/consultants/[id]/own-gig-override
 * Grant or update own gig override for a consultant.
 */
export async function PUT(req: NextRequest, { params }: Ctx) {
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

  const profile = await prisma.consultantProfile.findUnique({
    where: { userId: consultantId },
    select: { id: true },
  });

  if (!profile) {
    return Response.json({ error: "Consultant profile not found" }, { status: 404 });
  }

  const override = {
    enabled: true,
    maxConcurrent: Number(maxConcurrent ?? 1),
    maxBudgetNGN: Number(maxBudgetNGN ?? 5_000_000),
    maxBudgetUSD: Number(maxBudgetUSD ?? 3_500),
    minFeePct: Number(minFeePct ?? 10),
    reason: reason.trim(),
    grantedBy: session.user.id,
    grantedAt: new Date().toISOString(),
  };

  await prisma.consultantProfile.update({
    where: { userId: consultantId },
    data: { ownGigOverride: override },
  });

  return Response.json({ override });
}

/**
 * DELETE /api/admin/consultants/[id]/own-gig-override
 * Revoke own gig override.
 */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
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
}
