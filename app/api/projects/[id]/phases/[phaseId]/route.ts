import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string; phaseId: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { phaseId } = await params;
  const { name, description, status, percentComplete, startDate, endDate } = await req.json();

  const updates: Record<string, unknown> = {};
  if (name?.trim()) updates.name = name.trim();
  if (description !== undefined) updates.description = description;
  if (status) {
    const VALID = ["PENDING", "ACTIVE", "COMPLETED", "SKIPPED"];
    if (!VALID.includes(status)) return new Response("Invalid status", { status: 400 });
    updates.status = status;
    if (status === "COMPLETED") updates.completedAt = new Date();
  }
  if (percentComplete !== undefined) {
    updates.percentComplete = Math.min(100, Math.max(0, Number(percentComplete)));
  }
  if (startDate !== undefined) updates.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;

  if (Object.keys(updates).length === 0) return new Response("No valid fields", { status: 400 });

  const phase = await prisma.projectPhase.update({
    where: { id: phaseId },
    data: updates,
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

  return Response.json({
    ok: true,
    phase: {
      ...phase,
      startDate: phase.startDate?.toISOString() ?? null,
      endDate: phase.endDate?.toISOString() ?? null,
      completedAt: phase.completedAt?.toISOString() ?? null,
      createdAt: phase.createdAt.toISOString(),
      gates: phase.gates.map((g) => ({ ...g, passedAt: g.passedAt?.toISOString() ?? null })),
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { phaseId } = await params;
  await prisma.projectPhase.delete({ where: { id: phaseId } });

  return Response.json({ ok: true });
}
