import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const ELEVATED = ["DIRECTOR", "PARTNER", "ADMIN"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { consultantId, role } = body;

  if (!consultantId) {
    return Response.json({ error: "consultantId is required" }, { status: 400 });
  }

  const gig = await prisma.engagement.findUnique({
    where: { id },
    select: {
      id: true,
      isOwnGig: true,
      ownGigOwnerId: true,
      startDate: true,
      assignments: { select: { consultantId: true } },
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

  // Check collaborator is not already assigned
  if (gig.assignments.some((a) => a.consultantId === consultantId)) {
    return Response.json({ error: "Consultant is already assigned to this gig" }, { status: 409 });
  }

  // Verify consultant exists and is a consultant
  const consultant = await prisma.user.findUnique({
    where: { id: consultantId },
    select: { id: true, role: true, name: true },
  });

  if (!consultant || consultant.role !== "CONSULTANT") {
    return Response.json({ error: "Consultant not found" }, { status: 404 });
  }

  const assignment = await prisma.assignment.create({
    data: {
      engagementId: id,
      consultantId,
      role: role ?? "Consultant",
      responsibilities: "Own gig collaborator",
      status: "ACTIVE",
      startDate: gig.startDate ?? new Date(),
      rateAmount: 0,
      rateCurrency: "NGN",
      rateType: "FIXED_PROJECT",
    },
  });

  return Response.json({ assignment, message: `${consultant.name} added as collaborator` }, { status: 201 });
}
