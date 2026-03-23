import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string; frameworkId: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canManage = ["ENGAGEMENT_MANAGER", "DIRECTOR", "PARTNER", "ADMIN", "CONSULTANT"].includes(session.user.role);
  if (!canManage) return new Response("Forbidden", { status: 403 });

  const { frameworkId } = await params;
  const { content, status, notes } = await req.json();

  const updates: Record<string, unknown> = {};
  if (content !== undefined) updates.content = content;
  if (notes !== undefined) updates.notes = notes;
  if (status) {
    const VALID = ["DRAFT", "IN_PROGRESS", "COMPLETED", "ARCHIVED"];
    if (!VALID.includes(status)) return new Response("Invalid status", { status: 400 });
    updates.status = status;
  }

  if (Object.keys(updates).length === 0) return new Response("No valid fields", { status: 400 });

  const pf = await prisma.engagementFramework.update({
    where: { id: frameworkId },
    data: updates,
    include: {
      framework: {
        select: { id: true, name: true, slug: true, description: true, category: true, dimensions: true },
      },
    },
  });

  return Response.json({ ok: true, framework: pf });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const canDelete = ["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role);
  if (!canDelete) return new Response("Forbidden", { status: 403 });

  const { frameworkId } = await params;
  await prisma.engagementFramework.delete({ where: { id: frameworkId } });

  return Response.json({ ok: true });
}
