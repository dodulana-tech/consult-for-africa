import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const ELEVATED = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string; gateId: string }> },
) {
  const session = await auth();
  if (!session || !ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { phaseId, gateId } = await params;
  const body = await req.json();

  // Verify the gate belongs to the specified phase
  const gate = await prisma.phaseGate.findFirst({
    where: { id: gateId, phaseId },
  });
  if (!gate) {
    return Response.json({ error: "Gate not found in this phase" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
  if (body.passed !== undefined) {
    updateData.passed = !!body.passed;
    updateData.passedAt = body.passed ? new Date() : null;
  }

  const updated = await prisma.phaseGate.update({
    where: { id: gateId },
    data: updateData,
  });

  return Response.json({ gate: JSON.parse(JSON.stringify(updated)) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string; gateId: string }> },
) {
  const session = await auth();
  if (!session || !ELEVATED.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { phaseId, gateId } = await params;

  // Verify the gate belongs to the specified phase
  const gate = await prisma.phaseGate.findFirst({
    where: { id: gateId, phaseId },
  });
  if (!gate) {
    return Response.json({ error: "Gate not found in this phase" }, { status: 404 });
  }

  await prisma.phaseGate.delete({ where: { id: gateId } });
  return Response.json({ ok: true });
}
