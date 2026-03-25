import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];

/**
 * GET /api/own-gig/[id]/fees — list platform fees for this gig
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const gig = await prisma.engagement.findUnique({
    where: { id },
    select: { id: true, isOwnGig: true, ownGigOwnerId: true },
  });

  if (!gig || !gig.isOwnGig) {
    return Response.json({ error: "Own gig not found" }, { status: 404 });
  }

  const isOwner = gig.ownGigOwnerId === session.user.id;
  const isElevated = ELEVATED.includes(session.user.role);
  if (!isOwner && !isElevated) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const fees = await prisma.ownGigPlatformFee.findMany({
    where: { engagementId: id },
    orderBy: { periodStart: "desc" },
  });

  return Response.json(fees);
}

/**
 * PATCH /api/own-gig/[id]/fees — update fee status (admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { feeId, status } = body;

  if (!feeId || !["PENDING", "INVOICED", "PAID"].includes(status)) {
    return Response.json({ error: "feeId and valid status required" }, { status: 400 });
  }

  // Verify fee belongs to this gig
  const fee = await prisma.ownGigPlatformFee.findFirst({
    where: { id: feeId, engagementId: id },
  });
  if (!fee) return Response.json({ error: "Fee not found for this gig" }, { status: 404 });

  const updated = await prisma.ownGigPlatformFee.update({
    where: { id: feeId },
    data: { status },
  });

  return Response.json(updated);
}
