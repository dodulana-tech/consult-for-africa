import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { isCommsElevated } from "@/lib/communications";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCommsElevated(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const template = await prisma.communicationTemplate.findUnique({
    where: { id },
    include: { createdBy: { select: { id: true, name: true } } },
  });
  if (!template) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(template);
});

export const PATCH = handler(async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCommsElevated(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  // Special case: empty body bumps usage count (used by TemplatePicker)
  if (Object.keys(body).length === 0) {
    const updated = await prisma.communicationTemplate.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
    return Response.json(updated);
  }

  if (body.name !== undefined) data.name = body.name.trim();
  if (body.description !== undefined) data.description = body.description?.trim() || null;
  if (body.category !== undefined) data.category = body.category?.trim() || null;
  if (body.subject !== undefined) data.subject = body.subject?.trim() || null;
  if (body.body !== undefined) data.body = body.body;
  if (body.type !== undefined) data.type = body.type;
  if (body.isActive !== undefined) data.isActive = !!body.isActive;

  // Re-extract variables on subject/body change
  if (body.subject !== undefined || body.body !== undefined) {
    const current = await prisma.communicationTemplate.findUnique({
      where: { id },
      select: { subject: true, body: true },
    });
    const subject = body.subject !== undefined ? body.subject : current?.subject ?? "";
    const text = body.body !== undefined ? body.body : current?.body ?? "";
    const variableSet = new Set<string>();
    const re = /\{\{\s*(\w+)\s*\}\}/g;
    let match;
    while ((match = re.exec(subject)) !== null) variableSet.add(match[1]);
    while ((match = re.exec(text)) !== null) variableSet.add(match[1]);
    data.variables = Array.from(variableSet);
  }

  try {
    const updated = await prisma.communicationTemplate.update({
      where: { id },
      data,
    });
    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "CommunicationTemplate",
      entityId: id,
      entityName: updated.name,
      details: { fields: Object.keys(data) },
    });
    return Response.json(updated);
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      return Response.json({ error: "A template with this name already exists" }, { status: 409 });
    }
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2025") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    throw err;
  }
});

export const DELETE = handler(async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCommsElevated(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const existing = await prisma.communicationTemplate.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

  // Soft-delete via isActive=false (preserves usage history)
  await prisma.communicationTemplate.update({
    where: { id },
    data: { isActive: false },
  });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "CommunicationTemplate",
    entityId: id,
    entityName: existing.name,
    details: { soft: true },
  });

  return Response.json({ ok: true });
});
