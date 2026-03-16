"use client";

import { useState, useEffect } from "react";
import {
  Grid3X3, Sparkles, Plus, ChevronDown, ChevronUp,
  Loader2, X, Check, Pencil, Save, Trash2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FrameworkTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  dimensions: string[];
}

interface ProjectFramework {
  id: string;
  frameworkId: string;
  framework: FrameworkTemplate;
  content: Record<string, string>;
  aiGenerated: boolean;
  status: "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
  notes: string | null;
  createdAt: string;
}

const statusColors: Record<string, { bg: string; color: string }> = {
  DRAFT:       { bg: "#F3F4F6", color: "#6B7280" },
  IN_PROGRESS: { bg: "#EFF6FF", color: "#2563EB" },
  COMPLETED:   { bg: "#D1FAE5", color: "#065F46" },
  ARCHIVED:    { bg: "#F3F4F6", color: "#9CA3AF" },
};

const categoryColors: Record<string, { bg: string; color: string }> = {
  "Strategic Analysis": { bg: "#EFF6FF", color: "#1D4ED8" },
  "Operational":        { bg: "#F0FDF4", color: "#059669" },
  "Financial":          { bg: "#FDF4FF", color: "#9333EA" },
  "Stakeholder":        { bg: "#FFF7ED", color: "#D97706" },
  "Clinical":           { bg: "#FEF2F2", color: "#DC2626" },
  "Digital":            { bg: "#F0F9FF", color: "#0284C7" },
};

// ─── Framework Card ───────────────────────────────────────────────────────────

function AppliedFrameworkCard({
  pf,
  projectId,
  canEdit,
  onUpdate,
  onDelete,
}: {
  pf: ProjectFramework;
  projectId: string;
  canEdit: boolean;
  onUpdate: (id: string, data: Partial<ProjectFramework>) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(pf.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filling, setFilling] = useState(false);

  const catStyle = categoryColors[pf.framework.category] ?? { bg: "#F3F4F6", color: "#374151" };
  const stStyle = statusColors[pf.status] ?? statusColors.DRAFT;

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/frameworks/${pf.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft, status: "IN_PROGRESS" }),
      });
      if (res.ok) {
        const { framework } = await res.json();
        onUpdate(pf.id, framework);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function markComplete() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/frameworks/${pf.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (res.ok) {
        const { framework } = await res.json();
        onUpdate(pf.id, framework);
      }
    } finally {
      setSaving(false);
    }
  }

  const isEmpty = pf.framework.dimensions.every((dim) => !pf.content[dim]);

  async function fillWithAI() {
    setFilling(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/frameworks/${pf.id}/generate`, {
        method: "POST",
      });
      if (res.ok) {
        const { framework } = await res.json();
        onUpdate(pf.id, framework);
        setDraft(framework.content);
        setExpanded(true);
      }
    } finally {
      setFilling(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/frameworks/${pf.id}`, { method: "DELETE" });
      if (res.ok) onDelete(pf.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e5eaf0", background: "#fff" }}>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Grid3X3 size={14} className="shrink-0 text-gray-400" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-900">{pf.framework.name}</span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={catStyle}>
                {pf.framework.category}
              </span>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={stStyle}>
                {pf.status === "IN_PROGRESS" ? "In Progress" : pf.status.charAt(0) + pf.status.slice(1).toLowerCase()}
              </span>
              {pf.aiGenerated && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 flex items-center gap-0.5">
                  <Sparkles size={8} /> AI
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {canEdit && pf.status !== "COMPLETED" && isEmpty && !editing && (
            <button
              onClick={fillWithAI}
              disabled={filling}
              className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50"
              style={{ background: "#0F2744", color: "#fff" }}
              title="Fill with Nuru AI"
            >
              {filling ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={9} />}
              {filling ? "Analyzing..." : "Fill with Nuru"}
            </button>
          )}
          {canEdit && pf.status !== "COMPLETED" && !editing && (
            <button
              onClick={() => { setEditing(true); setExpanded(true); setDraft(pf.content); }}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
              title="Edit"
            >
              <Pencil size={12} />
            </button>
          )}
          {canEdit && pf.status !== "COMPLETED" && (
            <button
              onClick={markComplete}
              disabled={saving}
              className="p-1.5 rounded hover:bg-green-50 text-gray-400 hover:text-green-600"
              title="Mark complete"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            </button>
          )}
          {canEdit && (
            <button
              onClick={remove}
              disabled={deleting}
              className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
              title="Remove"
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            </button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #F3F4F6" }}>
          <div className="p-4 space-y-3">
            {pf.framework.dimensions.map((dim) => (
              <div key={dim} className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{dim}</label>
                {editing ? (
                  <textarea
                    value={draft[dim] ?? ""}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [dim]: e.target.value }))}
                    rows={3}
                    placeholder={`${dim} analysis...`}
                    className="w-full text-xs rounded-lg px-3 py-2 resize-none focus:outline-none"
                    style={{ border: "1px solid #e5eaf0", background: "#F9FAFB" }}
                  />
                ) : (
                  <p className="text-xs text-gray-600 leading-relaxed rounded-lg px-3 py-2" style={{ background: "#F9FAFB" }}>
                    {pf.content[dim] || <span className="text-gray-300 italic">Not filled in yet.</span>}
                  </p>
                )}
              </div>
            ))}

            {editing && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                  style={{ background: "#0F2744", color: "#fff" }}
                >
                  {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectFrameworks({
  projectId,
  canEdit,
}: {
  projectId: string;
  canEdit: boolean;
}) {
  const [frameworks, setFrameworks] = useState<ProjectFramework[]>([]);
  const [available, setAvailable] = useState<FrameworkTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [adding, setAdding] = useState<string | null>(null); // frameworkId being added
  const [pickSearch, setPickSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/frameworks`).then((r) => r.json()),
      fetch("/api/frameworks").then((r) => r.json()),
    ]).then(([pf, af]) => {
      setFrameworks(pf.frameworks ?? []);
      setAvailable(af.frameworks ?? []);
    }).finally(() => setLoading(false));
  }, [projectId]);

  const appliedIds = new Set(frameworks.map((f) => f.frameworkId));
  const unapplied = available.filter(
    (f) => !appliedIds.has(f.id) && (!pickSearch || f.name.toLowerCase().includes(pickSearch.toLowerCase()) || f.category.toLowerCase().includes(pickSearch.toLowerCase()))
  );

  async function applyFramework(frameworkId: string, generateWithAI: boolean) {
    setAdding(frameworkId);
    try {
      const res = await fetch(`/api/projects/${projectId}/frameworks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameworkId, generateWithAI }),
      });
      if (res.ok) {
        const { framework } = await res.json();
        setFrameworks((prev) => [framework, ...prev]);
        setShowPicker(false);
        setPickSearch("");
      }
    } finally {
      setAdding(null);
    }
  }

  function handleUpdate(id: string, updated: Partial<ProjectFramework>) {
    setFrameworks((prev) => prev.map((f) => (f.id === id ? { ...f, ...updated } : f)));
  }

  function handleDelete(id: string) {
    setFrameworks((prev) => prev.filter((f) => f.id !== id));
  }

  if (loading) {
    return (
      <div className="rounded-xl p-5 flex items-center gap-3" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
        <Loader2 size={14} className="animate-spin text-gray-300" />
        <span className="text-xs text-gray-400">Loading frameworks...</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Analysis Frameworks</h3>
          {frameworks.length > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {frameworks.length}
            </span>
          )}
        </div>
        {canEdit && (
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: showPicker ? "#F3F4F6" : "#0F2744", color: showPicker ? "#374151" : "#fff" }}
          >
            {showPicker ? <X size={12} /> : <Plus size={12} />}
            {showPicker ? "Cancel" : "Apply Framework"}
          </button>
        )}
      </div>

      {/* Framework picker */}
      {showPicker && (
        <div className="rounded-lg p-4 space-y-3" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
          <input
            value={pickSearch}
            onChange={(e) => setPickSearch(e.target.value)}
            placeholder="Search frameworks..."
            className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
            style={{ border: "1px solid #e5eaf0", background: "#fff" }}
          />
          {unapplied.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">
              {available.length === 0 ? "No frameworks in library." : "All frameworks already applied."}
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {unapplied.map((f) => {
                const isAdding = adding === f.id;
                const catStyle = categoryColors[f.category] ?? { bg: "#F3F4F6", color: "#374151" };
                return (
                  <div
                    key={f.id}
                    className="rounded-lg px-3 py-2.5"
                    style={{ background: "#fff", border: "1px solid #e5eaf0" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="text-xs font-semibold text-gray-900">{f.name}</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={catStyle}>
                            {f.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 line-clamp-1">{f.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => applyFramework(f.id, false)}
                          disabled={isAdding}
                          className="text-[10px] font-medium px-2 py-1 rounded-lg"
                          style={{ border: "1px solid #e5eaf0", color: "#374151", background: "#fff" }}
                        >
                          {isAdding ? <Loader2 size={10} className="animate-spin" /> : "Add"}
                        </button>
                        <button
                          onClick={() => applyFramework(f.id, true)}
                          disabled={!!adding}
                          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50"
                          style={{ background: "#0F2744", color: "#fff" }}
                        >
                          {isAdding ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={9} />}
                          AI Fill
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {adding && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 size={12} className="animate-spin text-[#0F2744]" />
              Generating AI analysis... this may take a moment
            </div>
          )}
        </div>
      )}

      {/* Applied frameworks list */}
      {frameworks.length === 0 ? (
        <div className="text-center py-5">
          <Grid3X3 size={24} className="text-gray-200 mx-auto mb-2" />
          <p className="text-xs text-gray-400">No frameworks applied yet.</p>
          {canEdit && (
            <p className="text-[10px] text-gray-300 mt-1">
              Apply SWOT, PESTLE, Porter's Five Forces and more.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {frameworks.map((pf) => (
            <AppliedFrameworkCard
              key={pf.id}
              pf={pf}
              projectId={projectId}
              canEdit={canEdit}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
