"use client";

import { useState } from "react";
import { AlertTriangle, Sparkles, Plus, X, Check, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface RiskItem {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: "RED" | "AMBER" | "GREEN";
  likelihood: number;
  impact: number;
  riskScore: number;
  mitigation: string | null;
  status: "OPEN" | "MITIGATING" | "RESOLVED" | "ACCEPTED";
  resolvedAt: string | null;
  createdAt: string;
}

interface Suggestion {
  _key: string; // internal stable key
  title: string;
  description: string;
  category: string;
  severity: "RED" | "AMBER" | "GREEN";
  likelihood: number;
  impact: number;
  mitigation: string;
}

const severityStyle: Record<string, { bg: string; color: string; dot: string; border: string }> = {
  RED:   { bg: "#FEF2F2", color: "#EF4444", dot: "#EF4444", border: "#FECACA" },
  AMBER: { bg: "#FFFBEB", color: "#D97706", dot: "#F59E0B", border: "#FDE68A" },
  GREEN: { bg: "#ECFDF5", color: "#059669", dot: "#10B981", border: "#A7F3D0" },
};

const statusLabel: Record<string, string> = {
  OPEN: "Open", MITIGATING: "Mitigating", RESOLVED: "Resolved", ACCEPTED: "Accepted",
};

// ─── Suggestion Card ──────────────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onAdd,
  adding,
  added,
}: {
  suggestion: Suggestion;
  onAdd: (s: Suggestion) => void;
  adding: boolean;
  added: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const s = severityStyle[suggestion.severity] ?? severityStyle.AMBER;

  return (
    <div
      className="rounded-lg overflow-hidden transition-shadow hover:shadow-sm"
      style={{
        border: `1px solid ${added ? "#D1FAE5" : s.border}`,
        background: added ? "#F0FDF4" : s.bg,
        opacity: added ? 0.7 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3 px-3 py-2.5">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: added ? "#10B981" : s.dot }} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900 leading-snug">{suggestion.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-gray-400">{suggestion.category}</span>
              <span className="text-[10px] font-medium" style={{ color: added ? "#059669" : s.color }}>
                {suggestion.severity} · {suggestion.likelihood * suggestion.impact} score
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded text-gray-400 hover:text-gray-600"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {added ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg text-emerald-600">
              <Check size={10} /> Added
            </span>
          ) : (
            <button
              onClick={() => onAdd(suggestion)}
              disabled={adding}
              className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50 transition-colors"
              style={{ background: "#0F2744", color: "#fff" }}
            >
              {adding ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
              Add
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="px-3 pb-3 space-y-2" style={{ borderTop: `1px solid ${s.border}` }}>
          <p className="text-xs text-gray-600 pt-2 leading-relaxed">{suggestion.description}</p>
          {suggestion.mitigation && (
            <div className="rounded px-2.5 py-2" style={{ background: "rgba(255,255,255,0.7)" }}>
              <p className="text-[10px] font-semibold text-gray-500 mb-0.5">Suggested mitigation</p>
              <p className="text-xs text-gray-600">{suggestion.mitigation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RiskRegister({
  projectId,
  initialRisks,
  canEdit,
}: {
  projectId: string;
  initialRisks: RiskItem[];
  canEdit: boolean;
}) {
  const [risks, setRisks] = useState<RiskItem[]>(initialRisks);
  const [mode, setMode] = useState<"idle" | "suggesting" | "custom">("idle");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [suggestError, setSuggestError] = useState("");

  // Custom form state
  const [customForm, setCustomForm] = useState({
    title: "", description: "", category: "Operational",
    severity: "AMBER", likelihood: 3, impact: 3, mitigation: "",
  });
  const [savingCustom, setSavingCustom] = useState(false);

  async function loadSuggestions(force = false) {
    // Don't re-fetch if already loaded unless forced
    if (!force && suggestions.length > 0) {
      setMode("suggesting");
      return;
    }
    setLoadingSuggestions(true);
    setSuggestError("");
    setMode("suggesting");
    try {
      const res = await fetch(`/api/projects/${projectId}/risks/suggest`, { method: "POST" });
      if (!res.ok) {
        setSuggestError("Could not load AI suggestions. You can still add a custom risk below.");
        return;
      }
      const { suggestions: data } = await res.json();
      // Assign stable keys
      setSuggestions(data.map((s: Omit<Suggestion, "_key">, i: number) => ({ ...s, _key: `${i}-${s.title}` })));
      setAddedKeys(new Set());
    } catch {
      setSuggestError("Network error loading suggestions.");
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function addSuggestion(s: Suggestion) {
    setAddingKey(s._key);
    try {
      const res = await fetch(`/api/projects/${projectId}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: s.title,
          description: s.description,
          category: s.category,
          severity: s.severity,
          likelihood: s.likelihood,
          impact: s.impact,
          mitigation: s.mitigation,
        }),
      });
      if (res.ok) {
        const { risk } = await res.json();
        setRisks((prev) => [risk, ...prev]);
        // Mark as added but keep in list so user can see what was added
        setAddedKeys((prev) => new Set([...prev, s._key]));
      }
    } finally {
      setAddingKey(null);
    }
  }

  async function saveCustomRisk() {
    if (!customForm.title.trim()) return;
    setSavingCustom(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/risks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customForm),
      });
      if (res.ok) {
        const { risk } = await res.json();
        setRisks((prev) => [risk, ...prev]);
        setCustomForm({ title: "", description: "", category: "Operational", severity: "AMBER", likelihood: 3, impact: 3, mitigation: "" });
        setMode("idle");
      }
    } finally {
      setSavingCustom(false);
    }
  }

  async function updateStatus(riskId: string, status: string) {
    const res = await fetch(`/api/projects/${projectId}/risks/${riskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const { risk } = await res.json();
      setRisks((prev) => prev.map((r) => (r.id === riskId ? risk : r)));
    }
  }

  const open = risks.filter((r) => r.status !== "RESOLVED");
  const resolved = risks.filter((r) => r.status === "RESOLVED");
  const criticalCount = open.filter((r) => r.severity === "RED").length;

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Risk Register</h3>
          {criticalCount > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
              {criticalCount} critical
            </span>
          )}
        </div>
        {canEdit && mode === "idle" && (
          <button
            onClick={() => loadSuggestions(false)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "#0F2744", color: "#fff" }}
          >
            <Sparkles size={12} />
            {suggestions.length > 0 ? "View AI Suggestions" : "Identify Risks with AI"}
          </button>
        )}
        {canEdit && (mode === "suggesting" || mode === "custom") && (
          <button
            onClick={() => { setMode("idle"); setSuggestions([]); setSuggestError(""); }}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg"
            style={{ background: "#F3F4F6", color: "#374151" }}
          >
            <X size={12} />
            Close
          </button>
        )}
      </div>

      {/* AI Suggestions Panel */}
      {mode === "suggesting" && (
        <div className="space-y-3">
          {loadingSuggestions ? (
            <div className="flex items-center gap-3 rounded-lg p-4" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
              <Loader2 size={16} className="animate-spin text-[#0F2744]" />
              <div>
                <p className="text-sm font-medium text-gray-900">Analyzing project context...</p>
                <p className="text-xs text-gray-400">Identifying risks specific to this engagement</p>
              </div>
            </div>
          ) : suggestError ? (
            <div className="rounded-lg p-3 text-xs text-amber-700" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
              {suggestError}
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500">
                  {suggestions.length} risks identified for this project
                </p>
                <button
                  onClick={() => loadSuggestions(true)}
                  className="text-[10px] text-gray-400 hover:text-gray-700 flex items-center gap-1"
                >
                  <Sparkles size={9} />
                  Refresh
                </button>
              </div>
              <div className="space-y-2">
                {suggestions.map((s) => (
                  <SuggestionCard
                    key={s._key}
                    suggestion={s}
                    onAdd={addSuggestion}
                    adding={addingKey === s._key}
                    added={addedKeys.has(s._key)}
                  />
                ))}
              </div>
              {addedKeys.size === suggestions.length && suggestions.length > 0 && (
                <p className="text-xs text-gray-400 text-center py-2">All suggestions added to register.</p>
              )}
            </>
          ) : null}

          {/* Custom risk entry as secondary option */}
          {!loadingSuggestions && mode === "suggesting" && (
            <button
              onClick={() => setMode("custom")}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors"
            >
              + Add a custom risk not in the suggestions
            </button>
          )}
        </div>
      )}

      {/* Custom Risk Form */}
      {(mode === "custom") && (
        <div className="rounded-lg p-4 space-y-3" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
          <p className="text-xs font-medium text-gray-600">Custom Risk</p>
          <input
            value={customForm.title}
            onChange={(e) => setCustomForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Risk title *"
            className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
            style={{ border: "1px solid #e5eaf0", background: "#fff" }}
          />
          <textarea
            value={customForm.description}
            onChange={(e) => setCustomForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Describe the risk"
            rows={2}
            className="w-full text-sm rounded-lg px-3 py-2 resize-none focus:outline-none"
            style={{ border: "1px solid #e5eaf0", background: "#fff" }}
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Severity</label>
              <select
                value={customForm.severity}
                onChange={(e) => setCustomForm((f) => ({ ...f, severity: e.target.value }))}
                className="w-full text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              >
                <option value="GREEN">Green</option>
                <option value="AMBER">Amber</option>
                <option value="RED">Red</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Likelihood (1-5)</label>
              <input
                type="number" min={1} max={5}
                value={customForm.likelihood}
                onChange={(e) => setCustomForm((f) => ({ ...f, likelihood: Number(e.target.value) }))}
                className="w-full text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Impact (1-5)</label>
              <input
                type="number" min={1} max={5}
                value={customForm.impact}
                onChange={(e) => setCustomForm((f) => ({ ...f, impact: Number(e.target.value) }))}
                className="w-full text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              />
            </div>
          </div>
          <select
            value={customForm.category}
            onChange={(e) => setCustomForm((f) => ({ ...f, category: e.target.value }))}
            className="w-full text-xs rounded-lg px-2 py-1.5 focus:outline-none"
            style={{ border: "1px solid #e5eaf0", background: "#fff" }}
          >
            {["Operational", "Timeline", "Budget", "Quality", "Client", "Team", "Regulatory", "Technology"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <textarea
            value={customForm.mitigation}
            onChange={(e) => setCustomForm((f) => ({ ...f, mitigation: e.target.value }))}
            placeholder="Mitigation plan"
            rows={2}
            className="w-full text-sm rounded-lg px-3 py-2 resize-none focus:outline-none"
            style={{ border: "1px solid #e5eaf0", background: "#fff" }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => setMode(suggestions.length > 0 ? "suggesting" : "idle")}
              className="px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-100"
            >
              Back
            </button>
            <button
              onClick={saveCustomRisk}
              disabled={!customForm.title.trim() || savingCustom}
              className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
              style={{ background: "#0F2744", color: "#fff" }}
            >
              {savingCustom ? "Saving..." : "Add Risk"}
            </button>
          </div>
        </div>
      )}

      {/* Registered risks list */}
      {risks.length === 0 ? (
        <div className="text-center py-6">
          <AlertTriangle size={24} className="text-gray-200 mx-auto mb-2" />
          <p className="text-xs text-gray-400">No risks logged yet.</p>
          {canEdit && mode === "idle" && (
            <p className="text-[10px] text-gray-300 mt-1">Use "Identify Risks with AI" to get started.</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {[...open, ...resolved].map((risk) => {
            const s = severityStyle[risk.severity] ?? severityStyle.AMBER;
            return (
              <div
                key={risk.id}
                className="rounded-lg p-3 flex items-start gap-3"
                style={{
                  background: risk.status === "RESOLVED" ? "#F9FAFB" : s.bg,
                  border: `1px solid ${risk.status === "RESOLVED" ? "#e5eaf0" : s.border}`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: risk.status === "RESOLVED" ? "#D1D5DB" : s.dot }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: risk.status === "RESOLVED" ? "#9CA3AF" : "#111827" }}
                      >
                        {risk.title}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-2">{risk.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: "#F3F4F6", color: "#374151" }}
                      >
                        {risk.riskScore}
                      </span>
                      {canEdit && risk.status !== "RESOLVED" && (
                        <select
                          value={risk.status}
                          onChange={(e) => updateStatus(risk.id, e.target.value)}
                          className="text-[10px] rounded px-1.5 py-0.5 focus:outline-none"
                          style={{ border: "1px solid #e5eaf0", background: "#fff" }}
                        >
                          {Object.entries(statusLabel).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      )}
                      {risk.status === "RESOLVED" && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Check size={10} className="text-emerald-500" /> Resolved
                        </span>
                      )}
                    </div>
                  </div>
                  {risk.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{risk.description}</p>
                  )}
                  {risk.mitigation && (
                    <p className="text-[10px] text-gray-400 mt-1 italic line-clamp-1">
                      Mitigation: {risk.mitigation}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
