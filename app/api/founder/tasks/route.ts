import { requireAuth } from "@/lib/apiAuth";
import { ELEVATED_ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { handler } from "@/lib/api-handler";

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

export const GET = handler(async function GET(req: NextRequest) {
  const { error, session } = await requireAuth(ELEVATED_ROLES);
  if (error) return error;

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });

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
});

export const POST = handler(async function POST(req: NextRequest) {
  const { error, session } = await requireAuth(ELEVATED_ROLES);
  if (error) return error;

  const profile = await prisma.founderProfile.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });

  const body = await req.json();
  const { title, description, phase, week, priority, category, dueDate, estimatedMinutes, impact } =
    body;

  if (!title?.trim()) return Response.json({ error: "title required" }, { status: 400 });

  const task = await prisma.founderTask.create({
    data: {
      founderId: profile.id,
      title: title.trim(),
      description: description?.trim() ?? null,
      phase: phase ?? "current",
      week: week ?? null,
      priority: priority ?? "medium",
      category: category ?? "general",
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedMinutes: estimatedMinutes ?? null,
      impact: impact?.trim() ?? null,
      status: "pending",
    },
  });

  return Response.json(task, { status: 201 });
});
