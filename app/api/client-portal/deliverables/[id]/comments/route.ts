import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getClientPortalSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  // Verify deliverable belongs to client's project
  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    select: { engagement: { select: { clientId: true } } },
  });

  if (!deliverable) {
    return new Response("Not found", { status: 404 });
  }

  if (deliverable.engagement.clientId !== session.clientId) {
    return new Response("Forbidden", { status: 403 });
  }

  const comments = await prisma.deliverableComment.findMany({
    where: { deliverableId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      authorId: true,
      authorName: true,
      authorType: true,
      parentId: true,
      isResolved: true,
      createdAt: true,
    },
  });

  return Response.json(comments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getClientPortalSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  // Verify deliverable belongs to client's project
  const deliverable = await prisma.deliverable.findUnique({
    where: { id },
    select: { engagement: { select: { clientId: true } } },
  });

  if (!deliverable) {
    return new Response("Not found", { status: 404 });
  }

  if (deliverable.engagement.clientId !== session.clientId) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await req.json();
  const content = (body.content ?? "").trim();
  const parentId = body.parentId ?? null;

  if (!content) {
    return new Response("Comment content is required", { status: 400 });
  }

  if (content.length > 5000) {
    return new Response("Comment must be under 5000 characters", { status: 400 });
  }

  // If replying, verify parent comment exists on same deliverable
  if (parentId) {
    const parent = await prisma.deliverableComment.findUnique({
      where: { id: parentId },
      select: { deliverableId: true },
    });
    if (!parent || parent.deliverableId !== id) {
      return new Response("Parent comment not found", { status: 400 });
    }
  }

  const comment = await prisma.deliverableComment.create({
    data: {
      deliverableId: id,
      content,
      authorType: "CLIENT",
      authorName: session.name,
      authorId: session.sub, // contactId
      parentId,
    },
    select: {
      id: true,
      content: true,
      authorId: true,
      authorName: true,
      authorType: true,
      parentId: true,
      isResolved: true,
      createdAt: true,
    },
  });

  return Response.json(comment, { status: 201 });
}
