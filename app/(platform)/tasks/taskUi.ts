export const STATUS_LABELS: Record<string, string> = {
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In progress",
  BLOCKED: "Blocked",
  SUBMITTED: "Submitted",
  CHANGES_REQUESTED: "Changes requested",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

export const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  ASSIGNED: { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  IN_PROGRESS: { bg: "#F5F3FF", text: "#6D28D9", dot: "#8B5CF6" },
  BLOCKED: { bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444" },
  SUBMITTED: { bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B" },
  CHANGES_REQUESTED: { bg: "#FFF7ED", text: "#9A3412", dot: "#F97316" },
  DONE: { bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
  CANCELLED: { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
};

/** The order a desk reads in: what needs attention first, what is finished last. */
export const STATUS_ORDER = [
  "CHANGES_REQUESTED",
  "BLOCKED",
  "ASSIGNED",
  "IN_PROGRESS",
  "SUBMITTED",
  "DONE",
  "CANCELLED",
];

export function formatMinutes(minutes: number | null | undefined): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function isOverdue(iso: string | null | undefined, status: string): boolean {
  if (!iso || status === "DONE" || status === "CANCELLED") return false;
  return new Date(iso) < new Date(new Date().toDateString());
}

/** A check-in that has come due and has not been overtaken by the work finishing. */
export function checkInDue(iso: string | null | undefined, status: string): boolean {
  if (!iso) return false;
  if (["DONE", "CANCELLED", "SUBMITTED"].includes(status)) return false;
  return new Date(iso) <= new Date();
}

export interface TaskPerson {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface TaskRow {
  id: string;
  title: string;
  brief: string;
  definitionOfDone: string;
  status: string;
  dueDate: string | null;
  checkInAt: string | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  blockedReason: string | null;
  reviewNote: string | null;
  linkedEntityType: string | null;
  linkedEntityId: string | null;
  parentTaskId: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: TaskPerson;
  assigner: TaskPerson;
  _count?: { subtasks: number };
}
