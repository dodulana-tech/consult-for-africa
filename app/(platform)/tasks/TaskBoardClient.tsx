"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  STATUS_STYLES,
  checkInDue,
  formatDate,
  formatMinutes,
  isOverdue,
  type TaskPerson,
  type TaskRow,
} from "./taskUi";

type View = "mine" | "assigned" | "all";

interface Props {
  currentUserId: string;
  canAssign: boolean;
  canSeeAll: boolean;
}

const inputClass =
  "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };

const EMPTY_FORM = {
  title: "",
  assigneeId: "",
  brief: "",
  definitionOfDone: "",
  dueDate: "",
  checkInAt: "",
  estimatedMinutes: "",
};

export default function TaskBoardClient({ currentUserId, canAssign, canSeeAll }: Props) {
  const [view, setView] = useState<View>("mine");
  const [showDone, setShowDone] = useState(false);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<TaskPerson[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const status = showDone ? "" : "&status=open";
    fetch(`/api/tasks?view=${view}&topLevel=true${status}`)
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks ?? []))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [view, showDone]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/tasks/people")
      .then((r) => r.json())
      .then((d) => setPeople(d.people ?? []))
      .catch(() => setPeople([]));
  }, []);

  // What is actually waiting on this person right now, split by which side of
  // the desk they are on. Work comes back to the assigner; corrections and
  // check-ins land on the assignee.
  const needsYou = useMemo(() => {
    return tasks.filter((t) => {
      if (t.assigner.id === currentUserId && ["SUBMITTED", "BLOCKED"].includes(t.status)) return true;
      if (t.assignee.id === currentUserId) {
        if (t.status === "CHANGES_REQUESTED") return true;
        if (isOverdue(t.dueDate, t.status)) return true;
        if (checkInDue(t.checkInAt, t.status)) return true;
      }
      return false;
    });
  }, [tasks, currentUserId]);

  const grouped = useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    for (const s of STATUS_ORDER) {
      const inStatus = tasks.filter((t) => t.status === s);
      if (inStatus.length) map.set(s, inStatus);
    }
    return map;
  }, [tasks]);

  function setField(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submitTask(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          assigneeId: form.assigneeId || currentUserId,
          estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : null,
          dueDate: form.dueDate || null,
          checkInAt: form.checkInAt || null,
        }),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "Could not create the task."));
        return;
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
        {/* View switch */}
        <div className="flex flex-wrap items-center gap-2">
          <ViewTab label="My desk" active={view === "mine"} onClick={() => setView("mine")} />
          {canAssign && (
            <ViewTab label="I assigned" active={view === "assigned"} onClick={() => setView("assigned")} />
          )}
          {canSeeAll && (
            <ViewTab label="Everyone" active={view === "all"} onClick={() => setView("all")} />
          )}
          <button
            onClick={() => setShowDone((v) => !v)}
            className="ml-auto text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: "#e5eaf0", color: showDone ? "#0F2744" : "#94A3B8" }}
          >
            {showDone ? "Hiding nothing" : "Show finished"}
          </button>
        </div>

        {/* Waiting on you */}
        {!loading && needsYou.length > 0 && (
          <div className="rounded-xl border p-4" style={{ borderColor: "#FDE68A", background: "#FFFBEB" }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} style={{ color: "#B45309" }} />
              <p className="text-sm font-semibold" style={{ color: "#92400E" }}>
                Waiting on you ({needsYou.length})
              </p>
            </div>
            <div className="space-y-1.5">
              {needsYou.map((t) => (
                <Link
                  key={t.id}
                  href={`/tasks/${t.id}`}
                  className="flex items-center gap-2 text-sm hover:underline"
                  style={{ color: "#92400E" }}
                >
                  <ChevronRight size={13} />
                  <span className="font-medium">{t.title}</span>
                  <span className="text-xs opacity-75">{whyItNeedsYou(t, currentUserId)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* New task */}
        <div>
          <button
            onClick={() => { setShowForm((v) => !v); setError(""); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: "#0F2744" }}
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "Cancel" : canAssign ? "Assign a task" : "Raise a task"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={submitTask}
            className="rounded-xl border bg-white p-4 sm:p-5 space-y-4"
            style={{ borderColor: "#e5eaf0" }}
          >
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Task</label>
              <input
                className={inputClass}
                style={inputStyle}
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="What needs doing"
                required
              />
            </div>

            {canAssign && people.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Assign to</label>
                <select
                  className={inputClass}
                  style={inputStyle}
                  value={form.assigneeId}
                  onChange={(e) => setField("assigneeId", e.target.value)}
                >
                  <option value="">Myself</option>
                  {people
                    .filter((p) => p.id !== currentUserId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.role.replace(/_/g, " ").toLowerCase()})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Brief <span className="font-normal text-gray-400">Why this matters and what it feeds into</span>
              </label>
              <textarea
                className={inputClass}
                style={inputStyle}
                rows={3}
                value={form.brief}
                onChange={(e) => setField("brief", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Done looks like <span className="font-normal text-gray-400">In their words, not yours</span>
              </label>
              <textarea
                className={inputClass}
                style={inputStyle}
                rows={3}
                value={form.definitionOfDone}
                onChange={(e) => setField("definitionOfDone", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Due</label>
                <input
                  type="date"
                  className={inputClass}
                  style={inputStyle}
                  value={form.dueDate}
                  onChange={(e) => setField("dueDate", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Check in</label>
                <input
                  type="date"
                  className={inputClass}
                  style={inputStyle}
                  value={form.checkInAt}
                  onChange={(e) => setField("checkInAt", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estimate (minutes)</label>
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  style={inputStyle}
                  value={form.estimatedMinutes}
                  onChange={(e) => setField("estimatedMinutes", e.target.value)}
                  placeholder="e.g. 90"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Set the check-in at a deliberate mid-point. A five day task wants a day two conversation, not a day five surprise.
            </p>

            {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ background: "#0F2744" }}
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              {saving ? "Saving" : "Send it"}
            </button>
          </form>
        )}

        {/* Board */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
            <Loader2 size={16} className="animate-spin" /> Loading
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 rounded-xl border bg-white" style={{ borderColor: "#e5eaf0" }}>
            <ClipboardList size={26} className="mx-auto mb-3" style={{ color: "#CBD5E1" }} />
            <p className="text-sm text-gray-500">Nothing on this desk.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {[...grouped.entries()].map(([status, rows]) => (
              <div key={status}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: STATUS_STYLES[status].dot }} />
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#94A3B8" }}>
                    {STATUS_LABELS[status]} ({rows.length})
                  </p>
                </div>
                <div className="space-y-2">
                  {rows.map((t) => <TaskCard key={t.id} task={t} currentUserId={currentUserId} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function whyItNeedsYou(t: TaskRow, userId: string): string {
  if (t.assigner.id === userId && t.status === "SUBMITTED") return "ready for review";
  if (t.assigner.id === userId && t.status === "BLOCKED") return `blocked by ${t.assignee.name.split(" ")[0]}`;
  if (t.status === "CHANGES_REQUESTED") return "changes requested";
  if (isOverdue(t.dueDate, t.status)) return "overdue";
  if (checkInDue(t.checkInAt, t.status)) return "check-in due";
  return "";
}

function ViewTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
      style={{
        background: active ? "#0F2744" : "#fff",
        color: active ? "#fff" : "#64748B",
        border: `1px solid ${active ? "#0F2744" : "#e5eaf0"}`,
      }}
    >
      {label}
    </button>
  );
}

function TaskCard({ task, currentUserId }: { task: TaskRow; currentUserId: string }) {
  const s = STATUS_STYLES[task.status];
  const overdue = isOverdue(task.dueDate, task.status);
  const checkIn = checkInDue(task.checkInAt, task.status);
  const other = task.assignee.id === currentUserId ? task.assigner : task.assignee;
  const relation = task.assignee.id === currentUserId ? "from" : "with";

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow"
      style={{ borderColor: overdue ? "#FCA5A5" : "#e5eaf0" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.brief}</p>
        </div>
        <span
          className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full"
          style={{ background: s.bg, color: s.text }}
        >
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[11px]" style={{ color: "#94A3B8" }}>
        <span>{relation} {other.name}</span>
        {task.dueDate && (
          <span style={{ color: overdue ? "#DC2626" : undefined }}>
            due {formatDate(task.dueDate)}
          </span>
        )}
        {task.checkInAt && (
          <span className="flex items-center gap-1" style={{ color: checkIn ? "#B45309" : undefined }}>
            <CalendarClock size={11} /> check in {formatDate(task.checkInAt)}
          </span>
        )}
        {task.estimatedMinutes ? <span>est {formatMinutes(task.estimatedMinutes)}</span> : null}
        {task._count && task._count.subtasks > 0 ? <span>{task._count.subtasks} sub-tasks</span> : null}
      </div>
    </Link>
  );
}
