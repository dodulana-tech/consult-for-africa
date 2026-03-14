"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";

const STATUSES = [
  { value: "PLANNING", label: "Planning", color: "#6B7280" },
  { value: "ACTIVE", label: "Active", color: "#10B981" },
  { value: "ON_HOLD", label: "On Hold", color: "#F59E0B" },
  { value: "AT_RISK", label: "At Risk", color: "#EF4444" },
  { value: "COMPLETED", label: "Completed", color: "#3B82F6" },
  { value: "CANCELLED", label: "Cancelled", color: "#9CA3AF" },
];

const RISK_LEVELS = [
  { value: "LOW", label: "Low Risk", color: "#10B981" },
  { value: "MEDIUM", label: "Medium Risk", color: "#F59E0B" },
  { value: "HIGH", label: "High Risk", color: "#EF4444" },
  { value: "CRITICAL", label: "Critical", color: "#7C3AED" },
];

export default function ProjectStatusEditor({
  projectId,
  currentStatus,
  currentRiskLevel,
  currentHealthScore,
}: {
  projectId: string;
  currentStatus: string;
  currentRiskLevel: string;
  currentHealthScore: number | null;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [riskLevel, setRiskLevel] = useState(currentRiskLevel);
  const [healthScore, setHealthScore] = useState(currentHealthScore ?? 5);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const isDirty = status !== currentStatus || riskLevel !== currentRiskLevel || healthScore !== (currentHealthScore ?? 5);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, riskLevel, healthScore }),
      });
      if (!res.ok) {
        setError("Failed to update. Please try again.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const statusConfig = STATUSES.find((s) => s.value === status);
  const riskConfig = RISK_LEVELS.find((r) => r.value === riskLevel);

  return (
    <div className="rounded-xl bg-white p-5" style={{ border: "1px solid #e5eaf0" }}>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Project Status</h3>
      <div className="space-y-4">
        {/* Status */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Status</label>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setSaved(false); }}
              className="w-full appearance-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744] pr-8 font-medium"
              style={{ borderColor: "#e5eaf0", color: statusConfig?.color ?? "#374151" }}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Risk level */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Risk Level</label>
          <div className="relative">
            <select
              value={riskLevel}
              onChange={(e) => { setRiskLevel(e.target.value); setSaved(false); }}
              className="w-full appearance-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0F2744] pr-8 font-medium"
              style={{ borderColor: "#e5eaf0", color: riskConfig?.color ?? "#374151" }}
            >
              {RISK_LEVELS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Health score */}
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">
            Health Score: <span className="font-bold" style={{ color: healthScore >= 7 ? "#10B981" : healthScore >= 5 ? "#F59E0B" : "#EF4444" }}>{healthScore}/10</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={healthScore}
            onChange={(e) => { setHealthScore(parseInt(e.target.value)); setSaved(false); }}
            className="w-full accent-[#0F2744]"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>Critical</span>
            <span>Healthy</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg text-xs text-red-600" style={{ background: "#FEF2F2" }}>
            <AlertCircle size={11} />
            {error}
          </div>
        )}

        <button
          onClick={save}
          disabled={saving || !isDirty}
          className="w-full py-2 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity"
          style={{ background: saved ? "#10B981" : "#0F2744", color: "#fff" }}
        >
          {saved ? (
            <><CheckCircle2 size={13} /> Saved</>
          ) : saving ? (
            "Saving..."
          ) : (
            "Update Status"
          )}
        </button>
      </div>
    </div>
  );
}
