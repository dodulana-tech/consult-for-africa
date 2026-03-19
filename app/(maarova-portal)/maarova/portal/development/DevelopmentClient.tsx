"use client";

import { useState } from "react";

interface Coach {
  id: string;
  name: string;
  title: string;
  bio: string;
  certifications: string[];
  specialisms: string[];
  avatarUrl: string | null;
  country: string;
  city: string | null;
  yearsExperience: number;
}

interface CoachingSession {
  id: string;
  scheduledAt: string;
  completedAt: string | null;
  duration: number | null;
  notes: string | null;
  focusAreas: string[];
  status: string;
}

interface CoachingMatch {
  id: string;
  status: string;
  matchScore: number | null;
  matchRationale: string | null;
  programme: string;
  startDate: string | null;
  endDate: string | null;
  sessionsCompleted: number;
  sessionsScheduled: number;
  lastSessionAt: string | null;
  nextSessionAt: string | null;
  notes: string | null;
  coach: Coach;
  sessions: CoachingSession[];
}

interface Milestone {
  title: string;
  completed: boolean;
  completedAt?: string;
}

interface DevelopmentGoal {
  id: string;
  dimension: string;
  title: string;
  description: string;
  targetDate: string | null;
  status: string;
  progress: number;
  milestones: Milestone[] | null;
  aiGenerated: boolean;
  source: string;
  sourceNote: string | null;
  coachNotes: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface Props {
  coachingMatch: CoachingMatch | null;
  goals: DevelopmentGoal[];
  hasReport: boolean;
  userName: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  NOT_STARTED: { bg: "bg-gray-100", text: "text-gray-700", label: "Not Started" },
  IN_PROGRESS: { bg: "bg-blue-50", text: "text-blue-700", label: "In Progress" },
  COMPLETED: { bg: "bg-green-50", text: "text-green-700", label: "Completed" },
  DEFERRED: { bg: "bg-amber-50", text: "text-amber-700", label: "Deferred" },
};

const COACHING_STATUS: Record<string, { label: string; color: string }> = {
  PENDING_MATCH: { label: "Matching in progress", color: "text-amber-600" },
  MATCHED: { label: "Matched", color: "text-blue-600" },
  ACTIVE: { label: "Active", color: "text-green-600" },
  PAUSED: { label: "Paused", color: "text-gray-500" },
  COMPLETED: { label: "Programme complete", color: "text-green-700" },
};

function formatDate(d: string | null) {
  if (!d) return "TBD";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DevelopmentClient({
  coachingMatch,
  goals,
  hasReport,
  userName,
}: Props) {
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [suggestingGoals, setSuggestingGoals] = useState(false);
  const [suggestedGoals, setSuggestedGoals] = useState<
    { title: string; description: string; dimension: string }[]
  >([]);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    dimension: "",
    targetDate: "",
  });
  const [saving, setSaving] = useState(false);
  const [localGoals, setLocalGoals] = useState<DevelopmentGoal[]>(goals);

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/maarova/development/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGoal),
      });
      if (!res.ok) throw new Error("Failed to create goal");
      const goal = await res.json();
      setLocalGoals((prev) => [goal, ...prev]);
      setNewGoal({ title: "", description: "", dimension: "", targetDate: "" });
      setShowNewGoal(false);
    } catch {
      alert("Failed to create goal. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSuggestGoals() {
    setSuggestingGoals(true);
    setSuggestedGoals([]);
    try {
      const res = await fetch("/api/maarova/development/goals/suggest", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to suggest goals");
      const data = await res.json();
      setSuggestedGoals(data.suggestions ?? []);
    } catch {
      alert("Could not generate suggestions. Ensure you have a completed report.");
    } finally {
      setSuggestingGoals(false);
    }
  }

  async function handleAcceptSuggestion(suggestion: {
    title: string;
    description: string;
    dimension: string;
  }) {
    try {
      const res = await fetch("/api/maarova/development/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...suggestion, aiGenerated: true, source: "assessment" }),
      });
      if (!res.ok) throw new Error("Failed");
      const goal = await res.json();
      setLocalGoals((prev) => [goal, ...prev]);
      setSuggestedGoals((prev) => prev.filter((s) => s.title !== suggestion.title));
    } catch {
      alert("Failed to add goal.");
    }
  }

  async function handleUpdateGoal(goalId: string, updates: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/maarova/development/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setLocalGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
    } catch {
      alert("Failed to update goal.");
    }
  }

  const isPending = coachingMatch?.status === "PENDING_MATCH";
  const isActiveCoaching =
    coachingMatch &&
    ["MATCHED", "ACTIVE"].includes(coachingMatch.status);

  const pastSessions =
    coachingMatch?.sessions.filter((s) => s.status === "COMPLETED") ?? [];
  const upcomingSessions =
    coachingMatch?.sessions.filter((s) => s.status === "SCHEDULED") ?? [];

  return (
    <div className="space-y-6">

      {/* Development Goals Section */}
      <section className="bg-white rounded-xl border shadow-sm" style={{ borderColor: "#e5eaf0" }}>
        <div
          className="px-6 py-5 border-b flex items-center justify-between flex-wrap gap-3"
          style={{ borderColor: "#e5eaf0" }}
        >
          <h2 className="text-lg font-semibold" style={{ color: "#0F2744" }}>
            Development Goals
          </h2>
          <div className="flex items-center gap-2">
            {hasReport && (
              <button
                onClick={handleSuggestGoals}
                disabled={suggestingGoals}
                className="text-sm px-4 py-2 rounded-lg border font-medium transition-colors disabled:opacity-50"
                style={{ borderColor: "#D4A574", color: "#D4A574" }}
              >
                {suggestingGoals ? "Generating..." : "Suggest Goals"}
              </button>
            )}
            <button
              onClick={() => setShowNewGoal(!showNewGoal)}
              className="text-sm px-4 py-2 rounded-lg text-white font-medium transition-colors"
              style={{ backgroundColor: "#0F2744" }}
            >
              Add Goal
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Suggested goals */}
          {suggestedGoals.length > 0 && (
            <div
              className="rounded-lg p-4 mb-4 border space-y-3"
              style={{ backgroundColor: "#D4A574" + "08", borderColor: "#D4A574" + "30" }}
            >
              <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                Suggested Goals
              </p>
              {suggestedGoals.map((sg, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg p-4 border flex items-start justify-between gap-4"
                  style={{ borderColor: "#e5eaf0" }}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm" style={{ color: "#0F2744" }}>
                      {sg.title}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">{sg.description}</p>
                    <span
                      className="inline-block text-xs mt-2 px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "#0F2744" + "10",
                        color: "#0F2744",
                      }}
                    >
                      {sg.dimension}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAcceptSuggestion(sg)}
                    className="text-xs px-3 py-1.5 rounded-lg text-white font-medium shrink-0"
                    style={{ backgroundColor: "#D4A574" }}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* New goal form */}
          {showNewGoal && (
            <form
              onSubmit={handleCreateGoal}
              className="rounded-lg border p-5 space-y-4 mb-4"
              style={{ borderColor: "#e5eaf0" }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Title
                  </label>
                  <input
                    required
                    value={newGoal.title}
                    onChange={(e) =>
                      setNewGoal((p) => ({ ...p, title: e.target.value }))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    style={{ borderColor: "#e5eaf0" }}
                    placeholder="e.g. Improve active listening"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Dimension
                  </label>
                  <input
                    required
                    value={newGoal.dimension}
                    onChange={(e) =>
                      setNewGoal((p) => ({ ...p, dimension: e.target.value }))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    style={{ borderColor: "#e5eaf0" }}
                    placeholder="e.g. Emotional Intelligence"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  required
                  value={newGoal.description}
                  onChange={(e) =>
                    setNewGoal((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                  style={{ borderColor: "#e5eaf0" }}
                  placeholder="Describe the goal and what success looks like"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Target Date (optional)
                </label>
                <input
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) =>
                    setNewGoal((p) => ({ ...p, targetDate: e.target.value }))
                  }
                  className="border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: "#e5eaf0" }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="text-sm px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                  style={{ backgroundColor: "#0F2744" }}
                >
                  {saving ? "Saving..." : "Create Goal"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewGoal(false)}
                  className="text-sm px-4 py-2 rounded-lg border font-medium text-gray-600"
                  style={{ borderColor: "#e5eaf0" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Goals list */}
          {localGoals.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">
                No development goals yet. Add your first goal or get suggestions
                based on your assessment results.
              </p>
            </div>
          ) : (
            localGoals.map((goal) => {
              const st = STATUS_COLORS[goal.status] ?? STATUS_COLORS.NOT_STARTED;
              const isExpanded = expandedGoal === goal.id;
              const milestones = (goal.milestones ?? []) as Milestone[];

              return (
                <div
                  key={goal.id}
                  className="border rounded-lg overflow-hidden"
                  style={{ borderColor: "#e5eaf0" }}
                >
                  <button
                    onClick={() =>
                      setExpandedGoal(isExpanded ? null : goal.id)
                    }
                    className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className="font-medium text-sm"
                          style={{ color: "#0F2744" }}
                        >
                          {goal.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text}`}
                        >
                          {st.label}
                        </span>
                        {(goal.source || (goal.aiGenerated ? "assessment" : "self")) !== "self" && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            {
                              assessment: "bg-blue-50 text-blue-700",
                              coach: "bg-purple-50 text-purple-700",
                              manager: "bg-amber-50 text-amber-700",
                            }[(goal.source as string) || "assessment"] ?? "bg-gray-50 text-gray-600"
                          }`}>
                            {{ assessment: "Assessment suggested", coach: "Coach recommended", manager: "Manager assigned" }[(goal.source as string) || "assessment"] ?? goal.source}
                          </span>
                        )}
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: "#0F2744" + "10",
                            color: "#0F2744",
                          }}
                        >
                          {goal.dimension}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${goal.progress}%`,
                              backgroundColor:
                                goal.progress >= 100 ? "#16a34a" : "#D4A574",
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-500 w-10 text-right">
                          {goal.progress}%
                        </span>
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div
                      className="px-5 pb-5 border-t space-y-4"
                      style={{ borderColor: "#e5eaf0" }}
                    >
                      <p className="text-sm text-gray-600 pt-4 leading-relaxed">
                        {goal.description}
                      </p>
                      {goal.targetDate && (
                        <p className="text-xs text-gray-500">
                          Target: {formatDate(goal.targetDate)}
                        </p>
                      )}

                      {/* Progress controls */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-medium text-gray-600">
                          Update progress:
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={goal.progress}
                          onChange={(e) =>
                            handleUpdateGoal(goal.id, {
                              progress: Number(e.target.value),
                            })
                          }
                          className="flex-1 accent-amber-600"
                        />
                        <span className="text-xs font-medium text-gray-600 w-10 text-right">
                          {goal.progress}%
                        </span>
                      </div>

                      {/* Status update */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-gray-600">
                          Status:
                        </label>
                        <select
                          value={goal.status}
                          onChange={(e) =>
                            handleUpdateGoal(goal.id, { status: e.target.value })
                          }
                          className="text-xs border rounded px-2 py-1"
                          style={{ borderColor: "#e5eaf0" }}
                        >
                          <option value="NOT_STARTED">Not Started</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="DEFERRED">Deferred</option>
                        </select>
                      </div>

                      {/* Milestones */}
                      {milestones.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-2">
                            Milestones
                          </p>
                          <div className="space-y-2">
                            {milestones.map((m, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    m.completed
                                      ? "bg-green-500 border-green-500"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {m.completed && (
                                    <svg
                                      className="w-2.5 h-2.5 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </div>
                                <span
                                  className={`text-sm ${
                                    m.completed
                                      ? "text-gray-400 line-through"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {m.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Coach notes */}
                      {goal.coachNotes && (
                        <div
                          className="rounded-lg p-3 border"
                          style={{
                            backgroundColor: "#D4A574" + "08",
                            borderColor: "#D4A574" + "25",
                          }}
                        >
                          <p className="text-xs font-semibold mb-1" style={{ color: "#D4A574" }}>
                            Coach Notes
                          </p>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {goal.coachNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Coaching Sessions Timeline */}
      {isActiveCoaching && (coachingMatch.sessions.length > 0) && (
        <section
          className="bg-white rounded-xl border shadow-sm"
          style={{ borderColor: "#e5eaf0" }}
        >
          <div className="px-6 py-5 border-b" style={{ borderColor: "#e5eaf0" }}>
            <h2 className="text-lg font-semibold" style={{ color: "#0F2744" }}>
              Coaching Sessions
            </h2>
          </div>
          <div className="p-6">
            {/* Upcoming */}
            {upcomingSessions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Upcoming
                </h3>
                <div className="space-y-3">
                  {upcomingSessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start gap-4 p-4 rounded-lg border"
                      style={{ borderColor: "#D4A574" + "40", backgroundColor: "#D4A574" + "05" }}
                    >
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                        style={{ backgroundColor: "#D4A574" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: "#0F2744" }}>
                          {formatDateTime(s.scheduledAt)}
                        </p>
                        {s.focusAreas.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {s.focusAreas.map((fa) => (
                              <span
                                key={fa}
                                className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700"
                              >
                                {fa}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past sessions */}
            {pastSessions.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Completed
                </h3>
                <div className="space-y-3">
                  {pastSessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start gap-4 p-4 rounded-lg border"
                      style={{ borderColor: "#e5eaf0" }}
                    >
                      <div className="w-3 h-3 rounded-full bg-green-400 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="text-sm font-medium" style={{ color: "#0F2744" }}>
                            {formatDateTime(s.scheduledAt)}
                          </p>
                          {s.duration && (
                            <span className="text-xs text-gray-400">
                              {s.duration} min
                            </span>
                          )}
                        </div>
                        {s.focusAreas.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {s.focusAreas.map((fa) => (
                              <span
                                key={fa}
                                className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                              >
                                {fa}
                              </span>
                            ))}
                          </div>
                        )}
                        {s.notes && (
                          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                            {s.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
