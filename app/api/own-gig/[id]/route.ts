import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const gig = await prisma.engagement.findUnique({
    where: { id },
    include: {
      client: { include: { contacts: true } },
      ownGigOwner: { select: { id: true, name: true, email: true } },
      engagementManager: { select: { id: true, name: true, email: true } },
      assignments: { include: { consultant: { select: { id: true, name: true, email: true } } } },
      ownGigFees: { orderBy: { periodStart: "desc" } },
    },
  });

  if (!gig || !gig.isOwnGig) {
    return Response.json({ error: "Own gig not found" }, { status: 404 });
  }

  const isOwner = gig.ownGigOwnerId === session.user.id;
  const isElevated = ELEVATED.includes(session.user.role);
  if (!isOwner && !isElevated) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json(gig);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const gig = await prisma.engagement.findUnique({
    where: { id },
    select: { id: true, isOwnGig: true, ownGigOwnerId: true, ownGigApprovalStatus: true },
  });

  if (!gig || !gig.isOwnGig) {
    return Response.json({ error: "Own gig not found" }, { status: 404 });
  }

  const isOwner = gig.ownGigOwnerId === session.user.id;
  const isElevated = ELEVATED.includes(session.user.role);
  if (!isOwner && !isElevated) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Block status changes to ACTIVE if not approved
  if (body.status === "ACTIVE" && gig.ownGigApprovalStatus !== "APPROVED") {
    return Response.json({ error: "Cannot activate an own gig that has not been approved" }, { status: 400 });
  }

  // Block inviting collaborators/clients if not approved
  if ((body.inviteCollaborator || body.inviteClient) && gig.ownGigApprovalStatus !== "APPROVED") {
    return Response.json({ error: "Cannot invite collaborators or clients to an unapproved own gig" }, { status: 400 });
  }

  const allowedFields: Record<string, unknown> = {};
  if (body.name !== undefined) allowedFields.name = body.name;
  if (body.description !== undefined) allowedFields.description = body.description;
  if (body.status !== undefined) allowedFields.status = body.status;
  if (body.ownGigFeeModel !== undefined) allowedFields.ownGigFeeModel = body.ownGigFeeModel;
  if (body.ownGigFeePct !== undefined) allowedFields.ownGigFeePct = Number(body.ownGigFeePct);
  if (body.ownGigFlatMonthlyFee !== undefined) allowedFields.ownGigFlatMonthlyFee = Number(body.ownGigFlatMonthlyFee);

  const updated = await prisma.engagement.update({
    where: { id },
    data: allowedFields,
  });

  return Response.json(updated);
}
