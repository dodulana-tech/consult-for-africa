"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Loader2, Plus, Power, X } from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";
import { describeCadence } from "@/lib/office";
import type { TaskPerson } from "../tasks/taskUi";

interface Rhythm {
  id: string;
  title: string;
  brief: string;
  definitionOfDone: string;
  cadence: "WEEKLY" | "FORTNIGHTLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL";
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  monthOfYear: number | null;
  leadTimeDays: number;
  checkInOffsetDays: number | null;
  estimatedMinutes: number | null;
  active: boolean;
  lastGeneratedFor: string | null;
  nextOccurrence: string | null;
  assignee: TaskPerson;
  assigner: TaskPerson;
  _count: { generatedTasks: number };
}

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "";

const EMPTY = {
  title: "", brief: "", definitionOfDone: "", assigneeId: "",
  cadence: "MONTHLY", dayOfWeek: "1", dayOfMonth: "1", monthOfYear: "1",
  leadTimeDays: "0", checkInOffsetDays: "", estimatedMinutes: "",
};

export default function RhythmClient({ canManage }: { canManage: boolean }) {
  const [rhythms, setRhythms] = useState<Rhythm[]>([]);
  const [people, setPeople] = useState<TaskPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    return fetch("/api/rhythm?includeInactive=true")
      .then((r) => r.json())
      .then((d) => setRhythms(d.rhythms ?? []))
      .catch(() => setRhythms([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    fetch("/api/tasks/people").then((r) => r.json()).then((d) => setPeople(d.people ?? [])).catch(() => {});
  }, []);

  const needsWeekday = ["WEEKLY", "FORTNIGHTLY"].includes(form.cadence);
  const needsMonth = ["QUARTERLY", "ANNUAL"].includes(form.cadence);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/rhythm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dayOfWeek: needsWeekday ? Number(form.dayOfWeek) : null,
          dayOfMonth: needsWeekday ? null : Number(form.dayOfMonth),
          monthOfYear: needsMonth ? Number(form.monthOfYear) : null,
          leadTimeDays: Number(form.leadTimeDays) || 0,
          checkInOffsetDays: form.checkInOffsetDays ? Number(form.checkInOffsetDays) : null,
          estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : null,
        }),
      });
      if (!res.ok) { setError(await parseApiError(res, "Could not save it.")); return; }
      setForm(EMPTY);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggle(r: Rhythm) {
    await fetch(`/api/rhythm/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !r.active }),
    });
    load();
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
        {canManage && (
          <button
            onClick={() => { setShowForm((v) => !v); setError(""); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "#0F2744" }}
          >
            {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? "Cancel" : "Add to the rhythm"}
          </button>
        )}

        {showForm && (
          <form onSubmit={create} className="rounded-xl border bg-white p-5 space-y-3" style={{ borderColor: "#e5eaf0" }}>
            <input className={inputClass} style={inputStyle} placeholder="What repeats, e.g. Board pack" value={form.title} onChange={(e) => set("title", e.target.value)} required />
            <select className={inputClass} style={inputStyle} value={form.assigneeId} onChange={(e) => set("assigneeId", e.target.value)} required>
              <option value="">Whose desk does it land on?</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <textarea className={inputClass} style={inputStyle} rows={2} placeholder="Brief: why this matters and what it feeds into" value={form.brief} onChange={(e) => set("brief", e.target.value)} required />
            <textarea className={inputClass} style={inputStyle} rows={2} placeholder="Done looks like" value={form.definitionOfDone} onChange={(e) => set("definitionOfDone", e.target.value)} required />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">How often</label>
                <select className={inputClass} style={inputStyle} value={form.cadence} onChange={(e) => set("cadence", e.target.value)}>
                  <option value="WEEKLY">Weekly</option>
                  <option value="FORTNIGHTLY">Fortnightly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUAL">Annually</option>
                </select>
              </div>
              {needsWeekday ? (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Day</label>
                  <select className={inputClass} style={inputStyle} value={form.dayOfWeek} onChange={(e) => set("dayOfWeek", e.target.value)}>
                    {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Day of month</label>
                  <select className={inputClass} style={inputStyle} value={form.dayOfMonth} onChange={(e) => set("dayOfMonth", e.target.value)}>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
              {needsMonth && (
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">{form.cadence === "QUARTERLY" ? "Starting month" : "Month"}</label>
                  <select className={inputClass} style={inputStyle} value={form.monthOfYear} onChange={(e) => set("monthOfYear", e.target.value)}>
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Raise it this many days early</label>
                <input type="number" min={0} max={60} className={inputClass} style={inputStyle} value={form.leadTimeDays} onChange={(e) => set("leadTimeDays", e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Check in this many days before</label>
                <input type="number" min={0} max={60} className={inputClass} style={inputStyle} value={form.checkInOffsetDays} onChange={(e) => set("checkInOffsetDays", e.target.value)} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Estimate (min)</label>
                <input type="number" min={1} className={inputClass} style={inputStyle} value={form.estimatedMinutes} onChange={(e) => set("estimatedMinutes", e.target.value)} />
              </div>
            </div>
            <p className="text-xs" style={{ color: "#94A3B8" }}>
              Lead time is what makes this useful. A board pack due on the 30th is no good raised on the 30th.
            </p>

            {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "#0F2744" }}>
              {saving ? "Saving" : "Add it"}
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
            <Loader2 size={16} className="animate-spin" /> Loading
          </div>
        ) : rhythms.length === 0 ? (
          <div className="text-center py-16 rounded-xl border bg-white" style={{ borderColor: "#e5eaf0" }}>
            <CalendarClock size={24} className="mx-auto mb-3" style={{ color: "#CBD5E1" }} />
            <p className="text-sm text-gray-500">Nothing repeating yet. The weekly partner meeting and the monthly invoice run are the usual first two.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rhythms.map((r) => (
              <div key={r.id} className="rounded-xl border bg-white p-4" style={{ borderColor: "#e5eaf0", opacity: r.active ? 1 : 0.55 }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                    <p className="text-xs mt-1" style={{ color: "#64748B" }}>
                      {describeCadence(r)} · {r.assignee.name}
                      {r.leadTimeDays > 0 ? ` · raised ${r.leadTimeDays} days early` : ""}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: "#94A3B8" }}>
                      {r.active && r.nextOccurrence ? `Next ${fmt(r.nextOccurrence)}` : "Retired"}
                      {r._count.generatedTasks > 0 ? ` · ${r._count.generatedTasks} raised so far` : " · none raised yet"}
                    </p>
                  </div>
                  {canManage && (
                    <button onClick={() => toggle(r)} title={r.active ? "Retire" : "Bring back"}
                      className="shrink-0 p-2 rounded-lg border"
                      style={{ borderColor: "#e5eaf0", color: r.active ? "#64748B" : "#10B981" }}>
                      <Power size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
