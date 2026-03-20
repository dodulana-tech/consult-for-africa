"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Goal {
  id: string;
  dimension: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  source: string;
  sourceNote: string | null;
  coachNotes: string | null;
  managerValidated: boolean;
  managerValidatedAt: string | null;
  targetDate: string | null;
  createdAt: string;
  ratings: { id: string; raterType: string; score: number; note: string | null; createdAt: string }[];
}

interface UserInfo {
  id: string;
  name: string;
  title: string | null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  NOT_STARTED: { bg: "bg-gray-100", text: "text-gray-700", label: "Not Started" },
  IN_PROGRESS: { bg: "bg-blue-50", text: "text-blue-700", label: "In Progress" },
  COMPLETED: { bg: "bg-green-50", text: "text-green-700", label: "Completed" },
  DEFERRED: { bg: "bg-amber-50", text: "text-amber-700", label: "Deferred" },
};

export default function ReportGoalsClient({ userId }: { userId: string }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [validating, setValidating] = useState<string | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ title: "", description: "", dimension: "", targetDate: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadGoals() {
    const res = await fetch(`/api/maarova/manager/reports/${userId}/goals`);
    const data = await res.json();
    setUser(data.user ?? null);
    setGoals(data.goals ?? []);
  }

  useEffect(() => {
    loadGoals().finally(() => setLoading(false));
  }, [userId]);

  async function handleValidate(goalId: string) {
    setValidating(goalId);
    try {
      const res = await fetch(`/api/maarova/manager/goals/${goalId}/validate`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to validate");
      await loadGoals();
    } catch {
      setError("Failed to validate goal");
    } finally {
      setValidating(null);
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/maarova/manager/reports/${userId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      await loadGoals();
      setAssignForm({ title: "", description: "", dimension: "", targetDate: "" });
      setShowAssign(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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

  if (!user) {
    return <p className="text-gray-500 text-center py-16">User not found or not your direct report.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <Link href="/maarova/portal/team" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to team
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            {user.title && <p className="text-gray-500 text-sm">{user.title}</p>}
          </div>
          <button
            onClick={() => setShowAssign(!showAssign)}
            className="text-sm px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: "#0F2744" }}
          >
            {showAssign ? "Cancel" : "Assign Goal"}
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      {/* Assign form */}
      {showAssign && (
        <form onSubmit={handleAssign} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
              <input
                required
                value={assignForm.title}
                onChange={(e) => setAssignForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "#e5eaf0" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dimension</label>
              <input
                required
                value={assignForm.dimension}
                onChange={(e) => setAssignForm((p) => ({ ...p, dimension: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "#e5eaf0" }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              required
              value={assignForm.description}
              onChange={(e) => setAssignForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
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

      {/* Goals list */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-500">No development goals yet for {user.name}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const st = STATUS_COLORS[goal.status] ?? STATUS_COLORS.NOT_STARTED;
            const isExpanded = expandedGoal === goal.id;

            return (
              <div key={goal.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm" style={{ color: "#0F2744" }}>{goal.title}</h3>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#0F2744" + "10", color: "#0F2744" }}>
                        {goal.dimension}
                      </span>
                      {goal.managerValidated && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                          Validated
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${goal.progress}%`, background: goal.progress >= 100 ? "#16a34a" : "#D4A574" }} />
                      </div>
                      <span className="text-xs font-medium text-gray-500 w-10 text-right">{goal.progress}%</span>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t space-y-4" style={{ borderColor: "#e5eaf0" }}>
                    <p className="text-sm text-gray-600 pt-4 leading-relaxed">{goal.description}</p>

                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Source: <span className="capitalize font-medium">{goal.source}</span>{goal.sourceNote ? ` (${goal.sourceNote})` : ""}</span>
                      {goal.targetDate && <span>Target: {new Date(goal.targetDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>}
                    </div>

                    {goal.coachNotes && (
                      <div className="rounded-lg p-3 border" style={{ backgroundColor: "#D4A574" + "08", borderColor: "#D4A574" + "25" }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: "#D4A574" }}>Coach Notes</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{goal.coachNotes}</p>
                      </div>
                    )}

                    {/* Ratings from different stakeholders */}
                    {goal.ratings.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Progress Ratings</p>
                        <div className="space-y-2">
                          {goal.ratings.map((r) => (
                            <div key={r.id} className="flex items-center gap-3 text-xs">
                              <span className={`font-medium capitalize w-16 ${
                                r.raterType === "self" ? "text-blue-600" : r.raterType === "coach" ? "text-amber-600" : "text-purple-600"
                              }`}>{r.raterType}</span>
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-gray-400" style={{ width: `${r.score}%` }} />
                              </div>
                              <span className="text-gray-500 w-8 text-right">{r.score}%</span>
                              {r.note && <span className="text-gray-400 truncate max-w-[200px]">{r.note}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Validate button */}
                    <div className="pt-2">
                      <button
                        onClick={() => handleValidate(goal.id)}
                        disabled={validating === goal.id}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                          goal.managerValidated
                            ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {validating === goal.id
                          ? "Updating..."
                          : goal.managerValidated
                            ? "Remove Validation"
                            : "Validate Completion"
                        }
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
