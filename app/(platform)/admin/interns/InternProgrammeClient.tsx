"use client";

import { useCallback, useEffect, useState } from "react";
import { GraduationCap, Loader2, Plus, Star, X } from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";

interface Person { id: string; name: string; email: string; role: string }

interface Evaluation {
  id: string;
  period: string;
  technicalSkills: number;
  communication: number;
  professionalism: number;
  initiative: number;
  teamwork: number;
  overallScore: number;
  strengths: string[];
  areasForDevelopment: string[];
  supervisorComments: string | null;
  recommendPromotion: boolean;
  createdAt: string;
  evaluator: { id: string; name: string } | null;
}

interface Rotation {
  id: string;
  internId: string;
  startDate: string;
  endDate: string;
  status: string;
  notes: string | null;
  intern: { id: string; name: string; email: string };
  engagement: { id: string; name: string } | null;
  supervisor: { id: string; name: string } | null;
  evaluations: Evaluation[];
  _count: { evaluations: number };
}

interface Cohort {
  id: string;
  name: string;
  track: string;
  startDate: string;
  endDate: string;
  maxInterns: number;
  status: string;
  description: string | null;
  rotations: Rotation[];
}

const inputClass = "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };

const SCORES: { key: keyof ScoreForm; label: string }[] = [
  { key: "technicalSkills", label: "Technical skills" },
  { key: "communication", label: "Communication" },
  { key: "professionalism", label: "Professionalism" },
  { key: "initiative", label: "Initiative" },
  { key: "teamwork", label: "Teamwork" },
];

interface ScoreForm {
  technicalSkills: number;
  communication: number;
  professionalism: number;
  initiative: number;
  teamwork: number;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function InternProgrammeClient({ people }: { people: Person[] }) {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(() => {
    return fetch("/api/admin/cohorts")
      .then((r) => r.json())
      .then((d) => setCohorts(d.cohorts ?? []))
      .catch(() => setCohorts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
        <button
          onClick={() => setShowNew((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "#0F2744" }}
        >
          {showNew ? <X size={15} /> : <Plus size={15} />}
          {showNew ? "Cancel" : "New cohort"}
        </button>

        {showNew && <CohortForm onDone={() => { setShowNew(false); load(); }} />}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
            <Loader2 size={16} className="animate-spin" /> Loading
          </div>
        ) : cohorts.length === 0 ? (
          <div className="text-center py-16 rounded-xl border bg-white" style={{ borderColor: "#e5eaf0" }}>
            <GraduationCap size={26} className="mx-auto mb-3" style={{ color: "#CBD5E1" }} />
            <p className="text-sm text-gray-500">No cohorts yet. The first rotation gives the monthly evaluation a structure that already exists.</p>
          </div>
        ) : (
          cohorts.map((c) => <CohortCard key={c.id} cohort={c} people={people} onChange={load} />)
        )}
      </div>
    </div>
  );
}

function CohortForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ name: "", track: "SIWES", startDate: "", endDate: "", maxInterns: "5", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/cohorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, maxInterns: Number(form.maxInterns) || 5 }),
      });
      if (!res.ok) { setError(await parseApiError(res, "Could not create the cohort.")); return; }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-white p-5 space-y-3" style={{ borderColor: "#e5eaf0" }}>
      <input className={inputClass} style={inputStyle} placeholder="Cohort name, e.g. Office of the Founding Partner, Q4 2026" value={form.name} onChange={(e) => set("name", e.target.value)} required />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
        <select className={inputClass} style={inputStyle} value={form.track} onChange={(e) => set("track", e.target.value)}>
          <option value="SIWES">SIWES</option>
          <option value="SUMMER">Summer</option>
          <option value="FELLOWSHIP">Fellowship</option>
        </select>
        <input type="date" className={inputClass} style={inputStyle} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} required />
        <input type="date" className={inputClass} style={inputStyle} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} required />
        <input type="number" min={1} className={inputClass} style={inputStyle} value={form.maxInterns} onChange={(e) => set("maxInterns", e.target.value)} />
      </div>
      <textarea className={inputClass} style={inputStyle} rows={2} placeholder="What this cohort is for" value={form.description} onChange={(e) => set("description", e.target.value)} />
      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
      <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "#0F2744" }}>
        {saving ? "Saving" : "Create cohort"}
      </button>
    </form>
  );
}

function CohortCard({ cohort, people, onChange }: { cohort: Cohort; people: Person[]; onChange: () => void }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#e5eaf0" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{cohort.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
            {cohort.track} · {fmt(cohort.startDate)} to {fmt(cohort.endDate)} · {cohort.rotations.length} of {cohort.maxInterns}
          </p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: "#F1F5F9", color: "#475569" }}>
          {cohort.status}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {cohort.rotations.map((r) => (
          <RotationRow key={r.id} cohortId={cohort.id} rotation={r} onChange={onChange} />
        ))}
      </div>

      <div className="mt-4 pt-4" style={{ borderTop: "1px solid #f1f5f9" }}>
        {adding ? (
          <RotationForm
            cohortId={cohort.id}
            people={people}
            onDone={() => { setAdding(false); onChange(); }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 text-sm font-medium" style={{ color: "#0F2744" }}>
            <Plus size={14} /> Add a rotation
          </button>
        )}
      </div>
    </div>
  );
}

function RotationForm({ cohortId, people, onDone, onCancel }: { cohortId: string; people: Person[]; onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ internId: "", supervisorId: "", startDate: "", endDate: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/cohorts/${cohortId}/rotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, supervisorId: form.supervisorId || null }),
      });
      if (!res.ok) { setError(await parseApiError(res, "Could not add the rotation.")); return; }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Intern</label>
          <select className={inputClass} style={inputStyle} value={form.internId} onChange={(e) => set("internId", e.target.value)} required>
            <option value="">Choose</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Supervisor</label>
          <select className={inputClass} style={inputStyle} value={form.supervisorId} onChange={(e) => set("supervisorId", e.target.value)}>
            <option value="">None yet</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="date" className={inputClass} style={inputStyle} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} required />
        <input type="date" className={inputClass} style={inputStyle} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} required />
      </div>
      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "#0F2744" }}>
          {saving ? "Saving" : "Add rotation"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: "#e5eaf0", color: "#64748B" }}>Cancel</button>
      </div>
    </form>
  );
}

function RotationRow({ cohortId, rotation, onChange }: { cohortId: string; rotation: Rotation; onChange: () => void }) {
  const [evaluating, setEvaluating] = useState(false);

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "#f1f5f9", background: "#FBFCFD" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-900">{rotation.intern.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
            {fmt(rotation.startDate)} to {fmt(rotation.endDate)}
            {rotation.supervisor ? ` · supervised by ${rotation.supervisor.name}` : " · no supervisor set"}
          </p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: "#fff", color: "#475569", border: "1px solid #e5eaf0" }}>
          {rotation.status}
        </span>
      </div>

      {rotation.evaluations.length > 0 && (
        <div className="mt-3 space-y-2">
          {rotation.evaluations.map((ev) => (
            <div key={ev.id} className="text-xs rounded-lg p-3" style={{ background: "#fff", border: "1px solid #f1f5f9" }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">
                  {ev.period} · {ev.overallScore}/5
                </span>
                {ev.recommendPromotion && (
                  <span className="flex items-center gap-1" style={{ color: "#B45309" }}>
                    <Star size={11} /> recommended for promotion
                  </span>
                )}
              </div>
              {ev.strengths.length > 0 && (
                <p className="mt-1.5" style={{ color: "#475569" }}>Strengths: {ev.strengths.join(", ")}</p>
              )}
              {ev.areasForDevelopment.length > 0 && (
                <p className="mt-0.5" style={{ color: "#475569" }}>To develop: {ev.areasForDevelopment.join(", ")}</p>
              )}
              {ev.supervisorComments && (
                <p className="mt-1.5 whitespace-pre-wrap" style={{ color: "#64748B" }}>{ev.supervisorComments}</p>
              )}
              <p className="mt-1.5" style={{ color: "#94A3B8" }}>
                {ev.evaluator?.name ?? "Unknown"} · {fmt(ev.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3">
        {evaluating ? (
          <EvaluationForm
            cohortId={cohortId}
            rotationId={rotation.id}
            nextPeriod={`Month ${rotation.evaluations.length + 1}`}
            onDone={() => { setEvaluating(false); onChange(); }}
            onCancel={() => setEvaluating(false)}
          />
        ) : (
          <button onClick={() => setEvaluating(true)} className="text-sm font-medium" style={{ color: "#0F2744" }}>
            Record this month&apos;s evaluation
          </button>
        )}
      </div>
    </div>
  );
}

function EvaluationForm({
  cohortId,
  rotationId,
  nextPeriod,
  onDone,
  onCancel,
}: {
  cohortId: string;
  rotationId: string;
  nextPeriod: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [period, setPeriod] = useState(nextPeriod);
  const [scores, setScores] = useState<ScoreForm>({
    technicalSkills: 3, communication: 3, professionalism: 3, initiative: 3, teamwork: 3,
  });
  const [strengths, setStrengths] = useState("");
  const [areas, setAreas] = useState("");
  const [comments, setComments] = useState("");
  const [promote, setPromote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/cohorts/${cohortId}/rotations/${rotationId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
          ...scores,
          strengths: strengths.split(",").map((s) => s.trim()).filter(Boolean),
          areasForDevelopment: areas.split(",").map((s) => s.trim()).filter(Boolean),
          supervisorComments: comments,
          recommendPromotion: promote,
        }),
      });
      if (!res.ok) { setError(await parseApiError(res, "Could not save the evaluation.")); return; }
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg p-4" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
      <input className={inputClass} style={inputStyle} value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="Period, e.g. Month 1" required />
      <div className="space-y-2">
        {SCORES.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-600">{label}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setScores((s) => ({ ...s, [key]: n }))}
                  className="w-7 h-7 rounded-lg text-xs font-semibold"
                  style={{
                    background: scores[key] === n ? "#0F2744" : "#F1F5F9",
                    color: scores[key] === n ? "#fff" : "#64748B",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <input className={inputClass} style={inputStyle} placeholder="Strengths, comma separated" value={strengths} onChange={(e) => setStrengths(e.target.value)} />
      <input className={inputClass} style={inputStyle} placeholder="Areas for development, comma separated" value={areas} onChange={(e) => setAreas(e.target.value)} />
      <textarea className={inputClass} style={inputStyle} rows={3} placeholder="Supervisor comments" value={comments} onChange={(e) => setComments(e.target.value)} />
      <label className="flex items-center gap-2 text-xs text-gray-600">
        <input type="checkbox" checked={promote} onChange={(e) => setPromote(e.target.checked)} />
        Recommend for promotion
      </label>
      {error && <p className="text-sm" style={{ color: "#DC2626" }}>{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50" style={{ background: "#0F2744" }}>
          {saving ? "Saving" : "Save evaluation"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: "#e5eaf0", color: "#64748B" }}>Cancel</button>
      </div>
    </form>
  );
}
