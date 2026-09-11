import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import { emailTaskAssigned } from "@/lib/email";
import {
  OPEN_STATUSES,
  TASK_STATUSES,
  canAssignToOthers,
  canSeeAllTasks,
  canUseTaskBoard,
} from "@/lib/tasks";
import type { Prisma, TaskStatus } from "@prisma/client";

const TASK_SELECT = {
  id: true,
  title: true,
  brief: true,
  definitionOfDone: true,
  status: true,
  dueDate: true,
  checkInAt: true,
  estimatedMinutes: true,
  actualMinutes: true,
  blockedReason: true,
  reviewNote: true,
  linkedEntityType: true,
  linkedEntityId: true,
  parentTaskId: true,
  submittedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  assignee: { select: { id: true, name: true, email: true, role: true } },
  assigner: { select: { id: true, name: true, email: true, role: true } },
  _count: { select: { subtasks: true } },
} satisfies Prisma.TaskSelect;

/**
 * GET /api/tasks
 *
 * Every desk is this board filtered to one person. `view=mine` is what the
 * assignee sees, `view=assigned` is what the reviewer sees, and `view=all` is
 * only open to roles that already see everything.
 */
export const GET = handler(async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseTaskBoard(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = session.user.id;
  const { searchParams } = req.nextUrl;
  const view = searchParams.get("view") ?? "mine";
  const statusParam = searchParams.get("status");
  const assigneeId = searchParams.get("assigneeId");
  const linkedEntityType = searchParams.get("linkedEntityType");
  const linkedEntityId = searchParams.get("linkedEntityId");
  const topLevelOnly = searchParams.get("topLevel") === "true";

  const where: Prisma.TaskWhereInput = {};

  if (view === "all") {
    if (!canSeeAllTasks(session.user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (view === "assigned") {
    where.assignerId = userId;
  } else if (view === "mine") {
    where.assigneeId = userId;
  } else {
    return Response.json({ error: "Unknown view" }, { status: 400 });
  }

  // Narrowing to one person's desk is only for people who already see that desk.
  if (assigneeId) {
    if (view === "mine" && assigneeId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    where.assigneeId = assigneeId;
  }

  if (statusParam === "open") {
    where.status = { in: OPEN_STATUSES };
  } else if (statusParam) {
    const requested = statusParam.split(",").filter((s): s is TaskStatus => TASK_STATUSES.includes(s as TaskStatus));
    if (requested.length) where.status = { in: requested };
  }

  if (linkedEntityType && linkedEntityId) {
    where.linkedEntityType = linkedEntityType;
    where.linkedEntityId = linkedEntityId;
  }

  if (topLevelOnly) where.parentTaskId = null;

  const tasks = await prisma.task.findMany({
    where,
    select: TASK_SELECT,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  return Response.json({ tasks: JSON.parse(JSON.stringify(tasks)) });
});

/**
 * POST /api/tasks
 *
 * A brief and a definition of done are required, not optional. A task that goes
 * out without them is the verbal delegation this board exists to replace.
 */
export const POST = handler(async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseTaskBoard(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    title,
    brief,
    definitionOfDone,
    assigneeId,
    parentTaskId,
    dueDate,
    checkInAt,
    estimatedMinutes,
    linkedEntityType,
    linkedEntityId,
  } = body;

  if (!title?.trim()) return Response.json({ error: "A title is required." }, { status: 400 });
  if (!brief?.trim()) {
    return Response.json({ error: "A brief is required. Say why this matters and what it feeds into." }, { status: 400 });
  }
  if (!definitionOfDone?.trim()) {
    return Response.json({ error: "A definition of done is required. Say what finished looks like." }, { status: 400 });
  }

  const targetAssigneeId: string = assigneeId?.trim() || session.user.id;
  const assigningToSelf = targetAssigneeId === session.user.id;

  if (!assigningToSelf && !canAssignToOthers(session.user.role)) {
    return Response.json({ error: "You can raise tasks for yourself, not for other people." }, { status: 403 });
  }

  const assignee = await prisma.user.findUnique({
    where: { id: targetAssigneeId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!assignee) return Response.json({ error: "Assignee not found" }, { status: 404 });
  if (!canUseTaskBoard(assignee.role)) {
    return Response.json({ error: "That person does not have a task board." }, { status: 400 });
  }

  // A sub-task hangs off a parent the creator is already party to, so one of my
  // tasks can be broken down by the EA without opening the whole board to her.
  if (parentTaskId) {
    const parent = await prisma.task.findUnique({
      where: { id: parentTaskId },
      select: { id: true, assigneeId: true, assignerId: true, parentTaskId: true },
    });
    if (!parent) return Response.json({ error: "Parent task not found" }, { status: 404 });
    if (parent.parentTaskId) {
      return Response.json({ error: "Sub-tasks cannot themselves be broken down." }, { status: 400 });
    }
    const partyToParent =
      parent.assigneeId === session.user.id ||
      parent.assignerId === session.user.id ||
      canSeeAllTasks(session.user.role);
    if (!partyToParent) {
      return Response.json({ error: "You can only break down a task on your own desk." }, { status: 403 });
    }
  }

  const minutes = Number.isFinite(Number(estimatedMinutes)) && Number(estimatedMinutes) > 0
    ? Math.round(Number(estimatedMinutes))
    : null;

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      brief: brief.trim(),
      definitionOfDone: definitionOfDone.trim(),
      assigneeId: assignee.id,
      assignerId: session.user.id,
      parentTaskId: parentTaskId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      checkInAt: checkInAt ? new Date(checkInAt) : null,
      estimatedMinutes: minutes,
      linkedEntityType: linkedEntityType?.trim() || null,
      linkedEntityId: linkedEntityId?.trim() || null,
    },
    select: TASK_SELECT,
  });

  await logAudit({
    userId: session.user.id,
    action: "ASSIGN",
    entityType: "Task",
    entityId: task.id,
    entityName: task.title,
    details: { assigneeId: assignee.id, parentTaskId: parentTaskId || null },
  });

  if (!assigningToSelf) {
    emailTaskAssigned({
      assigneeEmail: assignee.email,
      assigneeName: assignee.name,
      assignerName: session.user.name ?? "Consult For Africa",
      title: task.title,
      brief: task.brief,
      definitionOfDone: task.definitionOfDone,
      dueDate: task.dueDate,
      checkInAt: task.checkInAt,
      estimatedMinutes: task.estimatedMinutes,
      taskId: task.id,
    }).catch((err) => console.error(`[tasks] assignment email failed for ${task.id}:`, err));
  }

  return Response.json({ task: JSON.parse(JSON.stringify(task)) }, { status: 201 });
});
