import type { TaskStatus } from "@prisma/client";
import { ELEVATED_ROLES, TASK_ASSIGNER_ROLES, TASK_ROLES } from "@/lib/constants";

export const TASK_STATUSES: TaskStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "BLOCKED",
  "SUBMITTED",
  "CHANGES_REQUESTED",
  "DONE",
  "CANCELLED",
];

/** Still on someone's desk. */
export const OPEN_STATUSES: TaskStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "BLOCKED",
  "SUBMITTED",
  "CHANGES_REQUESTED",
];

export function canUseTaskBoard(role: string | undefined | null): boolean {
  return TASK_ROLES.includes(role as typeof TASK_ROLES[number]);
}

/** May assign work to someone other than themselves. */
export function canAssignToOthers(role: string | undefined | null): boolean {
  return TASK_ASSIGNER_ROLES.includes(role as typeof TASK_ASSIGNER_ROLES[number]);
}

/** May see every desk, not just their own and the ones they assign to. */
export function canSeeAllTasks(role: string | undefined | null): boolean {
  return ELEVATED_ROLES.includes(role as typeof ELEVATED_ROLES[number]);
}

/**
 * What the assignee may move a task to. Submitting is how work comes back;
 * blocking is how someone stops without having to interrupt anyone.
 */
const ASSIGNEE_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  ASSIGNED: ["IN_PROGRESS", "BLOCKED", "SUBMITTED"],
  IN_PROGRESS: ["BLOCKED", "SUBMITTED"],
  BLOCKED: ["IN_PROGRESS", "SUBMITTED"],
  CHANGES_REQUESTED: ["IN_PROGRESS", "BLOCKED", "SUBMITTED"],
  SUBMITTED: ["IN_PROGRESS"], // pulled back before the reviewer gets to it
  DONE: [],
  CANCELLED: [],
};

/**
 * What the assigner, who is also the reviewer, may move a task to. Review lands
 * in CHANGES_REQUESTED with a written note rather than the work being silently
 * redone by the reviewer.
 */
const ASSIGNER_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["CANCELLED"],
  BLOCKED: ["ASSIGNED", "IN_PROGRESS", "CANCELLED"], // unblocking it
  SUBMITTED: ["CHANGES_REQUESTED", "DONE", "CANCELLED"],
  CHANGES_REQUESTED: ["DONE", "CANCELLED"],
  DONE: ["CHANGES_REQUESTED"], // reopened if it turns out it was not done
  CANCELLED: ["ASSIGNED"],
};

export type TaskParty = "ASSIGNEE" | "ASSIGNER" | "BOTH" | "NONE";

export function partyFor(
  task: { assigneeId: string; assignerId: string },
  userId: string,
): TaskParty {
  const isAssignee = task.assigneeId === userId;
  const isAssigner = task.assignerId === userId;
  if (isAssignee && isAssigner) return "BOTH";
  if (isAssignee) return "ASSIGNEE";
  if (isAssigner) return "ASSIGNER";
  return "NONE";
}

export function allowedTransitions(from: TaskStatus, party: TaskParty): TaskStatus[] {
  if (party === "NONE") return [];
  const set = new Set<TaskStatus>();
  if (party === "ASSIGNEE" || party === "BOTH") ASSIGNEE_TRANSITIONS[from].forEach((s) => set.add(s));
  if (party === "ASSIGNER" || party === "BOTH") ASSIGNER_TRANSITIONS[from].forEach((s) => set.add(s));
  return [...set];
}

/**
 * A transition is only valid if the party may make it and the note it depends on
 * is actually written. Blocking without saying what is in the way, or sending
 * work back without saying what to change, defeats the point of both statuses.
 */
export function validateTransition({
  from,
  to,
  party,
  blockedReason,
  reviewNote,
}: {
  from: TaskStatus;
  to: TaskStatus;
  party: TaskParty;
  blockedReason?: string | null;
  reviewNote?: string | null;
}): { ok: true } | { ok: false; error: string } {
  if (from === to) return { ok: true };
  if (party === "NONE") return { ok: false, error: "This task is not on your desk." };
  if (!allowedTransitions(from, party).includes(to)) {
    return { ok: false, error: `Cannot move a task from ${from} to ${to}.` };
  }
  if (to === "BLOCKED" && !blockedReason?.trim()) {
    return { ok: false, error: "Say what is in the way so your assigner can unblock it." };
  }
  if (to === "CHANGES_REQUESTED" && !reviewNote?.trim()) {
    return { ok: false, error: "Write what needs to change. A note is what makes the correction reusable." };
  }
  return { ok: true };
}
