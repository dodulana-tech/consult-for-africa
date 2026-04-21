import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const asset = await prisma.knowledgeAsset.findUnique({ where: { id } });
  if (!asset) return Response.json({ error: "Not found" }, { status: 404 });

  const isAuthor = asset.authorId === session.user.id;
  const isPrivileged = ["PARTNER", "ADMIN"].includes(session.user.role);

  if (!isAuthor && !isPrivileged) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { title, content, tags, isReusable } = await req.json();

  const updated = await prisma.knowledgeAsset.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(content !== undefined ? { content: content.trim() } : {}),
      ...(tags !== undefined ? { tags: Array.isArray(tags) ? tags : [] } : {}),
      ...(isReusable !== undefined ? { isReusable: Boolean(isReusable) } : {}),
    },
    include: {
      engagement: { select: { id: true, name: true } },
    },
  });

  return Response.json({
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

export const DELETE = handler(async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const asset = await prisma.knowledgeAsset.findUnique({ where: { id } });
  if (!asset) return Response.json({ error: "Not found" }, { status: 404 });

  const isAuthor = asset.authorId === session.user.id;
  const isPrivileged = ["PARTNER", "ADMIN"].includes(session.user.role);

  if (!isAuthor && !isPrivileged) return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.knowledgeAsset.delete({ where: { id } });

  return Response.json({ ok: true });
});
