import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const { title, description, content, category, tags, isPinned, reviewDate, reviewNote, fileUrl, fileType, fileSize } = body;

  const doc = await prisma.founderDocument.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description: description || null } : {}),
      ...(content !== undefined ? { content: content || null } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(Array.isArray(tags) ? { tags } : {}),
      ...(isPinned !== undefined ? { isPinned } : {}),
      ...(reviewDate !== undefined ? { reviewDate: reviewDate ? new Date(reviewDate) : null } : {}),
      ...(reviewNote !== undefined ? { reviewNote: reviewNote || null } : {}),
      ...(fileUrl !== undefined ? { fileUrl } : {}),
      ...(fileType !== undefined ? { fileType } : {}),
      ...(fileSize !== undefined ? { fileSize } : {}),
    },
  });

  return Response.json(doc);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  await prisma.founderDocument.delete({ where: { id } });
  return Response.json({ ok: true });
}
