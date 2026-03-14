import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id: deliverableId } = await params;

  const comments = await prisma.deliverableComment.findMany({
    where: { deliverableId, parentId: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      authorType: true,
      authorName: true,
      authorId: true,
      isResolved: true,
      createdAt: true,
      replies: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          content: true,
          authorType: true,
          authorName: true,
          authorId: true,
          isResolved: true,
          createdAt: true,
        },
      },
    },
  });

  return Response.json(
    comments.map((c) => ({
      ...c,
      resolved: c.isResolved,
      createdAt: c.createdAt.toISOString(),
      replies: c.replies.map((r) => ({
        ...r,
        resolved: r.isResolved,
        createdAt: r.createdAt.toISOString(),
      })),
    }))
  );
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id: deliverableId } = await params;
  const { content, parentId } = await req.json();
  if (!content?.trim()) return new Response("content is required", { status: 400 });

  const comment = await prisma.deliverableComment.create({
    data: {
      deliverableId,
      content: content.trim(),
      authorId: session.user.id,
      authorName: session.user.name ?? "Unknown",
      authorType: "INTERNAL",
      parentId: parentId ?? null,
    },
    select: {
      id: true,
      content: true,
      authorType: true,
      authorName: true,
      authorId: true,
      isResolved: true,
      createdAt: true,
    },
  });

  return Response.json(
    {
      ok: true,
      comment: {
        ...comment,
        resolved: comment.isResolved,
        createdAt: comment.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
}
