import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

const ALLOWED_ROLES = ["DIRECTOR", "PARTNER", "ADMIN"];

export const PATCH = handler(async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });

  const task = await prisma.founderTask.findUnique({ where: { id } });
  if (!task) return Response.json({ error: "Not found" }, { status: 404 });
  if (task.founderId !== profile.id) return Response.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { status, completedAt, title, description, priority } = body;

  const resolvedCompletedAt =
    status === "completed"
      ? completedAt
        ? new Date(completedAt)
        : new Date()
      : completedAt
      ? new Date(completedAt)
      : undefined;

  const updated = await prisma.founderTask.update({
    where: { id },
    data: {
      ...(status !== undefined ? { status } : {}),
      ...(resolvedCompletedAt !== undefined ? { completedAt: resolvedCompletedAt } : {}),
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(description !== undefined ? { description: description?.trim() ?? null } : {}),
      ...(priority !== undefined ? { priority } : {}),
    },
  });

  return Response.json(updated);
});

export const DELETE = handler(async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });

  const task = await prisma.founderTask.findUnique({ where: { id } });
  if (!task) return Response.json({ error: "Not found" }, { status: 404 });
  if (task.founderId !== profile.id) return Response.json({ error: "Forbidden" }, { status: 403 });

  await prisma.founderTask.delete({ where: { id } });

  return new Response(null, { status: 204 });
});
