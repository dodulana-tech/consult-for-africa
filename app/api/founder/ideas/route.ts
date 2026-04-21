import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";

export const GET = handler(async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!profile) return Response.json([]);

  const ideas = await prisma.founderIdea.findMany({
    where: { founderId: profile.id },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(ideas);
});

export const POST = handler(async function POST(req: Request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!profile) return Response.json({ error: "No founder profile" }, { status: 404 });

  const { title, content, category, priority, tags } = await req.json();

  if (!title?.trim() || !content?.trim()) {
    return Response.json({ error: "Title and content are required." }, { status: 400 });
  }

  const idea = await prisma.founderIdea.create({
    data: {
      founderId: profile.id,
      title: title.trim(),
      content: content.trim(),
      category: category || null,
      priority: priority || "MEDIUM",
      tags: Array.isArray(tags) ? tags : [],
    },
  });

  return Response.json(idea);
});

export const PATCH = handler(async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id, title, content, category, priority, status, tags, nuruNotes } = await req.json();
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  const idea = await prisma.founderIdea.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(Array.isArray(tags) ? { tags } : {}),
      ...(nuruNotes !== undefined ? { nuruNotes } : {}),
    },
  });

  return Response.json(idea);
});

export const DELETE = handler(async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  await prisma.founderIdea.delete({ where: { id } });
  return Response.json({ ok: true });
});
