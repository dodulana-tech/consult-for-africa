"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, Gavel, Loader2, Plus, X } from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";
import type { TaskPerson } from "../tasks/taskUi";

interface Decision {
  id: string;
  title: string;
  background: string;
  options: string[];
  recommendation: string;
  costOfDelay: string | null;
  dueBy: string | null;
  status: string;
  outcome: string | null;
  decidedAt: string | null;
  createdAt: string;
  forUser: TaskPerson;
  raisedBy: TaskPerson;
  decidedBy: TaskPerson | null;
}

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "#F5F3FF", text: "#6D28D9" },
  DECIDED: { bg: "#ECFDF5", text: "#065F46" },
  DEFERRED: { bg: "#FFFBEB", text: "#92400E" },
  DECLINED: { bg: "#F3F4F6", text: "#6B7280" },
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";

const EMPTY = { title: "", background: "", options: ["", ""], recommendation: "", costOfDelay: "", dueBy: "", forUserId: "" };

export default function DecisionsClient({ currentUserId }: { currentUserId: string }) {
  const [view, setView] = useState<"mine" | "raised">("mine");
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [people, setPeople] = useState<TaskPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    return fetch(`/api/decisions?view=${view}`)
      .then((r) => r.json())
      .then((d) => setDecisions(d.decisions ?? []))
      .catch(() => setDecisions([]))
      .finally(() => setLoading(false));
  }, [view]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    fetch("/api/tasks/people").then((r) => r.json()).then((d) => setPeople(d.people ?? [])).catch(() => {});
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, options: form.options.filter((o) => o.trim()), dueBy: form.dueBy || null }),
      });
      if (!res.ok) { setError(await parseApiError(res, "Could not raise the decision.")); return; }
      setForm(EMPTY);
      setShowForm(false);
      setView("raised");
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
          <Tab label="Waiting on me" active={view === "mine"} onClick={() => { setView("mine"); setLoading(true); }} />
          <Tab label="I raised" active={view === "raised"} onClick={() => { setView("raised"); setLoading(true); }} />
          <button
            onClick={() => { setShowForm((v) => !v); setError(""); }}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: "#0F2744" }}
          >
            {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? "Cancel" : "Raise a decision"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={create} className="rounded-xl border bg-white p-5 space-y-4" style={{ borderColor: "#e5eaf0" }}>
            <p className="text-xs" style={{ color: "#94A3B8" }}>
              Background, options and a recommendation are required. A decision raised without them is a forwarded problem, not a delegated one.
            </p>
            <input className={inputClass} style={inputStyle} placeholder="What has to be decided" value={form.title} onChange={(e) => set("title", e.target.value)} required />
            <select className={inputClass} style={inputStyle} value={form.forUserId} onChange={(e) => set("forUserId", e.target.value)} required>
              <option value="">Whose decision is it?</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <textarea className={inputClass} style={inputStyle} rows={3} placeholder="Background: everything they need to decide without asking you a question" value={form.background} onChange={(e) => set("background", e.target.value)} required />
            {form.options.map((o, i) => (
              <input
                key={i}
                className={inputClass}
                style={inputStyle}
                placeholder={`Option ${i + 1}`}
                value={o}
                onChange={(e) => setForm((f) => ({ ...f, options: f.options.map((x, j) => (j === i ? e.target.value : x)) }))}
              />
            ))}
            <button type="button" onClick={() => setForm((f) => ({ ...f, options: [...f.options, ""] }))} className="text-xs font-medium" style={{ color: "#0F2744" }}>
              + another option
            </button>
            <textarea className={inputClass} style={inputStyle} rows={2} placeholder="Which one you would pick, and why" value={form.recommendation} onChange={(e) => set("recommendation", e.target.value)} required />
            <textarea className={inputClass} style={inputStyle} rows={2} placeholder="What happens if this is left alone (optional, but it is the field that gets things decided)" value={form.costOfDelay} onChange={(e) => set("costOfDelay", e.target.value)} />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Needed by</label>
              <input type="date" className={inputClass} style={inputStyle} value={form.dueBy} onChange={(e) => set("dueBy", e.target.value)} />
            </div>
            {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "#0F2744" }}>
              {saving ? "Saving" : "Put it in front of them"}
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
            <Loader2 size={16} className="animate-spin" /> Loading
          </div>
        ) : decisions.length === 0 ? (
          <div className="text-center py-16 rounded-xl border bg-white" style={{ borderColor: "#e5eaf0" }}>
            <Gavel size={24} className="mx-auto mb-3" style={{ color: "#CBD5E1" }} />
            <p className="text-sm font-medium text-gray-900">Nothing waiting.</p>
            <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: "#64748B" }}>
              This is where a question that needs one person&apos;s answer gets teed up so it can be
              settled without a meeting. You write the background, the options and what you would
              do; they pick. If you find yourself chasing someone for an answer over WhatsApp,
              raise it here instead.
            </p>
          </div>
        ) : (
          decisions.map((d) => (
            <DecisionCard key={d.id} decision={d} isPrincipal={d.forUser.id === currentUserId} onChange={load} />
          ))
        )}
      </div>
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-3 py-1.5 rounded-lg text-sm font-medium"
      style={{ background: active ? "#0F2744" : "#fff", color: active ? "#fff" : "#64748B", border: `1px solid ${active ? "#0F2744" : "#e5eaf0"}` }}>
      {label}
    </button>
  );
}

function DecisionCard({ decision, isPrincipal, onChange }: { decision: Decision; isPrincipal: boolean; onChange: () => void }) {
  const [outcome, setOutcome] = useState(decision.outcome ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const s = STATUS_STYLES[decision.status];

  async function decide(status: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/decisions/${decision.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, outcome }),
      });
      if (!res.ok) { setError(await parseApiError(res, "Could not save.")); return; }
      onChange();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div id={decision.id} className="rounded-xl border bg-white p-5 space-y-3" style={{ borderColor: "#e5eaf0" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{decision.title}</p>
          <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
            {decision.raisedBy.name} raised this for {decision.forUser.name}
            {decision.dueBy ? ` · needed by ${fmt(decision.dueBy)}` : ""}
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: s.bg, color: s.text }}>
          {decision.status}
        </span>
      </div>

      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{decision.background}</p>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#94A3B8" }}>Options</p>
        <ul className="space-y-1">
          {decision.options.map((o, i) => (
            <li key={i} className="text-sm text-gray-700 flex gap-2">
              <span style={{ color: "#CBD5E1" }}>{i + 1}</span>{o}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg p-3" style={{ background: "#F8FAFC", borderLeft: "3px solid #0F2744" }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#94A3B8" }}>Recommendation</p>
        <p className="text-sm text-gray-800">{decision.recommendation}</p>
      </div>

      {decision.costOfDelay && (
        <div className="rounded-lg p-3" style={{ background: "#FFFBEB", borderLeft: "3px solid #F59E0B" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#B45309" }}>If this waits</p>
          <p className="text-sm" style={{ color: "#78350F" }}>{decision.costOfDelay}</p>
        </div>
      )}

      {decision.status !== "PENDING" && decision.outcome && (
        <div className="rounded-lg p-3" style={{ background: "#ECFDF5", borderLeft: "3px solid #10B981" }}>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#065F46" }}>
            {decision.decidedBy?.name ?? "Decided"} · {fmt(decision.decidedAt)}
          </p>
          <p className="text-sm" style={{ color: "#065F46" }}>{decision.outcome}</p>
        </div>
      )}

      {isPrincipal && decision.status === "PENDING" && (
        <div className="space-y-2 pt-2" style={{ borderTop: "1px solid #f1f5f9" }}>
          <textarea
            className={inputClass}
            style={inputStyle}
            rows={2}
            placeholder="What you decided"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
          />
          {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => decide("DECIDED")} disabled={saving || !outcome.trim()} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "#10B981" }}>
              <CheckCircle2 size={14} /> Decided
            </button>
            <button onClick={() => decide("DEFERRED")} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: "#FDE68A", color: "#92400E" }}>
              <Clock size={14} /> Not yet
            </button>
            <button onClick={() => decide("DECLINED")} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: "#e5eaf0", color: "#64748B" }}>
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
