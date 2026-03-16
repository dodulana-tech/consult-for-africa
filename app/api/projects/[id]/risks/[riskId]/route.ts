import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string; riskId: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id: projectId, riskId } = await params;
  const { title, description, category, severity, likelihood, impact, mitigation, status } = await req.json();

  const updates: Record<string, unknown> = {};
  if (title?.trim()) updates.title = title.trim();
  if (description !== undefined) updates.description = description;
  if (category?.trim()) updates.category = category.trim();
  if (severity) updates.severity = severity;
  if (likelihood !== undefined) {
    const like = Math.min(5, Math.max(1, Number(likelihood)));
    updates.likelihood = like;
  }
  if (impact !== undefined) {
    const imp = Math.min(5, Math.max(1, Number(impact)));
    updates.impact = imp;
  }
  if (updates.likelihood !== undefined || updates.impact !== undefined) {
    const current = await prisma.riskItem.findUnique({ where: { id: riskId }, select: { likelihood: true, impact: true } });
    const l = (updates.likelihood as number) ?? current?.likelihood ?? 3;
    const i = (updates.impact as number) ?? current?.impact ?? 3;
    updates.riskScore = l * i;
  }
  if (mitigation !== undefined) updates.mitigation = mitigation;

  let oldStatus: string | undefined;
  if (status) {
    const VALID = ["OPEN", "MITIGATING", "RESOLVED", "ACCEPTED"];
    if (!VALID.includes(status)) return new Response("Invalid status", { status: 400 });
    const existing = await prisma.riskItem.findUnique({ where: { id: riskId }, select: { status: true } });
    oldStatus = existing?.status;
    updates.status = status;
    if (status === "RESOLVED") updates.resolvedAt = new Date();
  }

  if (Object.keys(updates).length === 0) return new Response("No valid fields", { status: 400 });

  const risk = await prisma.riskItem.update({
    where: { id: riskId },
    data: updates,
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      severity: true,
      likelihood: true,
      impact: true,
      riskScore: true,
      mitigation: true,
      status: true,
      resolvedAt: true,
      createdAt: true,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: status ? "STATUS_CHANGE" : "UPDATE",
    entityType: "Risk",
    entityId: risk.id,
    entityName: risk.title,
    projectId,
    details: status ? { before: oldStatus, after: status } : undefined,
  });

  return Response.json({ ok: true, risk });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { id: projectId, riskId } = await params;
  const risk = await prisma.riskItem.findUnique({ where: { id: riskId }, select: { title: true } });
  await prisma.riskItem.delete({ where: { id: riskId } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "Risk",
    entityId: riskId,
    entityName: risk?.title,
    projectId,
  });

  return Response.json({ ok: true });
}
