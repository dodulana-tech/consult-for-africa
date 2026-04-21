import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { canAccessProject } from "@/lib/projectAccess";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id: projectId } = await params;

  if (!(await canAccessProject(session.user.id, session.user.role, projectId))) {
    return new Response("Forbidden", { status: 403 });
  }

  const phases = await prisma.engagementPhase.findMany({
    where: { engagementId: projectId },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      order: true,
      status: true,
      percentComplete: true,
      startDate: true,
      endDate: true,
      completedAt: true,
      createdAt: true,
      gates: {
        select: {
          id: true,
          name: true,
          passed: true,
          passedAt: true,
          notes: true,
        },
      },
    },
  });

  return Response.json(
    phases.map((p) => ({
      ...p,
      startDate: p.startDate?.toISOString() ?? null,
      endDate: p.endDate?.toISOString() ?? null,
      completedAt: p.completedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      gates: p.gates.map((g) => ({
        ...g,
        passedAt: g.passedAt?.toISOString() ?? null,
      })),
    }))
  );
});

export const POST = handler(async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id: projectId } = await params;
  const { name, description, order, startDate, endDate } = await req.json();

  if (!name?.trim()) return new Response("name is required", { status: 400 });

  // Auto-assign order if not provided
  let phaseOrder = Number(order);
  if (!phaseOrder) {
    const last = await prisma.engagementPhase.findFirst({
      where: { engagementId: projectId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    phaseOrder = (last?.order ?? 0) + 1;
  }

  const phase = await prisma.engagementPhase.create({
    data: {
      engagementId: projectId,
      name: name.trim(),
      description: description?.trim() ?? null,
      order: phaseOrder,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
    select: {
      id: true,
      name: true,
      description: true,
      order: true,
      status: true,
      percentComplete: true,
      startDate: true,
      endDate: true,
      completedAt: true,
      createdAt: true,
      gates: { select: { id: true, name: true, passed: true, passedAt: true, notes: true } },
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Phase",
    entityId: phase.id,
    entityName: phase.name,
    engagementId: projectId,
  });

  return Response.json({
    ok: true,
    phase: {
      ...phase,
      startDate: phase.startDate?.toISOString() ?? null,
      endDate: phase.endDate?.toISOString() ?? null,
      completedAt: phase.completedAt?.toISOString() ?? null,
      createdAt: phase.createdAt.toISOString(),
      gates: [],
    },
  }, { status: 201 });
});
