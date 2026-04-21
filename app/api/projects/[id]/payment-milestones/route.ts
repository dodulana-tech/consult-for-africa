import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: projectId } = await params;

  // Verify user has access to this project
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  const isEM = session.user.role === "ENGAGEMENT_MANAGER";
  if (!isElevated) {
    const project = await prisma.engagement.findUnique({
      where: { id: projectId },
      select: { engagementManagerId: true, isOwnGig: true, ownGigOwnerId: true, assignments: { select: { consultantId: true } } },
    });
    if (!project) return Response.json({ error: "Not found" }, { status: 404 });
    const isProjectEM = isEM && project.engagementManagerId === session.user.id;
    const isAssigned = project.assignments.some((a) => a.consultantId === session.user.id);
    const isOwnGigOwner = project.isOwnGig && project.ownGigOwnerId === session.user.id;
    if (!isProjectEM && !isAssigned && !isOwnGigOwner) return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const milestones = await prisma.paymentMilestone.findMany({
    where: { engagementId: projectId },
    orderBy: { dueDate: "asc" },
    select: {
      id: true,
      name: true,
      amount: true,
      currency: true,
      dueDate: true,
      paidDate: true,
      status: true,
      createdAt: true,
    },
  });

  return Response.json(
    milestones.map((m) => ({
      id: m.id,
      name: m.name,
      amount: Number(m.amount),
      currency: m.currency,
      dueDate: m.dueDate.toISOString(),
      paidDate: m.paidDate?.toISOString() ?? null,
      status: m.status,
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

export const POST = handler(async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const canManage = ["PARTNER", "ADMIN", "DIRECTOR"].includes(session.user.role);
  if (!canManage) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id: projectId } = await params;
  const { name, amount, currency, dueDate } = await req.json();

  if (!name?.trim() || !amount || !dueDate) {
    return Response.json({ error: "name, amount, dueDate are required" }, { status: 400 });
  }

  const milestone = await prisma.paymentMilestone.create({
    data: {
      engagementId: projectId,
      name: name.trim(),
      amount,
      currency: currency || "NGN",
      dueDate: new Date(dueDate),
    },
    select: {
      id: true,
      name: true,
      amount: true,
      currency: true,
      dueDate: true,
      paidDate: true,
      status: true,
      createdAt: true,
    },
  });

  return Response.json({
    ok: true,
    milestone: {
      id: milestone.id,
      name: milestone.name,
      amount: Number(milestone.amount),
      currency: milestone.currency,
      dueDate: milestone.dueDate.toISOString(),
      paidDate: milestone.paidDate?.toISOString() ?? null,
      status: milestone.status,
      createdAt: milestone.createdAt.toISOString(),
    },
  }, { status: 201 });
});
