"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock, Plus, X, SkipForward, Loader2, Sparkles } from "lucide-react";

interface PhaseGate {
  id: string;
  name: string;
  passed: boolean;
  passedAt: string | null;
  notes: string | null;
}

interface ProjectPhase {
  id: string;
  name: string;
  description: string | null;
  order: number;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "SKIPPED";
  percentComplete: number;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  createdAt: string;
  gates: PhaseGate[];
}

const phaseColors: Record<string, { bg: string; color: string; border: string }> = {
  PENDING:   { bg: "#F9FAFB", color: "#9CA3AF", border: "#E5E7EB" },
  ACTIVE:    { bg: "#EFF6FF", color: "#3B82F6", border: "#BFDBFE" },
  COMPLETED: { bg: "#ECFDF5", color: "#10B981", border: "#A7F3D0" },
  SKIPPED:   { bg: "#F3F4F6", color: "#9CA3AF", border: "#E5E7EB" },
};

const STATUS_CYCLE: ProjectPhase["status"][] = ["PENDING", "ACTIVE", "COMPLETED"];
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Not started",
  ACTIVE: "In progress",
  COMPLETED: "Complete",
  SKIPPED: "Skipped",
};

export default function PhaseTracker({
  projectId,
  initialPhases,
  canEdit,
}: {
  projectId: string;
  initialPhases: ProjectPhase[];
  canEdit: boolean;
}) {
  const [phases, setPhases] = useState<ProjectPhase[]>(initialPhases);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", startDate: "", endDate: "" });
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<{ name: string; description: string; startDate: string; endDate: string }[]>([]);
  const [addingSuggestion, setAddingSuggestion] = useState<number | null>(null);
  const [addedIndices, setAddedIndices] = useState<Set<number>>(new Set());

  async function createPhase() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/phases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const { phase } = await res.json();
        setPhases((prev) => [...prev, phase]);
        setForm({ name: "", description: "", startDate: "", endDate: "" });
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function patchPhase(phaseId: string, data: Record<string, unknown>) {
    setUpdatingId(phaseId);
    try {
      const res = await fetch(`/api/projects/${projectId}/phases/${phaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const { phase } = await res.json();
        setPhases((prev) => prev.map((p) => (p.id === phaseId ? phase : p)));
      }
    } finally {
      setUpdatingId(null);
    }
  }

  function cycleStatus(phase: ProjectPhase) {
    const idx = STATUS_CYCLE.indexOf(phase.status);
    if (idx === -1) return; // SKIPPED - don't cycle
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    patchPhase(phase.id, {
      status: next,
      percentComplete: next === "COMPLETED" ? 100 : next === "PENDING" ? 0 : phase.percentComplete,
    });
  }

  async function suggestPhases() {
    setSuggesting(true);
    setSuggestions([]);
    setAddedIndices(new Set());
    try {
      const res = await fetch(`/api/projects/${projectId}/phases/suggest`, { method: "POST" });
      if (res.ok) {
        const { suggestions: data } = await res.json();
        setSuggestions(data);
      }
    } finally {
      setSuggesting(false);
    }
  }

  async function addSuggestedPhase(s: { name: string; description: string; startDate: string; endDate: string }, idx: number) {
    setAddingSuggestion(idx);
    try {
      const res = await fetch(`/api/projects/${projectId}/phases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (res.ok) {
        const { phase } = await res.json();
        setPhases((prev) => [...prev, phase]);
        setAddedIndices((prev) => new Set([...prev, idx]));
      }
    } finally {
      setAddingSuggestion(null);
    }
  }

  async function addAllSuggested() {
    for (let i = 0; i < suggestions.length; i++) {
      if (!addedIndices.has(i)) {
        await addSuggestedPhase(suggestions[i], i);
      }
    }
  }

  if (phases.length === 0 && !canEdit) return null;

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Phases</h3>
          {phases.length > 0 && (
            <p className="text-[10px] text-gray-400 mt-0.5">
              {phases.filter((p) => p.status === "COMPLETED").length} of {phases.length} complete
            </p>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {phases.length === 0 && !showForm && (
              <button
                onClick={suggestPhases}
                disabled={suggesting}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg disabled:opacity-50"
                style={{ background: "#0F2744", color: "#fff" }}
              >
                {suggesting ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                {suggesting ? "Analyzing..." : "Suggest with Nuru"}
              </button>
            )}
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg"
              style={{ background: showForm ? "#F3F4F6" : phases.length === 0 && !showForm ? "#fff" : "#0F2744", color: showForm ? "#374151" : phases.length === 0 && !showForm ? "#374151" : "#fff", border: phases.length === 0 && !showForm ? "1px solid #e5eaf0" : "none" }}
            >
              {showForm ? <X size={12} /> : <Plus size={12} />}
              {showForm ? "Cancel" : "Add Phase"}
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg p-4 space-y-2" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Phase name (e.g. Discovery & Diagnosis) *"
            className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
            style={{ border: "1px solid #e5eaf0", background: "#fff" }}
          />
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description"
            className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
            style={{ border: "1px solid #e5eaf0", background: "#fff" }}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Start date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">End date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              />
            </div>
          </div>
          <button
            onClick={createPhase}
            disabled={!form.name.trim() || saving}
            className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
            style={{ background: "#0F2744", color: "#fff" }}
          >
            {saving ? "Saving..." : "Add Phase"}
          </button>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-400">{suggestions.length} phases suggested by Nuru</p>
            <button
              onClick={addAllSuggested}
              disabled={addedIndices.size === suggestions.length}
              className="text-[10px] font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50"
              style={{ background: "#0F2744", color: "#fff" }}
            >
              Add All
            </button>
          </div>
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-start justify-between gap-2 rounded-lg px-3 py-2" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900">{s.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.description}</p>
                <p className="text-[10px] text-gray-300 mt-0.5">{s.startDate} to {s.endDate}</p>
              </div>
              {addedIndices.has(i) ? (
                <span className="text-[10px] font-semibold text-emerald-600 shrink-0 flex items-center gap-0.5"><CheckCircle2 size={10} /> Added</span>
              ) : (
                <button
                  onClick={() => addSuggestedPhase(s, i)}
                  disabled={addingSuggestion === i}
                  className="text-[10px] font-semibold px-2 py-1 rounded-lg shrink-0 disabled:opacity-50"
                  style={{ background: "#0F2744", color: "#fff" }}
                >
                  {addingSuggestion === i ? <Loader2 size={10} className="animate-spin" /> : "Add"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {phases.length === 0 && suggestions.length === 0 ? (
        <p className="text-xs text-gray-400">No phases defined. Use "Suggest with Nuru" or add manually.</p>
      ) : (
        <div className="space-y-3">
          {phases.map((phase, i) => {
            const s = phaseColors[phase.status] ?? phaseColors.PENDING;
            const isActive = phase.status === "ACTIVE";
            const isDone = phase.status === "COMPLETED";
            const isUpdating = updatingId === phase.id;

            return (
              <div key={phase.id}>
                <div className="rounded-lg p-3" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <div className="flex items-start gap-3">
                    {/* Status icon, click to cycle */}
                    <button
                      onClick={() => canEdit && !isUpdating && cycleStatus(phase)}
                      disabled={!canEdit || isUpdating || phase.status === "SKIPPED"}
                      className="shrink-0 mt-0.5 disabled:cursor-default"
                      title={canEdit ? `Click to advance status` : undefined}
                    >
                      {isUpdating ? (
                        <Loader2 size={16} className="animate-spin" style={{ color: s.color }} />
                      ) : isDone ? (
                        <CheckCircle2 size={16} style={{ color: s.color }} />
                      ) : isActive ? (
                        <Clock size={16} style={{ color: s.color }} />
                      ) : phase.status === "SKIPPED" ? (
                        <SkipForward size={16} style={{ color: s.color }} />
                      ) : (
                        <Circle size={16} style={{ color: s.color }} />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-900">{phase.name}</span>
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: "rgba(255,255,255,0.7)", color: s.color, border: `1px solid ${s.border}` }}
                        >
                          {isActive ? `${phase.percentComplete}%` : STATUS_LABELS[phase.status]}
                        </span>
                      </div>

                      {phase.description && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{phase.description}</p>
                      )}

                      {(phase.startDate || phase.endDate) && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          {phase.startDate
                            ? new Date(phase.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                            : ""}
                          {phase.startDate && phase.endDate ? " – " : ""}
                          {phase.endDate
                            ? new Date(phase.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                            : ""}
                        </p>
                      )}

                      {/* Progress bar + slider for active phases */}
                      {isActive && (
                        <div className="mt-2 space-y-1">
                          <div className="h-1.5 bg-white rounded-full overflow-hidden" style={{ border: "1px solid #BFDBFE" }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${phase.percentComplete}%`, background: s.color }}
                            />
                          </div>
                          {canEdit && (
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={5}
                              value={phase.percentComplete}
                              onChange={(e) =>
                                setPhases((prev) =>
                                  prev.map((p) =>
                                    p.id === phase.id ? { ...p, percentComplete: Number(e.target.value) } : p
                                  )
                                )
                              }
                              onMouseUp={(e) => patchPhase(phase.id, { percentComplete: Number((e.target as HTMLInputElement).value) })}
                              onTouchEnd={(e) => patchPhase(phase.id, { percentComplete: Number((e.target as HTMLInputElement).value) })}
                              className="w-full h-1 accent-blue-500 cursor-pointer"
                            />
                          )}
                        </div>
                      )}

                      {/* Gates */}
                      <div className="mt-2 flex gap-2 flex-wrap items-center">
                        {phase.gates.map((gate) => (
                          <button
                            key={gate.id}
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/projects/${projectId}/phases/${phase.id}/gates/${gate.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ passed: !gate.passed }),
                                });
                                if (res.ok) {
                                  setPhases((prev) => prev.map((p) => p.id === phase.id
                                    ? { ...p, gates: p.gates.map((g) => g.id === gate.id ? { ...g, passed: !gate.passed, passedAt: !gate.passed ? new Date().toISOString() : null } : g) }
                                    : p
                                  ));
                                }
                              } catch {}
                            }}
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer hover:opacity-80"
                            style={{
                              background: gate.passed ? "#ECFDF5" : "#FFF7ED",
                              color: gate.passed ? "#059669" : "#EA580C",
                            }}
                            title={gate.passed ? "Click to unmark" : "Click to mark as passed"}
                          >
                            {gate.name} {gate.passed ? "✓" : "pending"}
                          </button>
                        ))}
                        <button
                          onClick={async () => {
                            const name = prompt("Gate name (e.g. Client sign-off, QA review):");
                            if (!name?.trim()) return;
                            try {
                              const res = await fetch(`/api/projects/${projectId}/phases/${phase.id}/gates`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ name: name.trim() }),
                              });
                              if (res.ok) {
                                const { gate } = await res.json();
                                setPhases((prev) => prev.map((p) => p.id === phase.id
                                  ? { ...p, gates: [...p.gates, gate] }
                                  : p
                                ));
                              }
                            } catch {}
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-colors"
                        >
                          + gate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {i < phases.length - 1 && (
                  <div className="ml-5 w-0.5 h-3 bg-gray-200" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
