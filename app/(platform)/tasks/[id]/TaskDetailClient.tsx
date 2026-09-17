"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Loader2,
  OctagonX,
  Pencil,
  Plus,
  Send,
  Undo2,
} from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  isSettled,
  linkedSection,
  formatDate,
  formatMinutes,
  isOverdue,
  type TaskPerson,
  type TaskRow,
} from "../taskUi";

interface Subtask {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  checkInAt: string | null;
  assignee: TaskPerson;
  assigner: TaskPerson;
}

interface Question {
  id: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  askedBy: TaskPerson;
  answeredBy: TaskPerson | null;
}

interface TaskDetail extends TaskRow {
  workedExample: string | null;
  questions: Question[];
  evidence: { summary: string; empty: boolean } | null;
  parentTask: { id: string; title: string; assignee: TaskPerson; assigner: TaskPerson } | null;
  subtasks: Subtask[];
  subtaskRollup: { total: number; done: number; blocked: number; byStatus: Record<string, number> };
  viewer: {
    party: "ASSIGNEE" | "ASSIGNER" | "BOTH" | "NONE";
    canTransitionTo: string[];
    canEditFields: boolean;
    canBreakDown: boolean;
  };
}

const inputClass =
  "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };

/** What each move is called from the desk it is made on. */
const ACTION_LABELS: Record<string, string> = {
  IN_PROGRESS: "Start it",
  BLOCKED: "I am stuck",
  SUBMITTED: "Submit for review",
  CHANGES_REQUESTED: "Send it back",
  DONE: "Sign it off",
  CANCELLED: "Cancel it",
  ASSIGNED: "Put it back on the desk",
};

export default function TaskDetailClient({
  taskId,
  currentUserId,
  canAssign,
}: {
  taskId: string;
  currentUserId: string;
  canAssign: boolean;
}) {
  const router = useRouter();
  const [task, setTask] = useState<TaskDetail | null>(null);
  // What just happened, so the page confirms the move instead of only
  // offering the next one.
  const [justMoved, setJustMoved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [breakingDown, setBreakingDown] = useState(false);
  const [asking, setAsking] = useState(false);
  const [questionText, setQuestionText] = useState("");

  const load = useCallback(() => {
    fetch(`/api/tasks/${taskId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await parseApiError(r, "Could not load the task."));
        return r.json();
      })
      .then((d) => setTask(d.task))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [taskId]);

  useEffect(() => { load(); }, [load]);

  async function move(to: string) {
    if (!task) return;
    // Blocking and sending back both depend on a written note, so ask for it
    // before the move rather than letting the status land bare.
    if ((to === "BLOCKED" || to === "CHANGES_REQUESTED") && pending !== to) {
      setPending(to);
      setNote(to === "BLOCKED" ? task.blockedReason ?? "" : task.reviewNote ?? "");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = { status: to };
      if (to === "BLOCKED") body.blockedReason = note;
      if (to === "CHANGES_REQUESTED") body.reviewNote = note;
      if (to === "DONE" && note.trim()) body.reviewNote = note;
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "Could not update the task."));
        return;
      }
      const d = await res.json();
      setTask(d.task);
      setPending(null);
      setNote("");
      setJustMoved(to);
      // "Every task that has a section on the platform should lead me directly
      // to it after clicking the start it button." Starting work should put
      // her in the place the work happens.
      if (to === "IN_PROGRESS") {
        const section = linkedSection(d.task.linkedEntityType, d.task.linkedEntityId);
        if (section) router.push(section.href);
      }
    } finally {
      setSaving(false);
    }
  }

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "Could not update the task."));
        return false;
      }
      const d = await res.json();
      setTask(d.task);
      return true;
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400 gap-2">
        <Loader2 size={16} className="animate-spin" /> Loading
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500 px-6 text-center">
        {error || "Task not found."}
      </div>
    );
  }

  const s = STATUS_STYLES[task.status];
  const settled = isSettled(task.status);
  const settledTone =
    task.status === "DONE" ? { bg: "#ECFDF5", border: "#A7F3D0", text: "#065F46" }
    : task.status === "BLOCKED" ? { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B" }
    : task.status === "CANCELLED" ? { bg: "#F8FAFC", border: "#E2E8F0", text: "#475569" }
    : { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF" };
  const section = linkedSection(task.linkedEntityType, task.linkedEntityId);
  const primary = primaryFor(task.status, task.viewer.party, task.viewer.canTransitionTo);
  const secondary = task.viewer.canTransitionTo.filter((t) => t !== primary);
  const settledMessage = settledCopy(task, justMoved);
  const overdue = isOverdue(task.dueDate, task.status);
  const isAssignee = task.assignee.id === currentUserId;
  const overrun =
    task.estimatedMinutes && task.actualMinutes
      ? task.actualMinutes / task.estimatedMinutes
      : null;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
        {task.parentTask && (
          <Link
            href={`/tasks/${task.parentTask.id}`}
            className="inline-flex items-center gap-1.5 text-xs hover:underline"
            style={{ color: "#64748B" }}
          >
            <Undo2 size={12} /> Part of {task.parentTask.title}
          </Link>
        )}

        {/* Header */}
        <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#e5eaf0" }}>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
            <span
              className="shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: s.bg, color: s.text }}
            >
              {STATUS_LABELS[task.status]}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-xs" style={{ color: "#64748B" }}>
            <Fact label="Assigned to" value={task.assignee.name} />
            <Fact label="Reviewed by" value={task.assigner.name} />
            {task.dueDate && (
              <Fact label="Due" value={formatDate(task.dueDate)} alert={overdue} />
            )}
            {task.checkInAt && <Fact label="Check in" value={formatDate(task.checkInAt)} />}
            {task.estimatedMinutes ? (
              <Fact label="Estimate" value={formatMinutes(task.estimatedMinutes)} />
            ) : null}
            {task.actualMinutes ? (
              <Fact
                label="Actual"
                value={formatMinutes(task.actualMinutes)}
                alert={!!overrun && overrun >= 3}
              />
            ) : null}
          </div>

          {overrun && overrun >= 3 && (
            <p className="mt-3 text-xs" style={{ color: "#B45309" }}>
              This took over three times the estimate. The estimate was wrong, which is worth a conversation on both sides.
            </p>
          )}
        </div>

        {/* Where the work happens. Present on the task itself, not only after
            clicking start, so it is reachable whenever she comes back to it. */}
        {section && task.status !== "DONE" && task.status !== "CANCELLED" && (
          <Link
            href={section.href}
            className="flex items-center justify-between gap-3 rounded-xl border bg-white px-5 py-4 hover:shadow-sm transition-shadow"
            style={{ borderColor: "#e5eaf0" }}
          >
            <span>
              <span className="text-sm font-semibold text-gray-900">Open {section.label}</span>
              <span className="block text-xs mt-0.5" style={{ color: "#94A3B8" }}>This is where this task gets done.</span>
            </span>
            <ChevronRight size={16} style={{ color: "#0F2744" }} />
          </Link>
        )}

        {/* Brief and definition of done */}
        <Panel title="Why this matters" body={task.brief} />
        <Panel title="Done looks like" body={task.definitionOfDone} accent="#10B981" />
        {task.workedExample && (
          <Panel title="One that is already right" body={task.workedExample} accent="#6366F1" />
        )}

        {task.status === "BLOCKED" && task.blockedReason && (
          <Panel title="What is in the way" body={task.blockedReason} accent="#EF4444" />
        )}
        {task.reviewNote && (
          <Panel
            title={task.status === "DONE" ? "Sign-off note" : "What needs to change"}
            body={task.reviewNote}
            accent={task.status === "DONE" ? "#10B981" : "#F97316"}
          />
        )}

        {task.evidence && (
          <div
            className="rounded-xl p-4"
            style={{
              background: task.evidence.empty ? "#FFFBEB" : "#F8FAFC",
              border: `1px solid ${task.evidence.empty ? "#FDE68A" : "#e5eaf0"}`,
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: task.evidence.empty ? "#92400E" : "#94A3B8" }}>
              Before you sign this off
            </p>
            <p className="text-sm" style={{ color: task.evidence.empty ? "#78350F" : "#475569" }}>
              {task.evidence.summary}
            </p>
            {task.evidence.empty && (
              <p className="text-xs mt-2" style={{ color: "#92400E" }}>
                That may be fine. It may also mean the work went somewhere other than the platform, or that the brief was not clear about where it should land. Worth asking before it becomes the habit.
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm rounded-lg px-3 py-2" style={{ color: "#991B1B", background: "#FEF2F2" }}>
            {error}
          </p>
        )}

        {/* Note first, then the move */}
        {pending && (
          <div className="rounded-xl border bg-white p-4 space-y-3" style={{ borderColor: "#e5eaf0" }}>
            <label className="block text-xs font-semibold text-gray-600">
              {pending === "BLOCKED"
                ? "What is in the way? This goes to your assigner, not to the whole firm."
                : "What needs to change? Write it so the correction is reusable."}
            </label>
            <textarea
              className={inputClass}
              style={inputStyle}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => move(pending)}
                disabled={saving || !note.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ background: pending === "BLOCKED" ? "#EF4444" : "#F97316" }}
              >
                {saving ? "Saving" : ACTION_LABELS[pending]}
              </button>
              <button
                onClick={() => { setPending(null); setNote(""); }}
                className="px-4 py-2 rounded-lg text-sm font-medium border"
                style={{ borderColor: "#e5eaf0", color: "#64748B" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* What just happened. A settled task says so rather than offering the
            next button as though the move never landed. */}
        {!pending && settled && (
          <div className="rounded-xl p-4" style={{ background: settledTone.bg, border: `1px solid ${settledTone.border}` }}>
            <div className="flex items-start gap-2">
              {task.status === "DONE" ? <CheckCircle2 size={16} style={{ color: settledTone.text, marginTop: 1 }} />
                : task.status === "BLOCKED" ? <OctagonX size={16} style={{ color: settledTone.text, marginTop: 1 }} />
                : <Send size={16} style={{ color: settledTone.text, marginTop: 1 }} />}
              <div>
                <p className="text-sm font-semibold" style={{ color: settledTone.text }}>{settledMessage.title}</p>
                <p className="text-sm mt-0.5" style={{ color: settledTone.text, opacity: 0.85 }}>{settledMessage.detail}</p>
              </div>
            </div>
          </div>
        )}

        {/* One obvious next move, with the rest demoted to quiet links so they
            never read as "that did not work, try again". */}
        {!pending && (primary || secondary.length > 0) && (
          <div className="flex flex-wrap items-center gap-3">
            {primary && (
              <button
                onClick={() => move(primary)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={actionStyle(primary)}
              >
                {primary === "SUBMITTED" ? <Send size={14} /> : primary === "DONE" ? <CheckCircle2 size={14} /> : <ChevronRight size={14} />}
                {ACTION_LABELS[primary] ?? STATUS_LABELS[primary]}
              </button>
            )}
            {secondary.map((to) => (
              <button
                key={to}
                onClick={() => move(to)}
                disabled={saving}
                className="text-sm font-medium underline underline-offset-2 disabled:opacity-50"
                style={{ color: to === "BLOCKED" ? "#B91C1C" : to === "CANCELLED" ? "#94A3B8" : "#64748B" }}
              >
                {ACTION_LABELS[to] ?? STATUS_LABELS[to]}
              </button>
            ))}
          </div>
        )}

        {/* Time actually taken. Once recorded it is a fact in the header, so the
            box comes down rather than sitting there inviting a second answer. */}
        {isAssignee && !task.actualMinutes && ["SUBMITTED", "DONE", "IN_PROGRESS", "CHANGES_REQUESTED"].includes(task.status) && (
          <ActualMinutes current={task.actualMinutes} saving={saving} onSave={(m) => patch({ actualMinutes: m })} />
        )}

        {/* Questions. Not blocking: the work carries on while the answer comes. */}
        {task.viewer.party !== "NONE" && !["DONE", "CANCELLED"].includes(task.status) && (
          <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#e5eaf0" }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-gray-900">Questions</p>
              {task.questions.length > 0 && (
                <p className="text-xs" style={{ color: "#94A3B8" }}>
                  {task.questions.filter((q) => !q.answeredAt).length} unanswered
                </p>
              )}
            </div>
            <p className="text-xs mb-3" style={{ color: "#94A3B8" }}>
              For when you are still going but unsure what was meant. This is not the same as being stuck, and it does not stop the clock.
            </p>

            {task.questions.length > 0 && (
              <div className="space-y-3 mb-4">
                {task.questions.map((q) => (
                  <QuestionRow
                    key={q.id}
                    q={q}
                    taskId={taskId}
                    currentUserId={currentUserId}
                    onAnswered={load}
                  />
                ))}
              </div>
            )}

            {asking ? (
              <div className="space-y-2">
                <textarea
                  className={inputClass}
                  style={inputStyle}
                  rows={3}
                  autoFocus
                  placeholder="What is not clear?"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    disabled={saving || !questionText.trim()}
                    onClick={async () => {
                      setSaving(true);
                      setError("");
                      try {
                        const res = await fetch(`/api/tasks/${taskId}/questions`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ question: questionText }),
                        });
                        if (!res.ok) { setError(await parseApiError(res, "Could not send that.")); return; }
                        setQuestionText("");
                        setAsking(false);
                        load();
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: "#0F2744" }}
                  >
                    {saving ? "Sending" : "Ask it"}
                  </button>
                  <button
                    onClick={() => { setAsking(false); setQuestionText(""); }}
                    className="px-4 py-2 rounded-lg text-sm font-medium border"
                    style={{ borderColor: "#e5eaf0", color: "#64748B" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAsking(true)}
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: "#0F2744" }}
              >
                <HelpCircle size={14} /> Ask a question
              </button>
            )}
          </div>
        )}

        {/* Sub-tasks */}
        {(task.subtaskRollup.total > 0 || (task.viewer.canBreakDown && canAssign)) && (
          <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#e5eaf0" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">Broken down</p>
              {task.subtaskRollup.total > 0 && (
                <p className="text-xs" style={{ color: "#64748B" }}>
                  {task.subtaskRollup.done} of {task.subtaskRollup.total} done
                  {task.subtaskRollup.blocked > 0 && (
                    <span style={{ color: "#DC2626" }}> · {task.subtaskRollup.blocked} blocked</span>
                  )}
                </p>
              )}
            </div>

            {task.subtaskRollup.total > 0 && (
              <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: "#F1F5F9" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(task.subtaskRollup.done / task.subtaskRollup.total) * 100}%`,
                    background: "#10B981",
                  }}
                />
              </div>
            )}

            {task.subtasks.length > 0 ? (
              <div className="space-y-1.5">
                {task.subtasks.map((st) => (
                  <Link
                    key={st.id}
                    href={`/tasks/${st.id}`}
                    className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm text-gray-800 truncate">{st.title}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px]" style={{ color: "#94A3B8" }}>{st.assignee.name}</span>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: STATUS_STYLES[st.status].bg, color: STATUS_STYLES[st.status].text }}
                      >
                        {STATUS_LABELS[st.status]}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : task.subtaskRollup.total > 0 ? (
              <p className="text-xs" style={{ color: "#94A3B8" }}>
                The detail sits with the people doing it. You see the rollup.
              </p>
            ) : null}

            {task.viewer.canBreakDown && canAssign && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid #f1f5f9" }}>
                {breakingDown ? (
                  <SubtaskForm
                    parentTaskId={task.id}
                    currentUserId={currentUserId}
                    onDone={() => { setBreakingDown(false); load(); }}
                    onCancel={() => setBreakingDown(false)}
                  />
                ) : (
                  <button
                    onClick={() => setBreakingDown(true)}
                    className="flex items-center gap-2 text-sm font-medium"
                    style={{ color: "#0F2744" }}
                  >
                    <Plus size={14} /> Break off a sub-task
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Edit the terms */}
        {task.viewer.canEditFields && (
          <div>
            {editing ? (
              <EditForm
                task={task}
                saving={saving}
                onSave={async (body) => { if (await patch(body)) setEditing(false); }}
                onCancel={() => setEditing(false)}
              />
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: "#64748B" }}
              >
                <Pencil size={13} /> Edit the terms of this task
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * One obvious next move per state. Everything else is still available, just not
 * competing with it. Abigail's report was that after submitting she saw "Start
 * it" again and read it as the submit having failed.
 */
function primaryFor(status: string, party: string, available: string[]): string | null {
  const isAssignee = party === "ASSIGNEE" || party === "BOTH";
  const isAssigner = party === "ASSIGNER" || party === "BOTH";
  const pick = (t: string) => (available.includes(t) ? t : null);
  if (isAssignee) {
    if (status === "ASSIGNED") return pick("IN_PROGRESS");
    if (status === "IN_PROGRESS") return pick("SUBMITTED");
    if (status === "CHANGES_REQUESTED") return pick("IN_PROGRESS");
  }
  if (isAssigner) {
    if (status === "SUBMITTED") return pick("DONE");
    if (status === "BLOCKED") return pick("IN_PROGRESS");
  }
  return null;
}

/** Says what happened and who holds it now, from the reader's side of the desk. */
function settledCopy(
  task: TaskDetail,
  justMoved: string | null,
): { title: string; detail: string } {
  const mine = task.viewer.party === "ASSIGNEE" || task.viewer.party === "BOTH";
  const fresh = justMoved === task.status;
  switch (task.status) {
    case "SUBMITTED":
      return mine
        ? {
            title: fresh ? "Submitted." : "Submitted and waiting.",
            detail: `${task.assigner.name} has it now and will either sign it off or send it back with a note. Nothing further is needed from you.`,
          }
        : {
            title: `${task.assignee.name} submitted this.`,
            detail: "It is waiting on your review.",
          };
    case "BLOCKED":
      return mine
        ? {
            title: fresh ? "Marked blocked." : "Blocked.",
            detail: `${task.assigner.name} has been told what is in the way and will come back to you. You do not need to chase it, and this does not count against you.`,
          }
        : {
            title: `${task.assignee.name} is stuck.`,
            detail: "They are waiting on you to clear what is in the way.",
          };
    case "DONE":
      return {
        title: "Signed off.",
        detail: `${task.assigner.name} accepted this as done.`,
      };
    default:
      return { title: "Cancelled.", detail: "No further work is needed on this." };
  }
}

function QuestionRow({
  q,
  taskId,
  currentUserId,
  onAnswered,
}: {
  q: Question;
  taskId: string;
  currentUserId: string;
  onAnswered: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  // You cannot answer your own question, which would record nothing anybody needed.
  const canAnswer = !q.answeredAt && q.askedBy.id !== currentUserId;

  return (
    <div className="rounded-lg p-3" style={{ background: "#F8FAFC", border: "1px solid #f1f5f9" }}>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{q.question}</p>
      <p className="text-[11px] mt-1" style={{ color: "#94A3B8" }}>
        {q.askedBy.name} · {new Date(q.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
      </p>

      {q.answeredAt && q.answer && (
        <div className="mt-2 pl-3" style={{ borderLeft: "2px solid #10B981" }}>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{q.answer}</p>
          <p className="text-[11px] mt-1" style={{ color: "#94A3B8" }}>{q.answeredBy?.name ?? "Answered"}</p>
        </div>
      )}

      {canAnswer && (
        <div className="mt-2 space-y-2">
          <textarea
            className={inputClass}
            style={inputStyle}
            rows={2}
            placeholder="Answer it"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          {err && <p className="text-xs" style={{ color: "#DC2626" }}>{err}</p>}
          <button
            disabled={saving || !answer.trim()}
            onClick={async () => {
              setSaving(true);
              setErr("");
              try {
                const res = await fetch(`/api/tasks/${taskId}/questions/${q.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ answer }),
                });
                if (!res.ok) { setErr(await parseApiError(res, "Could not save that.")); return; }
                setAnswer("");
                onAnswered();
              } finally {
                setSaving(false);
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
            style={{ background: "#0F2744" }}
          >
            {saving ? "Sending" : "Send the answer"}
          </button>
        </div>
      )}

      {!q.answeredAt && !canAnswer && (
        <p className="text-[11px] mt-2" style={{ color: "#94A3B8" }}>Waiting for an answer.</p>
      )}
    </div>
  );
}

function actionStyle(to: string): React.CSSProperties {
  if (to === "BLOCKED") return { background: "#fff", color: "#991B1B", border: "1px solid #FCA5A5" };
  if (to === "CHANGES_REQUESTED") return { background: "#fff", color: "#9A3412", border: "1px solid #FDBA74" };
  if (to === "DONE") return { background: "#10B981", color: "#fff", border: "1px solid #10B981" };
  if (to === "CANCELLED") return { background: "#fff", color: "#6B7280", border: "1px solid #e5eaf0" };
  return { background: "#0F2744", color: "#fff", border: "1px solid #0F2744" };
}

function Fact({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <span>
      <span style={{ color: "#94A3B8" }}>{label} </span>
      <span className="font-medium" style={{ color: alert ? "#DC2626" : "#334155" }}>{value}</span>
    </span>
  );
}

function Panel({ title, body, accent = "#0F2744" }: { title: string; body: string; accent?: string }) {
  return (
    <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#e5eaf0", borderLeft: `3px solid ${accent}` }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#94A3B8" }}>
        {title}
      </p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{body}</p>
    </div>
  );
}

function ActualMinutes({
  current,
  saving,
  onSave,
}: {
  current: number | null;
  saving: boolean;
  onSave: (minutes: number) => void;
}) {
  const [value, setValue] = useState(current ? String(current) : "");
  return (
    <div className="rounded-xl border bg-white p-4 flex flex-wrap items-end gap-3" style={{ borderColor: "#e5eaf0" }}>
      <div className="flex-1 min-w-[160px]">
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          How long it actually took (minutes)
        </label>
        <input
          type="number"
          min={1}
          className={inputClass}
          style={inputStyle}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <button
        onClick={() => onSave(Number(value))}
        disabled={saving || !value}
        className="px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-50"
        style={{ borderColor: "#e5eaf0", color: "#0F2744" }}
      >
        Record
      </button>
    </div>
  );
}

function SubtaskForm({
  parentTaskId,
  currentUserId,
  onDone,
  onCancel,
}: {
  parentTaskId: string;
  currentUserId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [people, setPeople] = useState<TaskPerson[]>([]);
  const [form, setForm] = useState({
    title: "",
    assigneeId: "",
    brief: "",
    definitionOfDone: "",
    workedExample: "",
    dueDate: "",
    checkInAt: "",
    estimatedMinutes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/tasks/people")
      .then((r) => r.json())
      .then((d) => setPeople(d.people ?? []))
      .catch(() => setPeople([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          parentTaskId,
          assigneeId: form.assigneeId || currentUserId,
          estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : null,
          dueDate: form.dueDate || null,
          checkInAt: form.checkInAt || null,
        }),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "Could not create the sub-task."));
        return;
      }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        className={inputClass}
        style={inputStyle}
        placeholder="What the sub-task is"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        required
      />
      <select className={inputClass} style={inputStyle} value={form.assigneeId} onChange={(e) => set("assigneeId", e.target.value)}>
        <option value="">Myself</option>
        {people.filter((p) => p.id !== currentUserId).map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <textarea
        className={inputClass}
        style={inputStyle}
        rows={2}
        placeholder="Why this matters and what it feeds into"
        value={form.brief}
        onChange={(e) => set("brief", e.target.value)}
        required
      />
      <textarea
        className={inputClass}
        style={inputStyle}
        rows={2}
        placeholder="Done looks like"
        value={form.definitionOfDone}
        onChange={(e) => set("definitionOfDone", e.target.value)}
        required
      />
      <textarea
        className={inputClass}
        style={inputStyle}
        rows={2}
        placeholder="One that is already right (a link, or what a finished one contains)"
        value={form.workedExample}
        onChange={(e) => set("workedExample", e.target.value)}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input type="date" className={inputClass} style={inputStyle} value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
        <input type="date" className={inputClass} style={inputStyle} value={form.checkInAt} onChange={(e) => set("checkInAt", e.target.value)} />
        <input type="number" min={1} placeholder="Estimate (min)" className={inputClass} style={inputStyle} value={form.estimatedMinutes} onChange={(e) => set("estimatedMinutes", e.target.value)} />
      </div>
      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "#0F2744" }}>
          {saving ? "Saving" : "Send it"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: "#e5eaf0", color: "#64748B" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function EditForm({
  task,
  saving,
  onSave,
  onCancel,
}: {
  task: TaskDetail;
  saving: boolean;
  onSave: (body: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: task.title,
    brief: task.brief,
    definitionOfDone: task.definitionOfDone,
    workedExample: task.workedExample ?? "",
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    checkInAt: task.checkInAt ? task.checkInAt.slice(0, 10) : "",
    estimatedMinutes: task.estimatedMinutes ? String(task.estimatedMinutes) : "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="rounded-xl border bg-white p-5 space-y-3" style={{ borderColor: "#e5eaf0" }}>
      <input className={inputClass} style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} />
      <textarea className={inputClass} style={inputStyle} rows={3} value={form.brief} onChange={(e) => set("brief", e.target.value)} />
      <textarea className={inputClass} style={inputStyle} rows={3} value={form.definitionOfDone} onChange={(e) => set("definitionOfDone", e.target.value)} />
      <textarea className={inputClass} style={inputStyle} rows={2} placeholder="One that is already right" value={form.workedExample} onChange={(e) => set("workedExample", e.target.value)} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Due</label>
          <input type="date" className={inputClass} style={inputStyle} value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1 flex items-center gap-1">
            <CalendarClock size={11} /> Check in
          </label>
          <input type="date" className={inputClass} style={inputStyle} value={form.checkInAt} onChange={(e) => set("checkInAt", e.target.value)} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Estimate (min)</label>
          <input type="number" min={1} className={inputClass} style={inputStyle} value={form.estimatedMinutes} onChange={(e) => set("estimatedMinutes", e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() =>
            onSave({
              ...form,
              dueDate: form.dueDate || null,
              checkInAt: form.checkInAt || null,
              estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : null,
            })
          }
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "#0F2744" }}
        >
          {saving ? "Saving" : "Save"}
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: "#e5eaf0", color: "#64748B" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
