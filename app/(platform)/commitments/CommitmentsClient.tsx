"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Handshake, Loader2, Phone, Plus, X } from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";
import type { TaskPerson } from "../tasks/taskUi";

interface Commitment {
  id: string;
  what: string;
  owedByName: string | null;
  owedByEmail: string | null;
  dueDate: string | null;
  status: string;
  chaseCount: number;
  lastChasedAt: string | null;
  nextChaseAt: string | null;
  note: string | null;
  sourceType: string | null;
  owedByUser: TaskPerson | null;
  owedToUser: TaskPerson | null;
  recordedBy: TaskPerson;
  meeting: { id: string; title: string; scheduledAt: string } | null;
}

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: "#EFF6FF", text: "#1D4ED8" },
  CHASED: { bg: "#FFFBEB", text: "#92400E" },
  HONOURED: { bg: "#ECFDF5", text: "#065F46" },
  MISSED: { bg: "#FEF2F2", text: "#991B1B" },
  DROPPED: { bg: "#F3F4F6", text: "#6B7280" },
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";

const EMPTY = { what: "", owedByUserId: "", owedByName: "", owedByEmail: "", owedToUserId: "", dueDate: "", note: "" };

export default function CommitmentsClient({ currentUserId }: { currentUserId: string }) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [people, setPeople] = useState<TaskPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClosed, setShowClosed] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const q = showClosed ? "" : "?status=open";
    return fetch(`/api/commitments${q}`)
      .then((r) => r.json())
      .then((d) => setCommitments(d.commitments ?? []))
      .catch(() => setCommitments([]))
      .finally(() => setLoading(false));
  }, [showClosed]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    fetch("/api/tasks/people").then((r) => r.json()).then((d) => setPeople(d.people ?? [])).catch(() => {});
  }, []);

  const now = Date.now();
  const { overdue, dueForChase, rest } = useMemo(() => {
    const overdue: Commitment[] = [];
    const dueForChase: Commitment[] = [];
    const rest: Commitment[] = [];
    for (const c of commitments) {
      const open = ["OPEN", "CHASED"].includes(c.status);
      if (open && c.dueDate && new Date(c.dueDate).getTime() < now) overdue.push(c);
      else if (open && c.nextChaseAt && new Date(c.nextChaseAt).getTime() <= now) dueForChase.push(c);
      else rest.push(c);
    }
    return { overdue, dueForChase, rest };
  }, [commitments, now]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/commitments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          owedToUserId: form.owedToUserId || currentUserId,
          dueDate: form.dueDate || null,
        }),
      });
      if (!res.ok) { setError(await parseApiError(res, "Could not record it.")); return; }
      setForm(EMPTY);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setShowForm((v) => !v); setError(""); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "#0F2744" }}
          >
            {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? "Cancel" : "Record a promise"}
          </button>
          <button
            onClick={() => { setShowClosed((v) => !v); setLoading(true); }}
            className="ml-auto text-xs font-medium px-3 py-1.5 rounded-lg border"
            style={{ borderColor: "#e5eaf0", color: showClosed ? "#0F2744" : "#94A3B8" }}
          >
            {showClosed ? "Showing everything" : "Show closed"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={create} className="rounded-xl border bg-white p-5 space-y-3" style={{ borderColor: "#e5eaf0" }}>
            <textarea className={inputClass} style={inputStyle} rows={2} placeholder="What was promised" value={form.what} onChange={(e) => set("what", e.target.value)} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Who owes it, if they are one of ours</label>
                <select className={inputClass} style={inputStyle} value={form.owedByUserId} onChange={(e) => set("owedByUserId", e.target.value)}>
                  <option value="">Someone outside the firm</option>
                  {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Owed to</label>
                <select className={inputClass} style={inputStyle} value={form.owedToUserId} onChange={(e) => set("owedToUserId", e.target.value)}>
                  <option value="">Me</option>
                  {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            {!form.owedByUserId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input className={inputClass} style={inputStyle} placeholder="Their name" value={form.owedByName} onChange={(e) => set("owedByName", e.target.value)} required />
                <input className={inputClass} style={inputStyle} placeholder="Their email (optional)" value={form.owedByEmail} onChange={(e) => set("owedByEmail", e.target.value)} />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1">By when</label>
              <input type="date" className={inputClass} style={inputStyle} value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </div>
            <input className={inputClass} style={inputStyle} placeholder="Context (optional)" value={form.note} onChange={(e) => set("note", e.target.value)} />
            {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "#0F2744" }}>
              {saving ? "Saving" : "Record it"}
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
            <Loader2 size={16} className="animate-spin" /> Loading
          </div>
        ) : commitments.length === 0 ? (
          <div className="text-center py-16 rounded-xl border bg-white" style={{ borderColor: "#e5eaf0" }}>
            <Handshake size={24} className="mx-auto mb-3" style={{ color: "#CBD5E1" }} />
            <p className="text-sm text-gray-500">Nothing on the register. Meetings with action items are the fastest way to fill it.</p>
          </div>
        ) : (
          <>
            <Group title="Past their date" rows={overdue} onChange={load} alert />
            <Group title="Due a chase" rows={dueForChase} onChange={load} />
            <Group title="On the register" rows={rest} onChange={load} />
          </>
        )}
      </div>
    </div>
  );
}

function Group({ title, rows, onChange, alert }: { title: string; rows: Commitment[]; onChange: () => void; alert?: boolean }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: alert ? "#DC2626" : "#94A3B8" }}>
        {title} ({rows.length})
      </p>
      <div className="space-y-2">
        {rows.map((c) => <Card key={c.id} c={c} onChange={onChange} alert={alert} />)}
      </div>
    </div>
  );
}

function Card({ c, onChange, alert }: { c: Commitment; onChange: () => void; alert?: boolean }) {
  const [busy, setBusy] = useState(false);
  const s = STATUS_STYLES[c.status];
  const who = c.owedByUser?.name ?? c.owedByName ?? "someone";
  const open = ["OPEN", "CHASED"].includes(c.status);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      await fetch(`/api/commitments/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4" style={{ borderColor: alert ? "#FCA5A5" : "#e5eaf0" }}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-900">{c.what}</p>
        <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: s.bg, color: s.text }}>
          {c.status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px]" style={{ color: "#94A3B8" }}>
        <span className="font-medium" style={{ color: "#475569" }}>{who}</span>
        <span style={{ color: alert ? "#DC2626" : undefined }}>{c.dueDate ? `due ${fmt(c.dueDate)}` : "no date agreed"}</span>
        <span>{c.chaseCount ? `chased ${c.chaseCount}x, last ${fmt(c.lastChasedAt)}` : "never chased"}</span>
        {c.meeting && <span>from {c.meeting.title}</span>}
      </div>

      {c.note && <p className="text-xs text-gray-600 mt-2">{c.note}</p>}

      {open && (
        <div className="flex flex-wrap gap-2 mt-3">
          <button onClick={() => patch({ chased: true })} disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-50"
            style={{ borderColor: "#e5eaf0", color: "#0F2744" }}>
            <Phone size={12} /> Chased today
          </button>
          <button onClick={() => patch({ status: "HONOURED" })} disabled={busy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
            style={{ background: "#10B981" }}>
            <CheckCircle2 size={12} /> They did it
          </button>
          <button onClick={() => patch({ status: "MISSED" })} disabled={busy}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-50"
            style={{ borderColor: "#FCA5A5", color: "#991B1B" }}>
            They did not
          </button>
          <button onClick={() => patch({ status: "DROPPED" })} disabled={busy}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border disabled:opacity-50"
            style={{ borderColor: "#e5eaf0", color: "#64748B" }}>
            No longer needed
          </button>
        </div>
      )}
    </div>
  );
}
