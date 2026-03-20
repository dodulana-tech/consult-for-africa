"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Session {
  id: string;
  scheduledAt: string;
  completedAt: string | null;
  duration: number | null;
  notes: string | null;
  focusAreas: string[];
  meetingLink: string | null;
  actionItems: string[];
  status: string;
}

interface GoalRating {
  id: string;
  raterType: string;
  score: number;
  note: string | null;
  createdAt: string;
}

interface Goal {
  id: string;
  dimension: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  source: string;
  coachNotes: string | null;
  managerValidated: boolean;
  ratings: GoalRating[];
}

interface AssessmentSummary {
  archetype: string | null;
  strengths: unknown;
  dimensionScores: unknown;
}

interface ClientData {
  match: {
    id: string;
    status: string;
    programme: string;
    startDate: string | null;
    endDate: string | null;
    sessionsCompleted: number;
    sessionsScheduled: number;
    matchRationale: string | null;
  };
  user: { id: string; name: string; title: string | null; department: string | null; organisation: { name: string } };
  sessions: Session[];
  assessmentSummary: AssessmentSummary | null;
  goals: Goal[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  NOT_STARTED: { bg: "bg-gray-100", text: "text-gray-700", label: "Not Started" },
  IN_PROGRESS: { bg: "bg-blue-50", text: "text-blue-700", label: "In Progress" },
  COMPLETED: { bg: "bg-green-50", text: "text-green-700", label: "Completed" },
  DEFERRED: { bg: "bg-amber-50", text: "text-amber-700", label: "Deferred" },
};

export default function ClientDetailPage({ params }: { params: Promise<{ matchId: string }> }) {
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ title: "", description: "", dimension: "", targetDate: "" });
  const [saving, setSaving] = useState(false);
  const [matchId, setMatchId] = useState("");
  // Session management
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ scheduledAt: "", focusAreas: "", meetingLink: "" });
  const [schedulingSaving, setSchedulingSaving] = useState(false);
  const [completingSession, setCompletingSession] = useState<string | null>(null);
  const [completeForm, setCompleteForm] = useState({ duration: "60", notes: "", focusAreas: "", actionItems: "" });
  const [completeSaving, setCompleteSaving] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ matchId: id }) => {
      setMatchId(id);
      fetch(`/api/maarova/coach/clients/${id}`)
        .then((r) => r.json())
        .then(setData)
        .finally(() => setLoading(false));
    });
  }, [params]);

  async function saveCoachNotes(goalId: string) {
    setSavingNotes(true);
    try {
      await fetch(`/api/maarova/coach/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachNotes: notesValue }),
      });
      // Refresh
      const res = await fetch(`/api/maarova/coach/clients/${matchId}`);
      setData(await res.json());
      setEditingNotes(null);
    } catch {}
    finally { setSavingNotes(false); }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/maarova/coach/clients/${matchId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignForm),
      });
      if (!res.ok) throw new Error("Failed");
      const refreshRes = await fetch(`/api/maarova/coach/clients/${matchId}`);
      setData(await refreshRes.json());
      setAssignForm({ title: "", description: "", dimension: "", targetDate: "" });
      setShowAssign(false);
    } catch {}
    finally { setSaving(false); }
  }

  async function handleScheduleSession(e: React.FormEvent) {
    e.preventDefault();
    setSchedulingSaving(true);
    try {
      const res = await fetch("/api/maarova/coach/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          scheduledAt: scheduleForm.scheduledAt,
          focusAreas: scheduleForm.focusAreas.split(",").map((s) => s.trim()).filter(Boolean),
          meetingLink: scheduleForm.meetingLink,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const refreshRes = await fetch(`/api/maarova/coach/clients/${matchId}`);
      setData(await refreshRes.json());
      setScheduleForm({ scheduledAt: "", focusAreas: "", meetingLink: "" });
      setShowSchedule(false);
    } catch {}
    finally { setSchedulingSaving(false); }
  }

  async function handleCompleteSession(sessionId: string) {
    setCompleteSaving(true);
    try {
      const res = await fetch(`/api/maarova/coach/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          duration: parseInt(completeForm.duration, 10) || 60,
          notes: completeForm.notes,
          focusAreas: completeForm.focusAreas.split(",").map((s) => s.trim()).filter(Boolean),
          actionItems: completeForm.actionItems.split("\n").map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const refreshRes = await fetch(`/api/maarova/coach/clients/${matchId}`);
      setData(await refreshRes.json());
      setCompletingSession(null);
      setCompleteForm({ duration: "60", notes: "", focusAreas: "", actionItems: "" });
    } catch {}
    finally { setCompleteSaving(false); }
  }

  async function handleCancelSession(sessionId: string) {
    try {
      await fetch(`/api/maarova/coach/sessions/${sessionId}`, { method: "DELETE" });
      const refreshRes = await fetch(`/api/maarova/coach/clients/${matchId}`);
      setData(await refreshRes.json());
    } catch {}
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-gray-500 text-center">Client not found.</div>;
  }

  const { match, user, sessions, assessmentSummary, goals } = data;
  const strengths = Array.isArray(assessmentSummary?.strengths) ? assessmentSummary.strengths as string[] : [];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/maarova/coach/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to clients
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500 text-sm">{user.title ?? ""} {user.department ? `| ${user.department}` : ""} | {user.organisation.name}</p>
          </div>
          <div className="text-xs text-gray-400">
            {match.programme.replace(/_/g, " ")} | {match.sessionsCompleted}/{match.sessionsScheduled} sessions
          </div>
        </div>
      </div>

      {/* Assessment summary */}
      {assessmentSummary && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#0F2744" }}>Assessment Summary</h2>
          {assessmentSummary.archetype && (
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Archetype:</span> {assessmentSummary.archetype}
            </p>
          )}
          {strengths.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {strengths.map((s, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(212,165,116,0.1)", color: "#92400E" }}>
                  {s}
                </span>
              ))}
            </div>
          )}
          <p className="text-[10px] text-gray-300 mt-3">Limited summary. Full report shared at the discretion of the coachee.</p>
        </div>
      )}

      {/* Goals */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#e5eaf0" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#0F2744" }}>Development Goals ({goals.length})</h2>
          <button
            onClick={() => setShowAssign(!showAssign)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
            style={{ backgroundColor: "#0F2744" }}
          >
            {showAssign ? "Cancel" : "Assign Goal"}
          </button>
        </div>

        {showAssign && (
          <form onSubmit={handleAssign} className="p-5 border-b space-y-3" style={{ borderColor: "#e5eaf0" }}>
            <div className="grid grid-cols-2 gap-3">
              <input required value={assignForm.title} onChange={(e) => setAssignForm((p) => ({ ...p, title: e.target.value }))} placeholder="Goal title" className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }} />
              <input required value={assignForm.dimension} onChange={(e) => setAssignForm((p) => ({ ...p, dimension: e.target.value }))} placeholder="Dimension" className="border rounded-lg px-3 py-2 text-sm" style={{ borderColor: "#e5eaf0" }} />
            </div>
            <textarea required value={assignForm.description} onChange={(e) => setAssignForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" style={{ borderColor: "#e5eaf0" }} />
            <button type="submit" disabled={saving} className="text-xs px-3 py-1.5 rounded-lg text-white font-medium disabled:opacity-50" style={{ backgroundColor: "#D4A574" }}>
              {saving ? "Assigning..." : "Assign"}
            </button>
          </form>
        )}

        <div className="divide-y" style={{ borderColor: "#e5eaf0" }}>
          {goals.map((goal) => {
            const st = STATUS_COLORS[goal.status] ?? STATUS_COLORS.NOT_STARTED;
            const isExpanded = expandedGoal === goal.id;

            return (
              <div key={goal.id}>
                <button
                  onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                  className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: "#0F2744" }}>{goal.title}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#0F2744" + "10", color: "#0F2744" }}>{goal.dimension}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${goal.progress}%`, background: "#D4A574" }} />
                      </div>
                      <span className="text-[10px] text-gray-400">{goal.progress}%</span>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 space-y-3">
                    <p className="text-sm text-gray-600 leading-relaxed">{goal.description}</p>

                    {/* Coach notes */}
                    <div className="rounded-lg p-3 border" style={{ backgroundColor: "#D4A574" + "08", borderColor: "#D4A574" + "25" }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold" style={{ color: "#D4A574" }}>Your Notes</span>
                        {editingNotes !== goal.id && (
                          <button
                            onClick={() => { setEditingNotes(goal.id); setNotesValue(goal.coachNotes ?? ""); }}
                            className="text-[10px] text-gray-400 hover:text-gray-600"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      {editingNotes === goal.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            rows={3}
                            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                            style={{ borderColor: "#D4A574" + "40" }}
                            placeholder="Add coaching notes for this goal..."
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveCoachNotes(goal.id)}
                              disabled={savingNotes}
                              className="text-[10px] px-2.5 py-1 rounded text-white font-medium disabled:opacity-50"
                              style={{ backgroundColor: "#D4A574" }}
                            >
                              {savingNotes ? "Saving..." : "Save"}
                            </button>
                            <button onClick={() => setEditingNotes(null)} className="text-[10px] text-gray-400">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {goal.coachNotes || <span className="text-gray-400 italic">No notes yet. Click Edit to add coaching notes.</span>}
                        </p>
                      )}
                    </div>

                    {/* Multi-rater progress */}
                    {goal.ratings.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Progress Ratings</p>
                        <div className="space-y-1.5">
                          {goal.ratings.map((r) => (
                            <div key={r.id} className="flex items-center gap-3 text-xs">
                              <span className="font-medium capitalize w-14 text-gray-500">{r.raterType}</span>
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-gray-400" style={{ width: `${r.score}%` }} />
                              </div>
                              <span className="text-gray-500 w-8 text-right">{r.score}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {goal.managerValidated && (
                      <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">Manager validated</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {goals.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No development goals set yet.</p>
          )}
        </div>
      </div>

      {/* Sessions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#e5eaf0" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
            Sessions ({sessions.filter((s) => s.status !== "CANCELLED").length})
          </h2>
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
            style={{ backgroundColor: "#D4A574" }}
          >
            {showSchedule ? "Cancel" : "Schedule Session"}
          </button>
        </div>

        {/* Schedule form */}
        {showSchedule && (
          <form onSubmit={handleScheduleSession} className="p-5 border-b space-y-3" style={{ borderColor: "#e5eaf0", background: "#FAFAFA" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date and time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleForm.scheduledAt}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: "#e5eaf0" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Google Meet link</label>
                <input
                  type="url"
                  value={scheduleForm.meetingLink}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, meetingLink: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: "#e5eaf0" }}
                  placeholder="https://meet.google.com/..."
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Focus areas (comma separated)</label>
              <input
                value={scheduleForm.focusAreas}
                onChange={(e) => setScheduleForm((p) => ({ ...p, focusAreas: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: "#e5eaf0" }}
                placeholder="e.g. Emotional Intelligence, Decision Making"
              />
            </div>
            <button
              type="submit"
              disabled={schedulingSaving}
              className="text-xs px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: "#0F2744" }}
            >
              {schedulingSaving ? "Scheduling..." : "Schedule Session"}
            </button>
          </form>
        )}

        {/* Session list */}
        <div className="divide-y" style={{ borderColor: "#e5eaf0" }}>
          {/* Upcoming sessions */}
          {sessions.filter((s) => s.status === "SCHEDULED").length > 0 && (
            <div className="p-5">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming</h3>
              <div className="space-y-3">
                {sessions.filter((s) => s.status === "SCHEDULED").map((s) => {
                  const isExpanded = expandedSession === s.id;
                  const isCompleting = completingSession === s.id;

                  return (
                    <div key={s.id} className="rounded-lg border p-4" style={{ borderColor: "#D4A574" + "40", background: "#D4A574" + "05" }}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: "#D4A574" }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: "#0F2744" }}>
                              {new Date(s.scheduledAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                            {(s.focusAreas ?? []).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {s.focusAreas.map((fa) => (
                                  <span key={fa} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{fa}</span>
                                ))}
                              </div>
                            )}
                            {s.meetingLink && (
                              <a
                                href={s.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Join Google Meet
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setCompletingSession(isCompleting ? null : s.id); setExpandedSession(null); }}
                            className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                          >
                            {isCompleting ? "Cancel" : "Complete"}
                          </button>
                          <button
                            onClick={() => setExpandedSession(isExpanded ? null : s.id)}
                            className="text-[10px] text-gray-400 hover:text-gray-600 px-1"
                          >
                            {isExpanded ? "Less" : "More"}
                          </button>
                        </div>
                      </div>

                      {/* Complete session form */}
                      {isCompleting && (
                        <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: "#D4A574" + "30" }}>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-medium text-gray-500 mb-1">Duration (minutes)</label>
                              <input
                                type="number"
                                value={completeForm.duration}
                                onChange={(e) => setCompleteForm((p) => ({ ...p, duration: e.target.value }))}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                style={{ borderColor: "#e5eaf0" }}
                                min="15"
                                max="180"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-gray-500 mb-1">Focus areas covered</label>
                              <input
                                value={completeForm.focusAreas}
                                onChange={(e) => setCompleteForm((p) => ({ ...p, focusAreas: e.target.value }))}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                                style={{ borderColor: "#e5eaf0" }}
                                placeholder="Comma separated"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-500 mb-1">Session notes</label>
                            <textarea
                              value={completeForm.notes}
                              onChange={(e) => setCompleteForm((p) => ({ ...p, notes: e.target.value }))}
                              rows={3}
                              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                              style={{ borderColor: "#e5eaf0" }}
                              placeholder="Key discussion points, observations, progress..."
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-500 mb-1">Action items (one per line)</label>
                            <textarea
                              value={completeForm.actionItems}
                              onChange={(e) => setCompleteForm((p) => ({ ...p, actionItems: e.target.value }))}
                              rows={2}
                              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                              style={{ borderColor: "#e5eaf0" }}
                              placeholder="Practice active listening in ward rounds&#10;Complete leadership reflection journal"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCompleteSession(s.id)}
                              disabled={completeSaving}
                              className="text-xs px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                              style={{ backgroundColor: "#16a34a" }}
                            >
                              {completeSaving ? "Saving..." : "Mark as Completed"}
                            </button>
                            <button
                              onClick={() => handleCancelSession(s.id)}
                              className="text-xs px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Cancel Session
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Expanded view (without completing) */}
                      {isExpanded && !isCompleting && (
                        <div className="mt-3 pt-3 border-t text-xs text-gray-500 space-y-1" style={{ borderColor: "#D4A574" + "20" }}>
                          {s.meetingLink && <p>Meeting: {s.meetingLink}</p>}
                          {!s.meetingLink && <p className="text-gray-400 italic">No Google Meet link set</p>}
                          <button
                            onClick={() => handleCancelSession(s.id)}
                            className="text-red-500 hover:text-red-700 mt-1"
                          >
                            Cancel this session
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed sessions */}
          {sessions.filter((s) => s.status === "COMPLETED").length > 0 && (
            <div className="p-5">
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Completed</h3>
              <div className="space-y-3">
                {sessions.filter((s) => s.status === "COMPLETED").map((s) => {
                  const isExpanded = expandedSession === s.id;
                  return (
                    <div
                      key={s.id}
                      className="rounded-lg border p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderColor: "#e5eaf0" }}
                      onClick={() => setExpandedSession(isExpanded ? null : s.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-400 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-medium" style={{ color: "#0F2744" }}>
                              {new Date(s.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            {s.duration && <span className="text-xs text-gray-400">{s.duration} min</span>}
                          </div>
                          {!isExpanded && (s.focusAreas ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {s.focusAreas.slice(0, 3).map((fa) => (
                                <span key={fa} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{fa}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t space-y-3" style={{ borderColor: "#e5eaf0" }} onClick={(e) => e.stopPropagation()}>
                          {(s.focusAreas ?? []).length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-500 mb-1">Focus Areas</p>
                              <div className="flex flex-wrap gap-1.5">
                                {s.focusAreas.map((fa) => (
                                  <span key={fa} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{fa}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {s.notes && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-500 mb-1">Session Notes</p>
                              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{s.notes}</p>
                            </div>
                          )}
                          {(s.actionItems ?? []).length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-gray-500 mb-1">Action Items</p>
                              <ul className="space-y-1">
                                {s.actionItems.map((item, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                    <span className="text-gray-300 mt-0.5">-</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sessions.filter((s) => s.status !== "CANCELLED").length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No sessions yet. Schedule the first session to begin the coaching programme.</p>
          )}
        </div>
      </div>
    </div>
  );
}
