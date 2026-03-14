"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Plus, X, Quote } from "lucide-react";

interface ImpactMetric {
  id: string;
  metricName: string;
  baselineValue: string | null;
  currentValue: string | null;
  unit: string | null;
  quantifiedValue: number | null;
  currency: string | null;
  clientQuote: string | null;
  createdAt: string;
}

const defaultForm = {
  metricName: "",
  baselineValue: "",
  currentValue: "",
  unit: "",
  quantifiedValue: "",
  clientQuote: "",
};

export default function ImpactMetrics({
  projectId,
  canEdit,
}: {
  projectId: string;
  canEdit: boolean;
}) {
  const [metrics, setMetrics] = useState<ImpactMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/impact`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMetrics(data);
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  async function createMetric() {
    if (!form.metricName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/impact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metricName: form.metricName,
          baselineValue: form.baselineValue || null,
          currentValue: form.currentValue || null,
          unit: form.unit || null,
          quantifiedValue: form.quantifiedValue ? Number(form.quantifiedValue) : null,
          clientQuote: form.clientQuote || null,
        }),
      });
      if (res.ok) {
        const metric = await res.json();
        setMetrics((prev) => [metric, ...prev]);
        setForm(defaultForm);
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: "#fff", border: "1px solid #e5eaf0" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} style={{ color: "#0F2744" }} />
          <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
            Impact Metrics
          </h3>
          {metrics.length > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: "#EFF6FF", color: "#3B82F6" }}
            >
              {metrics.length}
            </span>
          )}
        </div>
        {canEdit && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
            style={{
              background: showForm ? "#F3F4F6" : "#0F2744",
              color: showForm ? "#374151" : "#fff",
            }}
          >
            {showForm ? <X size={12} /> : <Plus size={12} />}
            {showForm ? "Cancel" : "Add Metric"}
          </button>
        )}
      </div>

      {showForm && (
        <div
          className="rounded-lg p-4 space-y-3"
          style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}
        >
          <input
            value={form.metricName}
            onChange={(e) => setForm((f) => ({ ...f, metricName: e.target.value }))}
            placeholder="Metric name (e.g. Bed Occupancy Rate) *"
            className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
            style={{ border: "1px solid #e5eaf0", background: "#fff" }}
          />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Baseline</label>
              <input
                value={form.baselineValue}
                onChange={(e) => setForm((f) => ({ ...f, baselineValue: e.target.value }))}
                placeholder="e.g. 45%"
                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Current</label>
              <input
                value={form.currentValue}
                onChange={(e) => setForm((f) => ({ ...f, currentValue: e.target.value }))}
                placeholder="e.g. 78%"
                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 mb-1 block">Unit</label>
              <input
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                placeholder="e.g. %"
                className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">
              Quantified Value (optional, e.g. monetary value)
            </label>
            <input
              type="number"
              value={form.quantifiedValue}
              onChange={(e) => setForm((f) => ({ ...f, quantifiedValue: e.target.value }))}
              placeholder="e.g. 5000000"
              className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none"
              style={{ border: "1px solid #e5eaf0", background: "#fff" }}
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">
              Client Quote (optional)
            </label>
            <textarea
              value={form.clientQuote}
              onChange={(e) => setForm((f) => ({ ...f, clientQuote: e.target.value }))}
              placeholder="Client testimonial or quote about this outcome"
              rows={2}
              className="w-full text-sm rounded-lg px-3 py-2 resize-none focus:outline-none"
              style={{ border: "1px solid #e5eaf0", background: "#fff" }}
            />
          </div>
          <button
            onClick={createMetric}
            disabled={!form.metricName.trim() || saving}
            className="px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
            style={{ background: "#0F2744", color: "#fff" }}
          >
            {saving ? "Saving..." : "Save Metric"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-6">
          <p className="text-xs text-gray-400">Loading...</p>
        </div>
      ) : metrics.length === 0 ? (
        <div className="text-center py-6">
          <TrendingUp size={24} className="text-gray-200 mx-auto mb-2" />
          <p className="text-xs text-gray-400">No impact metrics recorded yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div
              key={m.id}
              className="rounded-lg p-4"
              style={{ background: "#F8FAFC", border: "1px solid #e5eaf0" }}
            >
              <p
                className="text-xs font-semibold mb-2"
                style={{ color: "#64748B" }}
              >
                {m.metricName}
              </p>
              {(m.baselineValue || m.currentValue) && (
                <div className="flex items-center gap-2 mb-2">
                  {m.baselineValue && (
                    <span
                      className="text-sm font-bold"
                      style={{ color: "#94A3B8" }}
                    >
                      {m.baselineValue}
                      {m.unit ? ` ${m.unit}` : ""}
                    </span>
                  )}
                  {m.baselineValue && m.currentValue && (
                    <span style={{ color: "#CBD5E1" }}>&#8594;</span>
                  )}
                  {m.currentValue && (
                    <span
                      className="text-xl font-bold"
                      style={{ color: "#0F2744" }}
                    >
                      {m.currentValue}
                      {m.unit ? ` ${m.unit}` : ""}
                    </span>
                  )}
                </div>
              )}
              {m.quantifiedValue != null && (
                <p className="text-xs text-emerald-600 font-semibold mb-1">
                  {m.currency
                    ? `${m.currency} ${m.quantifiedValue.toLocaleString()}`
                    : m.quantifiedValue.toLocaleString()}
                </p>
              )}
              {m.clientQuote && (
                <div
                  className="mt-2 rounded px-3 py-2 flex gap-1.5"
                  style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
                >
                  <Quote size={11} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 italic leading-relaxed line-clamp-3">
                    {m.clientQuote}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
