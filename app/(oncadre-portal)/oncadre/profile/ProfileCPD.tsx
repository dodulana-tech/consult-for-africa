"use client";

import { useState } from "react";

interface CPDEntry {
  id: string;
  activity: string;
  category: string;
  provider: string | null;
  points: number | string;
  dateCompleted: string;
  certificateUrl: string | null;
  verified: boolean;
}

interface CPDSummary {
  totalPoints: number;
  targetPoints: number;
  daysUntilRenewal: number;
  cycleYear: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  CONFERENCE: "Conference",
  WORKSHOP: "Workshop",
  ONLINE_COURSE: "Online Course",
  PUBLICATION: "Publication",
  TEACHING: "Teaching",
  CLINICAL_AUDIT: "Clinical Audit",
  SELF_STUDY: "Self Study",
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
);

const CATEGORY_COLORS: Record<string, string> = {
  CONFERENCE: "bg-blue-50 text-blue-700 border-blue-200",
  WORKSHOP: "bg-purple-50 text-purple-700 border-purple-200",
  ONLINE_COURSE: "bg-indigo-50 text-indigo-700 border-indigo-200",
  PUBLICATION: "bg-green-50 text-green-700 border-green-200",
  TEACHING: "bg-amber-50 text-amber-700 border-amber-200",
  CLINICAL_AUDIT: "bg-rose-50 text-rose-700 border-rose-200",
  SELF_STUDY: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function ProfileCPD({
  initialEntries,
  initialSummary,
}: {
  initialEntries: CPDEntry[];
  initialSummary: CPDSummary;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [summary, setSummary] = useState(initialSummary);
  const [showForm, setShowForm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    activity: "",
    category: "CONFERENCE",
    provider: "",
    points: "",
    dateCompleted: "",
    certificateUrl: "",
  });

  const progressPct = Math.min(
    100,
    Math.round((summary.totalPoints / summary.targetPoints) * 100)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.activity.trim()) {
      setError("Activity description is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/cadre/cpd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to log CPD activity");
        return;
      }
      const newEntry = await res.json();
      setEntries([newEntry, ...entries]);
      setSummary({
        ...summary,
        totalPoints: summary.totalPoints + parseFloat(form.points),
      });
      setShowForm(false);
      setForm({
        activity: "",
        category: "CONFERENCE",
        provider: "",
        points: "",
        dateCompleted: "",
        certificateUrl: "",
      });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      id="cpd"
      className="scroll-mt-20 rounded-xl border border-gray-100 bg-white shadow-sm"
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between p-6"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">CPD Tracker</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {entries.length}
          </span>
        </div>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${collapsed ? "" : "rotate-180"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {!collapsed && (
        <div className="border-t border-gray-100 px-6 pb-6">
          {/* Summary bar */}
          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {summary.totalPoints} of {summary.targetPoints} points earned
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {summary.cycleYear} cycle - {summary.daysUntilRenewal} days
                  until renewal
                </p>
              </div>
              <div className="text-2xl font-bold text-[#0B3C5D]">
                {progressPct}%
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor:
                    progressPct >= 100
                      ? "#10B981"
                      : progressPct >= 50
                        ? "#3B82F6"
                        : "#F59E0B",
                }}
              />
            </div>
          </div>

          {entries.length === 0 && !showForm && (
            <p className="py-4 text-sm text-gray-400">
              No CPD activities logged yet. Start tracking your continuing
              professional development.
            </p>
          )}

          <div className="mt-4 space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-2 rounded-lg border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {entry.activity}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[entry.category] || "bg-gray-50 text-gray-700 border-gray-200"}`}
                    >
                      {CATEGORY_LABELS[entry.category] || entry.category}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {entry.provider ? `${entry.provider} - ` : ""}
                    {Number(entry.points)} points -{" "}
                    {new Date(entry.dateCompleted).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {entry.verified && (
                    <span className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs font-medium text-green-700">
                      Verified
                    </span>
                  )}
                  {entry.certificateUrl && (
                    <a
                      href={entry.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[#0B3C5D] hover:underline"
                    >
                      Certificate
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {showForm ? (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Activity description
                  </label>
                  <input
                    type="text"
                    value={form.activity}
                    onChange={(e) =>
                      setForm({ ...form, activity: e.target.value })
                    }
                    placeholder="e.g. Annual Medical Conference 2024"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
                  >
                    {CATEGORY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Provider
                  </label>
                  <input
                    type="text"
                    value={form.provider}
                    onChange={(e) =>
                      setForm({ ...form, provider: e.target.value })
                    }
                    placeholder="e.g. NMA, WACS"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Points
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={form.points}
                    onChange={(e) =>
                      setForm({ ...form, points: e.target.value })
                    }
                    placeholder="5"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Date completed
                  </label>
                  <input
                    type="date"
                    value={form.dateCompleted}
                    onChange={(e) =>
                      setForm({ ...form, dateCompleted: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Certificate URL (optional)
                  </label>
                  <input
                    type="url"
                    value={form.certificateUrl}
                    onChange={(e) =>
                      setForm({ ...form, certificateUrl: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#0B3C5D] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0A3350] disabled:opacity-50"
                >
                  {saving ? "Logging..." : "Log CPD activity"}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-[#0B3C5D] transition hover:border-[#0B3C5D] hover:bg-[#0B3C5D]/5"
            >
              + Log CPD activity
            </button>
          )}
        </div>
      )}
    </div>
  );
}
