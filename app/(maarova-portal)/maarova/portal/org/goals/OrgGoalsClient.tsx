"use client";

import { useState, useEffect } from "react";

interface OrgGoal {
  id: string;
  dimension: string;
  title: string;
  status: string;
  progress: number;
  source: string;
  managerValidated: boolean;
  createdAt: string;
  user: { id: string; name: string; department: string | null };
}

interface DimensionSummary {
  dimension: string;
  count: number;
  completed: number;
  avgProgress: number;
}

interface AssignForm {
  userId: string;
  title: string;
  description: string;
  dimension: string;
  targetDate: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  NOT_STARTED: { bg: "bg-gray-100", text: "text-gray-700", label: "Not Started" },
  IN_PROGRESS: { bg: "bg-blue-50", text: "text-blue-700", label: "In Progress" },
  COMPLETED: { bg: "bg-green-50", text: "text-green-700", label: "Completed" },
  DEFERRED: { bg: "bg-amber-50", text: "text-amber-700", label: "Deferred" },
};

export default function OrgGoalsClient() {
  const [goals, setGoals] = useState<OrgGoal[]>([]);
  const [dimensions, setDimensions] = useState<DimensionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState<AssignForm>({ userId: "", title: "", description: "", dimension: "", targetDate: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/maarova/org/goals")
      .then((r) => r.json())
      .then((data) => {
        setGoals(data.goals ?? []);
        setDimensions(data.dimensions ?? []);
      })
      .catch(() => setError("Could not load goals"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (showAssign && users.length === 0) {
      fetch("/api/maarova/org/users")
        .then((r) => r.json())
        .then((data) => setUsers((data.users ?? []).map((u: { id: string; name: string }) => ({ id: u.id, name: u.name }))));
    }
  }, [showAssign, users.length]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/maarova/org/goals/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assign goal");
      }
      // Refresh goals
      const refreshRes = await fetch("/api/maarova/org/goals");
      const refreshData = await refreshRes.json();
      setGoals(refreshData.goals ?? []);
      setDimensions(refreshData.dimensions ?? []);
      setForm({ userId: "", title: "", description: "", dimension: "", targetDate: "" });
      setShowAssign(false);
    } catch (err) {
      console.error("Goal assignment failed:", err);
      setError("Unable to assign the goal. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* Dimension summary */}
      {dimensions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dimensions.map((d) => (
            <div key={d.dimension} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold" style={{ color: "#0F2744" }}>{d.dimension}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-lg font-bold" style={{ color: "#0F2744" }}>{d.avgProgress}%</span>
                <span className="text-xs text-gray-400">{d.completed}/{d.count} completed</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${d.avgProgress}%`, background: "#D4A574" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign goal */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAssign(!showAssign)}
          className="text-sm px-4 py-2 rounded-lg text-white font-medium"
          style={{ backgroundColor: "#0F2744" }}
        >
          {showAssign ? "Cancel" : "Assign Goal"}
        </button>
      </div>

      {showAssign && (
        <form onSubmit={handleAssign} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assign to</label>
              <select
                required
                value={form.userId}
                onChange={(e) => setForm((p) => ({ ...p, userId: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "#e5eaf0" }}
              >
                <option value="">Select user...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dimension</label>
              <input
                required
                value={form.dimension}
                onChange={(e) => setForm((p) => ({ ...p, dimension: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "#e5eaf0" }}
                placeholder="e.g. Emotional Intelligence"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: "#e5eaf0" }}
              placeholder="Goal title"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
              style={{ borderColor: "#e5eaf0" }}
              placeholder="Describe the goal and what success looks like"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Target Date (optional)</label>
            <input
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))}
              className="border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: "#e5eaf0" }}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="text-sm px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
            style={{ backgroundColor: "#0F2744" }}
          >
            {saving ? "Assigning..." : "Assign Goal"}
          </button>
        </form>
      )}

      {/* Goals table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500" style={{ background: "#F9FAFB" }}>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Goal</th>
              <th className="px-4 py-3 hidden md:table-cell">Dimension</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 hidden md:table-cell">Source</th>
            </tr>
          </thead>
          <tbody>
            {goals.map((goal) => {
              const st = STATUS_COLORS[goal.status] ?? STATUS_COLORS.NOT_STARTED;
              return (
                <tr key={goal.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium" style={{ color: "#0F2744" }}>{goal.user.name}</p>
                    {goal.user.department && <p className="text-xs text-gray-400">{goal.user.department}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{goal.title}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#0F2744" + "10", color: "#0F2744" }}>
                      {goal.dimension}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${goal.progress}%`, background: goal.progress >= 100 ? "#16a34a" : "#D4A574" }} />
                      </div>
                      <span className="text-xs text-gray-500">{goal.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                    {goal.managerValidated && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 ml-1">
                        Validated
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-gray-400 capitalize">{goal.source}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {goals.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">No development goals yet.</p>
        )}
      </div>
    </div>
  );
}
