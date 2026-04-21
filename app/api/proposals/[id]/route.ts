import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { handler } from "@/lib/api-handler";

const ELEVATED_ROLES = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

export const GET = handler(async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      client: { select: { id: true, name: true, type: true } },
    },
  });

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const isElevated = ELEVATED_ROLES.includes(session.user.role);
  if (!isElevated && proposal.createdById !== session.user.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json(proposal);
});

export const PATCH = handler(async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ELEVATED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.proposal.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.clientName === "string" && body.clientName.trim()) data.clientName = body.clientName.trim();
  if (typeof body.clientContact === "string") data.clientContact = body.clientContact.trim() || null;
  if (typeof body.content === "string" && body.content.trim()) data.content = body.content.trim();
  if (typeof body.budgetRange === "string") data.budgetRange = body.budgetRange.trim() || null;
  if (typeof body.timeline === "string") data.timeline = body.timeline.trim() || null;
  if (Array.isArray(body.challenges)) data.challenges = body.challenges.filter((c: unknown) => typeof c === "string");
  if (Array.isArray(body.objectives)) data.objectives = body.objectives.filter((o: unknown) => typeof o === "string");

  // Status transitions
  if (typeof body.status === "string") {
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["REVIEW"],
      REVIEW: ["DRAFT", "SENT"],
      SENT: ["ACCEPTED", "REJECTED", "EXPIRED"],
      ACCEPTED: [],
      REJECTED: [],
      EXPIRED: [],
    };

    const allowed = validTransitions[existing.status] ?? [];
    if (allowed.includes(body.status)) {
      data.status = body.status;
      if (body.status === "SENT") data.sentAt = new Date();
      if (["ACCEPTED", "REJECTED"].includes(body.status)) data.respondedAt = new Date();
    } else if (body.status !== existing.status) {
      return NextResponse.json(
        { error: `Cannot transition from ${existing.status} to ${body.status}` },
        { status: 400 },
      );
    }
  }

  // Service type validation
  if (typeof body.serviceType === "string") {
    const validServiceTypes = [
      "HOSPITAL_OPERATIONS", "TURNAROUND", "EMBEDDED_LEADERSHIP",
      "CLINICAL_GOVERNANCE", "DIGITAL_HEALTH", "HEALTH_SYSTEMS",
      "DIASPORA_EXPERTISE", "EM_AS_SERVICE",
    ];
    if (validServiceTypes.includes(body.serviceType)) {
      data.serviceType = body.serviceType;
    }
  }

  if (typeof body.clientId === "string") {
    const client = await prisma.client.findUnique({ where: { id: body.clientId } });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    data.clientId = body.clientId;
  }

  const updated = await prisma.proposal.update({
    where: { id },
    data,
    include: {
      createdBy: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = handler(async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ELEVATED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.proposal.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (existing.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only DRAFT proposals can be deleted" },
      { status: 400 },
    );
  }

  await prisma.proposal.delete({ where: { id } });

  return NextResponse.json({ success: true });
});
