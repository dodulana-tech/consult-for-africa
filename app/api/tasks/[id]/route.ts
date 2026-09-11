import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handler } from "@/lib/api-handler";
import { logAudit } from "@/lib/audit";
import {
  emailTaskApproved,
  emailTaskBlocked,
  emailTaskChangesRequested,
  emailTaskSubmitted,
} from "@/lib/email";
import {
  TASK_STATUSES,
  allowedTransitions,
  canAssignToOthers,
  canSeeAllTasks,
  canUseTaskBoard,
  partyFor,
  validateTransition,
} from "@/lib/tasks";
import type { Prisma, TaskStatus } from "@prisma/client";

const PERSON = { select: { id: true, name: true, email: true, role: true } };

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
  assignee: PERSON,
  assigner: PERSON,
  parentTask: { select: { id: true, title: true, assignee: PERSON, assigner: PERSON } },
  subtasks: {
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      checkInAt: true,
      assignee: PERSON,
      assigner: PERSON,
    },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.TaskSelect;

type LoadedTask = Prisma.TaskGetPayload<{ select: typeof TASK_SELECT }>;

/**
 * The rollup the original assigner sees on their task: how the breakdown is
 * going, without them being pulled into the detail of work they did not assign.
 */
function rollup(subtasks: LoadedTask["subtasks"]) {
  const byStatus: Record<string, number> = {};
  for (const s of subtasks) byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
  return {
    total: subtasks.length,
    done: byStatus.DONE ?? 0,
    blocked: byStatus.BLOCKED ?? 0,
    byStatus,
  };
}

function shape(task: LoadedTask, userId: string, role: string) {
  const seesEverything = canSeeAllTasks(role);
  // Sub-task detail is for the people party to the sub-task. Everyone else who
  // can see the parent gets the rollup only.
  const visibleSubtasks = task.subtasks.filter(
    (s) => seesEverything || s.assignee.id === userId || s.assigner.id === userId,
  );
  const party = partyFor({ assigneeId: task.assignee.id, assignerId: task.assigner.id }, userId);
  return {
    ...task,
    subtasks: visibleSubtasks,
    subtaskRollup: rollup(task.subtasks),
    viewer: {
      party,
      canTransitionTo: allowedTransitions(task.status, party),
      canEditFields: party === "ASSIGNER" || party === "BOTH",
      canBreakDown: canAssignToOthers(role) && !task.parentTaskId && (party !== "NONE" || seesEverything),
    },
  };
}

async function load(id: string) {
  return prisma.task.findUnique({ where: { id }, select: TASK_SELECT });
}

export const GET = handler(async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseTaskBoard(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const task = await load(id);
  if (!task) return Response.json({ error: "Task not found" }, { status: 404 });

  const party = partyFor({ assigneeId: task.assignee.id, assignerId: task.assigner.id }, session.user.id);
  if (party === "NONE" && !canSeeAllTasks(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ task: JSON.parse(JSON.stringify(shape(task, session.user.id, session.user.role))) });
});

/**
 * PATCH /api/tasks/[id]
 *
 * Two things happen here. The assigner edits the terms of the task, and either
 * party moves it through the statuses their side of the desk allows.
 */
export const PATCH = handler(async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUseTaskBoard(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const existing = await load(id);
  if (!existing) return Response.json({ error: "Task not found" }, { status: 404 });

  const party = partyFor(
    { assigneeId: existing.assignee.id, assignerId: existing.assigner.id },
    session.user.id,
  );
  if (party === "NONE") {
    return Response.json({ error: "This task is not on your desk." }, { status: 403 });
  }

  const body = await req.json();
  const { status, blockedReason, reviewNote, actualMinutes } = body;
  const isAssigner = party === "ASSIGNER" || party === "BOTH";
  const isAssignee = party === "ASSIGNEE" || party === "BOTH";

  const data: Prisma.TaskUpdateInput = {};

  // The terms of the task belong to the person who set them.
  if (isAssigner) {
    if (typeof body.title === "string") {
      if (!body.title.trim()) return Response.json({ error: "A title is required." }, { status: 400 });
      data.title = body.title.trim();
    }
    if (typeof body.brief === "string") {
      if (!body.brief.trim()) return Response.json({ error: "A brief is required." }, { status: 400 });
      data.brief = body.brief.trim();
    }
    if (typeof body.definitionOfDone === "string") {
      if (!body.definitionOfDone.trim()) {
        return Response.json({ error: "A definition of done is required." }, { status: 400 });
      }
      data.definitionOfDone = body.definitionOfDone.trim();
    }
    if ("dueDate" in body) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if ("checkInAt" in body) data.checkInAt = body.checkInAt ? new Date(body.checkInAt) : null;
    if ("estimatedMinutes" in body) {
      const m = Number(body.estimatedMinutes);
      data.estimatedMinutes = Number.isFinite(m) && m > 0 ? Math.round(m) : null;
    }
    if ("linkedEntityType" in body) data.linkedEntityType = body.linkedEntityType?.trim() || null;
    if ("linkedEntityId" in body) data.linkedEntityId = body.linkedEntityId?.trim() || null;
  }

  // How long it actually took is the assignee's to record. Held against the
  // assigner's estimate, it is the only way either of them learns anything.
  if (isAssignee && "actualMinutes" in body) {
    const m = Number(actualMinutes);
    data.actualMinutes = Number.isFinite(m) && m > 0 ? Math.round(m) : null;
  }

  let moved: TaskStatus | null = null;

  if (status && status !== existing.status) {
    if (!TASK_STATUSES.includes(status as TaskStatus)) {
      return Response.json({ error: "Unknown status" }, { status: 400 });
    }
    const next = status as TaskStatus;
    const check = validateTransition({
      from: existing.status,
      to: next,
      party,
      // Fall back to what is already on the record so an unblock does not need
      // the reason resent.
      blockedReason: blockedReason ?? existing.blockedReason,
      reviewNote: reviewNote ?? existing.reviewNote,
    });
    if (!check.ok) return Response.json({ error: check.error }, { status: 400 });

    data.status = next;
    moved = next;

    if (next === "BLOCKED") data.blockedReason = blockedReason?.trim() ?? existing.blockedReason;
    if (next === "IN_PROGRESS" || next === "ASSIGNED") data.blockedReason = null;
    if (next === "CHANGES_REQUESTED") data.reviewNote = reviewNote?.trim() ?? existing.reviewNote;
    if (next === "SUBMITTED") data.submittedAt = new Date();
    if (next === "DONE") {
      data.completedAt = new Date();
      if (typeof reviewNote === "string" && reviewNote.trim()) data.reviewNote = reviewNote.trim();
    }
    if (next !== "DONE" && next !== "CHANGES_REQUESTED" && next !== "SUBMITTED") data.completedAt = null;
  } else {
    // Updating the reason or the note without a status change.
    if (isAssignee && typeof blockedReason === "string" && existing.status === "BLOCKED") {
      data.blockedReason = blockedReason.trim() || null;
    }
    if (isAssigner && typeof reviewNote === "string") {
      data.reviewNote = reviewNote.trim() || null;
    }
  }

  if (!Object.keys(data).length) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const task = await prisma.task.update({ where: { id }, data, select: TASK_SELECT });

  await logAudit({
    userId: session.user.id,
    action: moved ? "STATUS_CHANGE" : "UPDATE",
    entityType: "Task",
    entityId: task.id,
    entityName: task.title,
    details: moved ? { from: existing.status, to: moved } : { fields: Object.keys(data) },
  });

  // Notifications follow the chain. A block raises it to whoever assigned the
  // work, which is what keeps the Founding Partner out of the EA's review loop.
  const actorName = session.user.name ?? "Consult For Africa";
  const fail = (err: unknown) => console.error(`[tasks] notification failed for ${task.id}:`, err);
  // A task someone raised for themselves has nobody else to tell.
  const selfRaised = task.assignee.id === task.assigner.id;

  if (selfRaised) {
    // no notification
  } else if (moved === "BLOCKED") {
    emailTaskBlocked({
      assignerEmail: task.assigner.email,
      assignerName: task.assigner.name,
      assigneeName: task.assignee.name,
      title: task.title,
      blockedReason: task.blockedReason ?? "No reason given.",
      taskId: task.id,
    }).catch(fail);
  } else if (moved === "SUBMITTED") {
    emailTaskSubmitted({
      assignerEmail: task.assigner.email,
      assignerName: task.assigner.name,
      assigneeName: task.assignee.name,
      title: task.title,
      taskId: task.id,
    }).catch(fail);
  } else if (moved === "CHANGES_REQUESTED") {
    emailTaskChangesRequested({
      assigneeEmail: task.assignee.email,
      assigneeName: task.assignee.name,
      assignerName: actorName,
      title: task.title,
      reviewNote: task.reviewNote ?? "",
      taskId: task.id,
    }).catch(fail);
  } else if (moved === "DONE") {
    emailTaskApproved({
      assigneeEmail: task.assignee.email,
      assigneeName: task.assignee.name,
      assignerName: actorName,
      title: task.title,
      reviewNote: task.reviewNote,
      taskId: task.id,
    }).catch(fail);
  }

  return Response.json({ task: JSON.parse(JSON.stringify(shape(task, session.user.id, session.user.role))) });
});
