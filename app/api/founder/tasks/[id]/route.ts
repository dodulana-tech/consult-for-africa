import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const ALLOWED_ROLES = ["DIRECTOR", "PARTNER", "ADMIN"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) return new Response("Forbidden", { status: 403 });

  const { id } = await params;

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!profile) return new Response("Profile not found", { status: 404 });

  const task = await prisma.founderTask.findUnique({ where: { id } });
  if (!task) return new Response("Not found", { status: 404 });
  if (task.founderId !== profile.id) return new Response("Forbidden", { status: 403 });

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
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) return new Response("Forbidden", { status: 403 });

  const { id } = await params;

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!profile) return new Response("Profile not found", { status: 404 });

  const task = await prisma.founderTask.findUnique({ where: { id } });
  if (!task) return new Response("Not found", { status: 404 });
  if (task.founderId !== profile.id) return new Response("Forbidden", { status: 403 });

  await prisma.founderTask.delete({ where: { id } });

  return new Response(null, { status: 204 });
}
