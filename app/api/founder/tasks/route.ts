import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

const ALLOWED_ROLES = ["DIRECTOR", "PARTNER", "ADMIN"];

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function sortByPriorityThenDate<T extends { priority: string; dueDate?: Date | null }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    const pd = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
    if (pd !== 0) return pd;
    if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) return new Response("Forbidden", { status: 403 });

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!profile) return new Response("Profile not found", { status: 404 });

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const weekFilter = searchParams.get("week");

  const tasks = await prisma.founderTask.findMany({
    where: {
      founderId: profile.id,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(weekFilter ? { week: parseInt(weekFilter, 10) } : {}),
    },
  });

  return Response.json(sortByPriorityThenDate(tasks));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) return new Response("Forbidden", { status: 403 });

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!profile) return new Response("Profile not found", { status: 404 });

  const body = await req.json();
  const { title, description, phase, week, priority, category, dueDate, estimatedMinutes, impact } =
    body;

  if (!title?.trim()) return new Response("title required", { status: 400 });
  if (!phase) return new Response("phase required", { status: 400 });
  if (!priority) return new Response("priority required", { status: 400 });
  if (!category) return new Response("category required", { status: 400 });

  const task = await prisma.founderTask.create({
    data: {
      founderId: profile.id,
      title: title.trim(),
      description: description?.trim() ?? null,
      phase,
      week: week ?? null,
      priority,
      category,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedMinutes: estimatedMinutes ?? null,
      impact: impact?.trim() ?? null,
      status: "pending",
    },
  });

  return Response.json(task, { status: 201 });
}
