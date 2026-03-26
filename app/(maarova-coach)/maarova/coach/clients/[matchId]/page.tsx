"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StructuredNotes {
  agendaItems?: string[];
  keyInsights?: string;
  commitments?: { text: string; dueDate?: string }[];
  goalsDiscussed?: string[];
  newGoals?: { title: string; description: string; dimension: string }[];
  goalRatings?: { goalId: string; score: number; note: string }[];
  midPointReflection?: string;
  graduationNotes?: string;
  sustainabilityPlan?: string[];
  coachReflection?: string;
}

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
  sessionNumber?: number;
  templateName?: string;
  templateType?: string;
  structuredNotes?: StructuredNotes | null;
  coacheeRating?: number | null;
  coacheeFeedback?: string | null;
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

interface ChemistryCall {
  scheduledAt: string | null;
  meetingLink: string | null;
  completedAt: string | null;
  proceed: boolean | null;
  notes: string | null;
  rating: number | null;
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
    chemistryCall?: ChemistryCall | null;
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

const TEMPLATE_GUIDANCE: Record<string, string> = {
  goal_setting: "Review assessment together. Set 2-3 development goals.",
  working: "Working session. Focus on development commitments and action items.",
  progress_review: "Progress check. Review goal ratings and adjust development plan.",
  integration: "Final session. Integration of learnings, sustainability plan, graduation.",
};

function StarRating({ value, onChange, readonly = false, size = "md" }: { value: number; onChange?: (v: number) => void; readonly?: boolean; size?: "sm" | "md" }) {
  const sizes = { sm: "w-4 h-4", md: "w-5 h-5" };
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
        >
          <svg
            className={`${sizes[size]} ${star <= value ? "text-amber-400" : "text-gray-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

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
  const [completeForm, setCompleteForm] = useState({
    duration: "60",
    notes: "",
    focusAreas: "",
    actionItems: "",
    agendaItems: [] as string[],
    keyInsights: "",
    commitments: [] as { text: string; dueDate: string }[],
    coachReflection: "",
    goalRatings: [] as { goalId: string; score: number; note: string }[],
    midPointReflection: "",
    graduationNotes: "",
    sustainabilityPlan: [] as string[],
    newGoalTitle: "",
    newGoalDescription: "",
    newGoalDimension: "",
  });
  const [completeSaving, setCompleteSaving] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  // Chemistry call
  const [chemistryForm, setChemistryForm] = useState({ scheduledAt: "", meetingLink: "" });
  const [chemistrySaving, setChemistrySaving] = useState(false);
  const [chemistryOutcome, setChemistryOutcome] = useState<"well" | "not_fit" | null>(null);
  const [chemistryNotes, setChemistryNotes] = useState("");
  const [chemistryRating, setChemistryRating] = useState(0);
  // Temp inputs
  const [newAgendaItem, setNewAgendaItem] = useState("");
  const [newCommitmentText, setNewCommitmentText] = useState("");
  const [newCommitmentDue, setNewCommitmentDue] = useState("");
  const [newSustainabilityItem, setNewSustainabilityItem] = useState("");

  useEffect(() => {
    params.then(({ matchId: id }) => {
      setMatchId(id);
      fetch(`/api/maarova/coach/clients/${id}`)
        .then((r) => r.json())
        .then(setData)
        .finally(() => setLoading(false));
    });
  }, [params]);

  async function refreshData() {
    const res = await fetch(`/api/maarova/coach/clients/${matchId}`);
    setData(await res.json());
  }

  async function saveCoachNotes(goalId: string) {
    setSavingNotes(true);
    try {
      await fetch(`/api/maarova/coach/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachNotes: notesValue }),
      });
      await refreshData();
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
      await refreshData();
      setAssignForm({ title: "", description: "", dimension: "", targetDate: "" });
      setShowAssign(false);
    } catch {}
    finally { setSaving(false); }
  }

  async function handleScheduleChemistryCall(e: React.FormEvent) {
    e.preventDefault();
    setChemistrySaving(true);
    try {
      const res = await fetch(`/api/maarova/coach/clients/${matchId}/chemistry-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule", scheduledAt: chemistryForm.scheduledAt, meetingLink: chemistryForm.meetingLink }),
      });
      if (!res.ok) throw new Error("Failed");
      await refreshData();
      setChemistryForm({ scheduledAt: "", meetingLink: "" });
    } catch {}
    finally { setChemistrySaving(false); }
  }

  async function handleCompleteChemistryCall(proceed: boolean) {
    setChemistrySaving(true);
    try {
      const res = await fetch(`/api/maarova/coach/clients/${matchId}/chemistry-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          proceed,
          notes: chemistryNotes || undefined,
          rating: proceed ? chemistryRating || undefined : undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      await refreshData();
      setChemistryOutcome(null);
      setChemistryNotes("");
      setChemistryRating(0);
    } catch {}
    finally { setChemistrySaving(false); }
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
      await refreshData();
      setScheduleForm({ scheduledAt: "", focusAreas: "", meetingLink: "" });
      setShowSchedule(false);
    } catch {}
    finally { setSchedulingSaving(false); }
  }

  async function handleCompleteSession(sessionId: string) {
    setCompleteSaving(true);
    try {
      const structuredNotes: StructuredNotes = {
        agendaItems: completeForm.agendaItems,
        keyInsights: completeForm.keyInsights || undefined,
        commitments: completeForm.commitments.length > 0 ? completeForm.commitments : undefined,
        coachReflection: completeForm.coachReflection || undefined,
      };

      // Get session template type
      const session = data?.sessions.find((s) => s.id === sessionId);
      const templateType = session?.templateType;

      if (templateType === "progress_review") {
        structuredNotes.goalRatings = completeForm.goalRatings.filter((r) => r.score > 0);
        structuredNotes.midPointReflection = completeForm.midPointReflection || undefined;
      }
      if (templateType === "integration") {
        structuredNotes.graduationNotes = completeForm.graduationNotes || undefined;
        structuredNotes.sustainabilityPlan = completeForm.sustainabilityPlan.length > 0 ? completeForm.sustainabilityPlan : undefined;
      }

      const res = await fetch(`/api/maarova/coach/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          duration: parseInt(completeForm.duration, 10) || 60,
          notes: completeForm.notes,
          focusAreas: completeForm.focusAreas.split(",").map((s) => s.trim()).filter(Boolean),
          actionItems: completeForm.actionItems.split("\n").map((s) => s.trim()).filter(Boolean),
          structuredNotes,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      await refreshData();
      setCompletingSession(null);
      setCompleteForm({
        duration: "60", notes: "", focusAreas: "", actionItems: "",
        agendaItems: [], keyInsights: "", commitments: [], coachReflection: "",
        goalRatings: [], midPointReflection: "", graduationNotes: "",
        sustainabilityPlan: [], newGoalTitle: "", newGoalDescription: "", newGoalDimension: "",
      });
    } catch {}
    finally { setCompleteSaving(false); }
  }

  async function handleCancelSession(sessionId: string) {
    try {
      await fetch(`/api/maarova/coach/sessions/${sessionId}`, { method: "DELETE" });
      await refreshData();
    } catch {}
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-4 sm:p-8 text-gray-500 text-center">Client not found.</div>;
  }

  const { match, user, sessions, assessmentSummary, goals } = data;
  const strengths = Array.isArray(assessmentSummary?.strengths) ? assessmentSummary.strengths as string[] : [];
  const chemistryCall = match.chemistryCall;
  const isPendingMatch = match.status === "PENDING_MATCH";

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <Link href="/maarova/coach/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to clients
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-500 text-sm">{user.title ?? ""} {user.department ? `| ${user.department}` : ""} | {user.organisation.name}</p>
          </div>
          <div className="text-xs text-gray-400">
            {match.programme.replace(/_/g, " ")} | {match.sessionsCompleted}/{match.sessionsScheduled} sessions
          </div>
        </div>
      </div>

      {/* Chemistry Call Section */}
      {isPendingMatch && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5eaf0" }}>
          <div className="px-4 sm:px-5 py-4 border-b" style={{ borderColor: "#e5eaf0" }}>
            <h2 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" style={{ color: "#D4A574" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Chemistry Call
              </span>
            </h2>
          </div>

          <div className="p-4 sm:p-5">
            {/* Not yet scheduled */}
            {!chemistryCall?.scheduledAt && (
              <form onSubmit={handleScheduleChemistryCall} className="space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  Schedule a 15-minute introductory call with {user.name.split(" ")[0]} to ensure a good coaching fit.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Date and time</label>
                    <input
                      type="datetime-local"
                      required
                      value={chemistryForm.scheduledAt}
                      onChange={(e) => setChemistryForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm"
                      style={{ borderColor: "#e5eaf0" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Google Meet link</label>
                    <input
                      type="url"
                      value={chemistryForm.meetingLink}
                      onChange={(e) => setChemistryForm((p) => ({ ...p, meetingLink: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm"
                      style={{ borderColor: "#e5eaf0" }}
                      placeholder="https://meet.google.com/..."
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={chemistrySaving}
                  className="text-sm px-4 py-2.5 rounded-lg text-white font-medium disabled:opacity-50 min-h-[44px]"
                  style={{ backgroundColor: "#0F2744" }}
                >
                  {chemistrySaving ? "Scheduling..." : "Schedule Call"}
                </button>
              </form>
            )}

            {/* Scheduled but not completed */}
            {chemistryCall?.scheduledAt && !chemistryCall.completedAt && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg p-4" style={{ background: "#D4A574" + "08", border: `1px solid #D4A57430` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "#D4A574" + "20" }}>
                    <svg className="w-4 h-4" style={{ color: "#D4A574" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "#0F2744" }}>
                      Scheduled: {new Date(chemistryCall.scheduledAt).toLocaleDateString("en-GB", {
                        weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                    {chemistryCall.meetingLink && (
                      <a
                        href={chemistryCall.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline mt-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Join Google Meet
                      </a>
                    )}
                  </div>
                </div>

                {/* Outcome buttons */}
                {!chemistryOutcome && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">How did the chemistry call go?</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => setChemistryOutcome("well")}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-green-50 min-h-[44px]"
                        style={{ borderColor: "#BBF7D0", color: "#166534" }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        Call Went Well
                      </button>
                      <button
                        onClick={() => setChemistryOutcome("not_fit")}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors hover:bg-red-50 min-h-[44px]"
                        style={{ borderColor: "#FECACA", color: "#991B1B" }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                        </svg>
                        Not a Good Fit
                      </button>
                    </div>
                  </div>
                )}

                {/* Call went well - optional notes/rating */}
                {chemistryOutcome === "well" && (
                  <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: "#BBF7D0", background: "#F0FDF4" }}>
                    <h4 className="text-sm font-semibold text-green-800">Great! Add optional notes and rating</h4>
                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1">Rating (optional)</label>
                      <StarRating value={chemistryRating} onChange={setChemistryRating} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1">Notes (optional)</label>
                      <textarea
                        value={chemistryNotes}
                        onChange={(e) => setChemistryNotes(e.target.value)}
                        rows={2}
                        className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                        style={{ borderColor: "#BBF7D0" }}
                        placeholder="Initial impressions, rapport, topics discussed..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCompleteChemistryCall(true)}
                        disabled={chemistrySaving}
                        className="text-sm px-4 py-2.5 rounded-lg text-white font-medium disabled:opacity-50 min-h-[44px]"
                        style={{ backgroundColor: "#16a34a" }}
                      >
                        {chemistrySaving ? "Saving..." : "Confirm and Proceed"}
                      </button>
                      <button
                        onClick={() => setChemistryOutcome(null)}
                        className="text-sm px-3 py-2.5 rounded-lg text-gray-500 hover:text-gray-700 min-h-[44px]"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}

                {/* Not a good fit - requires notes */}
                {chemistryOutcome === "not_fit" && (
                  <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: "#FECACA", background: "#FEF2F2" }}>
                    <h4 className="text-sm font-semibold text-red-800">Please explain why it was not a good fit</h4>
                    <div>
                      <label className="block text-xs font-medium text-red-700 mb-1">Notes (required)</label>
                      <textarea
                        value={chemistryNotes}
                        onChange={(e) => setChemistryNotes(e.target.value)}
                        rows={3}
                        required
                        className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                        style={{ borderColor: "#FECACA" }}
                        placeholder="What did not work? Communication style, expectations, availability..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCompleteChemistryCall(false)}
                        disabled={chemistrySaving || !chemistryNotes.trim()}
                        className="text-sm px-4 py-2.5 rounded-lg text-white font-medium disabled:opacity-50 min-h-[44px]"
                        style={{ backgroundColor: "#DC2626" }}
                      >
                        {chemistrySaving ? "Saving..." : "Submit and End Match"}
                      </button>
                      <button
                        onClick={() => setChemistryOutcome(null)}
                        className="text-sm px-3 py-2.5 rounded-lg text-gray-500 hover:text-gray-700 min-h-[44px]"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Chemistry call completed */}
            {chemistryCall?.completedAt && (
              <div className={`rounded-lg p-4 ${chemistryCall.proceed ? "bg-green-50" : "bg-red-50"}`}>
                <div className="flex items-center gap-2 mb-1">
                  {chemistryCall.proceed ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-sm font-medium ${chemistryCall.proceed ? "text-green-800" : "text-red-800"}`}>
                    {chemistryCall.proceed ? "Chemistry call completed, proceeding" : "Not a good fit"}
                  </span>
                  {chemistryCall.rating && chemistryCall.rating > 0 && (
                    <StarRating value={chemistryCall.rating} readonly size="sm" />
                  )}
                </div>
                {chemistryCall.notes && (
                  <p className={`text-xs mt-1 ${chemistryCall.proceed ? "text-green-700" : "text-red-700"}`}>
                    {chemistryCall.notes}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assessment summary */}
      {assessmentSummary && (
        <div className="bg-white rounded-xl border p-4 sm:p-5" style={{ borderColor: "#e5eaf0" }}>
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
          <p className="text-[11px] text-gray-300 mt-3">Limited summary. Full report shared at the discretion of the coachee.</p>
        </div>
      )}

      {/* Goals */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5eaf0" }}>
        <div className="px-4 sm:px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#e5eaf0" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#0F2744" }}>Development Goals ({goals.length})</h2>
          <button
            onClick={() => setShowAssign(!showAssign)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg text-white min-h-[36px]"
            style={{ backgroundColor: "#0F2744" }}
          >
            {showAssign ? "Cancel" : "Assign Goal"}
          </button>
        </div>

        {showAssign && (
          <form onSubmit={handleAssign} className="p-4 sm:p-5 border-b space-y-3" style={{ borderColor: "#e5eaf0" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input required value={assignForm.title} onChange={(e) => setAssignForm((p) => ({ ...p, title: e.target.value }))} placeholder="Goal title" className="border rounded-lg px-3 py-2.5 text-sm" style={{ borderColor: "#e5eaf0" }} />
              <input required value={assignForm.dimension} onChange={(e) => setAssignForm((p) => ({ ...p, dimension: e.target.value }))} placeholder="Dimension" className="border rounded-lg px-3 py-2.5 text-sm" style={{ borderColor: "#e5eaf0" }} />
            </div>
            <textarea required value={assignForm.description} onChange={(e) => setAssignForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description" rows={2} className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none" style={{ borderColor: "#e5eaf0" }} />
            <button type="submit" disabled={saving} className="text-xs px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50 min-h-[36px]" style={{ backgroundColor: "#D4A574" }}>
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
                  className="w-full text-left px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors min-h-[48px]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium" style={{ color: "#0F2744" }}>{goal.title}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#0F2744" + "10", color: "#0F2744" }}>{goal.dimension}</span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${goal.progress}%`, background: "#D4A574" }} />
                      </div>
                      <span className="text-[11px] text-gray-400">{goal.progress}%</span>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-4 space-y-3">
                    <p className="text-sm text-gray-600 leading-relaxed">{goal.description}</p>

                    {/* Coach notes */}
                    <div className="rounded-lg p-3 border" style={{ backgroundColor: "#D4A574" + "08", borderColor: "#D4A574" + "25" }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold" style={{ color: "#D4A574" }}>Your Notes</span>
                        {editingNotes !== goal.id && (
                          <button
                            onClick={() => { setEditingNotes(goal.id); setNotesValue(goal.coachNotes ?? ""); }}
                            className="text-[11px] text-gray-400 hover:text-gray-600 min-h-[32px] px-2"
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
                              className="text-[11px] px-3 py-1.5 rounded text-white font-medium disabled:opacity-50 min-h-[32px]"
                              style={{ backgroundColor: "#D4A574" }}
                            >
                              {savingNotes ? "Saving..." : "Save"}
                            </button>
                            <button onClick={() => setEditingNotes(null)} className="text-[11px] text-gray-400 min-h-[32px] px-2">Cancel</button>
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
                      <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">Manager validated</span>
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
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#e5eaf0" }}>
        <div className="px-4 sm:px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#e5eaf0" }}>
          <h2 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
            Sessions ({sessions.filter((s) => s.status !== "CANCELLED").length})
          </h2>
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg text-white min-h-[36px]"
            style={{ backgroundColor: "#D4A574" }}
          >
            {showSchedule ? "Cancel" : "Schedule Session"}
          </button>
        </div>

        {/* Schedule form */}
        {showSchedule && (
          <form onSubmit={handleScheduleSession} className="p-4 sm:p-5 border-b space-y-3" style={{ borderColor: "#e5eaf0", background: "#FAFAFA" }}>
            {/* Next session template info */}
            {(() => {
              const completedCount = sessions.filter((s) => s.status === "COMPLETED").length;
              const scheduledCount = sessions.filter((s) => s.status === "SCHEDULED").length;
              const nextNum = completedCount + scheduledCount + 1;
              const totalSessions = match.sessionsScheduled || 12;
              let templateType = "working";
              let templateName = `Session ${nextNum}: Working Session`;
              if (nextNum === 1) { templateType = "goal_setting"; templateName = `Session ${nextNum}: Goal Setting`; }
              else if (nextNum === Math.ceil(totalSessions * 0.6)) { templateType = "progress_review"; templateName = `Session ${nextNum}: Progress Review`; }
              else if (nextNum >= totalSessions) { templateType = "integration"; templateName = `Session ${nextNum}: Integration`; }
              return (
                <div className="rounded-lg p-3 border" style={{ background: "#0F2744" + "05", borderColor: "#0F2744" + "15" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#D4A574" + "20", color: "#92400E" }}>
                      {templateName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{TEMPLATE_GUIDANCE[templateType]}</p>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date and time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleForm.scheduledAt}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, scheduledAt: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
                  style={{ borderColor: "#e5eaf0" }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Google Meet link</label>
                <input
                  type="url"
                  value={scheduleForm.meetingLink}
                  onChange={(e) => setScheduleForm((p) => ({ ...p, meetingLink: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm"
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
                className="w-full border rounded-lg px-3 py-2.5 text-sm"
                style={{ borderColor: "#e5eaf0" }}
                placeholder="e.g. Emotional Intelligence, Decision Making"
              />
            </div>
            <button
              type="submit"
              disabled={schedulingSaving}
              className="text-sm px-4 py-2.5 rounded-lg text-white font-medium disabled:opacity-50 min-h-[44px]"
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
            <div className="p-4 sm:p-5">
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming</h3>
              <div className="space-y-3">
                {sessions.filter((s) => s.status === "SCHEDULED").map((s) => {
                  const isExpanded = expandedSession === s.id;
                  const isCompleting = completingSession === s.id;
                  const templateType = s.templateType || "working";

                  return (
                    <div key={s.id} className="rounded-lg border p-4" style={{ borderColor: "#D4A574" + "40", background: "#D4A574" + "05" }}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: "#D4A574" }} />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium" style={{ color: "#0F2744" }}>
                                {new Date(s.scheduledAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                              {s.templateName && (
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#D4A574" + "20", color: "#92400E" }}>
                                  {s.sessionNumber ? `#${s.sessionNumber} ` : ""}{s.templateName}
                                </span>
                              )}
                            </div>
                            {TEMPLATE_GUIDANCE[templateType] && (
                              <p className="text-xs text-gray-400 mt-1">{TEMPLATE_GUIDANCE[templateType]}</p>
                            )}
                            {(s.focusAreas ?? []).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {s.focusAreas.map((fa) => (
                                  <span key={fa} className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{fa}</span>
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
                        <div className="flex items-center gap-2 ml-6 sm:ml-0">
                          <button
                            onClick={() => { setCompletingSession(isCompleting ? null : s.id); setExpandedSession(null); }}
                            className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors min-h-[36px]"
                          >
                            {isCompleting ? "Cancel" : "Complete"}
                          </button>
                          <button
                            onClick={() => setExpandedSession(isExpanded ? null : s.id)}
                            className="text-[11px] text-gray-400 hover:text-gray-600 px-2 min-h-[36px]"
                          >
                            {isExpanded ? "Less" : "More"}
                          </button>
                        </div>
                      </div>

                      {/* Complete session form - structured */}
                      {isCompleting && (
                        <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: "#D4A574" + "30" }}>
                          {/* Duration and Focus */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-medium text-gray-500 mb-1">Duration (minutes)</label>
                              <input
                                type="number"
                                value={completeForm.duration}
                                onChange={(e) => setCompleteForm((p) => ({ ...p, duration: e.target.value }))}
                                className="w-full border rounded-lg px-3 py-2.5 text-sm"
                                style={{ borderColor: "#e5eaf0" }}
                                min="15"
                                max="180"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-gray-500 mb-1">Focus areas covered</label>
                              <input
                                value={completeForm.focusAreas}
                                onChange={(e) => setCompleteForm((p) => ({ ...p, focusAreas: e.target.value }))}
                                className="w-full border rounded-lg px-3 py-2.5 text-sm"
                                style={{ borderColor: "#e5eaf0" }}
                                placeholder="Comma separated"
                              />
                            </div>
                          </div>

                          {/* Agenda Items */}
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">Agenda Items</label>
                            <div className="space-y-1.5 mb-2">
                              {completeForm.agendaItems.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                                  <span className="flex-1">{item}</span>
                                  <button
                                    type="button"
                                    onClick={() => setCompleteForm((p) => ({ ...p, agendaItems: p.agendaItems.filter((_, idx) => idx !== i) }))}
                                    className="text-gray-400 hover:text-red-500 shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                value={newAgendaItem}
                                onChange={(e) => setNewAgendaItem(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && newAgendaItem.trim()) {
                                    e.preventDefault();
                                    setCompleteForm((p) => ({ ...p, agendaItems: [...p.agendaItems, newAgendaItem.trim()] }));
                                    setNewAgendaItem("");
                                  }
                                }}
                                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                                style={{ borderColor: "#e5eaf0" }}
                                placeholder="Add agenda item, press Enter"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (newAgendaItem.trim()) {
                                    setCompleteForm((p) => ({ ...p, agendaItems: [...p.agendaItems, newAgendaItem.trim()] }));
                                    setNewAgendaItem("");
                                  }
                                }}
                                className="text-xs px-3 py-2 rounded-lg border font-medium min-h-[40px]"
                                style={{ borderColor: "#e5eaf0", color: "#0F2744" }}
                              >
                                Add
                              </button>
                            </div>
                          </div>

                          {/* Key Insights */}
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">Key Insights</label>
                            <textarea
                              value={completeForm.keyInsights}
                              onChange={(e) => setCompleteForm((p) => ({ ...p, keyInsights: e.target.value }))}
                              rows={3}
                              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                              style={{ borderColor: "#e5eaf0" }}
                              placeholder="Key observations, breakthroughs, patterns noticed..."
                            />
                          </div>

                          {/* Commitments */}
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">Commitments</label>
                            <div className="space-y-1.5 mb-2">
                              {completeForm.commitments.map((c, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                                  <span className="flex-1">{c.text}</span>
                                  {c.dueDate && <span className="text-[11px] text-gray-400 shrink-0">Due: {c.dueDate}</span>}
                                  <button
                                    type="button"
                                    onClick={() => setCompleteForm((p) => ({ ...p, commitments: p.commitments.filter((_, idx) => idx !== i) }))}
                                    className="text-gray-400 hover:text-red-500 shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                value={newCommitmentText}
                                onChange={(e) => setNewCommitmentText(e.target.value)}
                                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                                style={{ borderColor: "#e5eaf0" }}
                                placeholder="Commitment description"
                              />
                              <input
                                type="date"
                                value={newCommitmentDue}
                                onChange={(e) => setNewCommitmentDue(e.target.value)}
                                className="border rounded-lg px-3 py-2 text-sm w-full sm:w-36"
                                style={{ borderColor: "#e5eaf0" }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (newCommitmentText.trim()) {
                                    setCompleteForm((p) => ({ ...p, commitments: [...p.commitments, { text: newCommitmentText.trim(), dueDate: newCommitmentDue }] }));
                                    setNewCommitmentText("");
                                    setNewCommitmentDue("");
                                  }
                                }}
                                className="text-xs px-3 py-2 rounded-lg border font-medium min-h-[40px]"
                                style={{ borderColor: "#e5eaf0", color: "#0F2744" }}
                              >
                                Add
                              </button>
                            </div>
                          </div>

                          {/* Goal Setting extras */}
                          {templateType === "goal_setting" && (
                            <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: "#D4A574" + "30", background: "#D4A574" + "05" }}>
                              <h4 className="text-xs font-semibold" style={{ color: "#D4A574" }}>Goal Setting</h4>
                              {goals.length > 0 && (
                                <div>
                                  <p className="text-[11px] text-gray-500 mb-1.5">Existing goals discussed</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {goals.map((g) => (
                                      <span key={g.id} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{g.title}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div>
                                <p className="text-[11px] text-gray-500 mb-1.5">Assign new goal (optional)</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <input
                                    value={completeForm.newGoalTitle}
                                    onChange={(e) => setCompleteForm((p) => ({ ...p, newGoalTitle: e.target.value }))}
                                    className="border rounded-lg px-3 py-2 text-sm"
                                    style={{ borderColor: "#e5eaf0" }}
                                    placeholder="Goal title"
                                  />
                                  <input
                                    value={completeForm.newGoalDimension}
                                    onChange={(e) => setCompleteForm((p) => ({ ...p, newGoalDimension: e.target.value }))}
                                    className="border rounded-lg px-3 py-2 text-sm"
                                    style={{ borderColor: "#e5eaf0" }}
                                    placeholder="Dimension"
                                  />
                                </div>
                                <textarea
                                  value={completeForm.newGoalDescription}
                                  onChange={(e) => setCompleteForm((p) => ({ ...p, newGoalDescription: e.target.value }))}
                                  className="w-full mt-2 border rounded-lg px-3 py-2 text-sm resize-none"
                                  style={{ borderColor: "#e5eaf0" }}
                                  rows={2}
                                  placeholder="Goal description"
                                />
                              </div>
                            </div>
                          )}

                          {/* Progress Review extras */}
                          {templateType === "progress_review" && (
                            <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: "#3B82F6" + "30", background: "#EFF6FF" }}>
                              <h4 className="text-xs font-semibold text-blue-800">Progress Review</h4>
                              {goals.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-[11px] text-blue-700">Rate progress on each goal (0-100)</p>
                                  {goals.map((g) => {
                                    const existing = completeForm.goalRatings.find((r) => r.goalId === g.id);
                                    return (
                                      <div key={g.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">{g.title}</span>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={existing?.score ?? ""}
                                            onChange={(e) => {
                                              const score = parseInt(e.target.value, 10) || 0;
                                              setCompleteForm((p) => {
                                                const ratings = p.goalRatings.filter((r) => r.goalId !== g.id);
                                                ratings.push({ goalId: g.id, score, note: existing?.note ?? "" });
                                                return { ...p, goalRatings: ratings };
                                              });
                                            }}
                                            className="w-16 border rounded-lg px-2 py-1.5 text-sm text-center"
                                            style={{ borderColor: "#e5eaf0" }}
                                            placeholder="0"
                                          />
                                          <span className="text-xs text-gray-400">%</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              <div>
                                <label className="block text-[11px] font-medium text-blue-700 mb-1">Mid-point reflection</label>
                                <textarea
                                  value={completeForm.midPointReflection}
                                  onChange={(e) => setCompleteForm((p) => ({ ...p, midPointReflection: e.target.value }))}
                                  rows={2}
                                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                                  style={{ borderColor: "#BFDBFE" }}
                                  placeholder="Overall progress reflections, what is working, what needs adjustment..."
                                />
                              </div>
                            </div>
                          )}

                          {/* Integration extras */}
                          {templateType === "integration" && (
                            <div className="rounded-lg border p-4 space-y-3" style={{ borderColor: "#16a34a" + "30", background: "#F0FDF4" }}>
                              <h4 className="text-xs font-semibold text-green-800">Integration and Graduation</h4>
                              <div>
                                <label className="block text-[11px] font-medium text-green-700 mb-1">Graduation notes</label>
                                <textarea
                                  value={completeForm.graduationNotes}
                                  onChange={(e) => setCompleteForm((p) => ({ ...p, graduationNotes: e.target.value }))}
                                  rows={2}
                                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                                  style={{ borderColor: "#BBF7D0" }}
                                  placeholder="Overall coaching journey summary, key transformations..."
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-medium text-green-700 mb-1">Sustainability plan items</label>
                                <div className="space-y-1.5 mb-2">
                                  {completeForm.sustainabilityPlan.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-white rounded-lg px-3 py-2 border" style={{ borderColor: "#BBF7D0" }}>
                                      <span className="flex-1">{item}</span>
                                      <button
                                        type="button"
                                        onClick={() => setCompleteForm((p) => ({ ...p, sustainabilityPlan: p.sustainabilityPlan.filter((_, idx) => idx !== i) }))}
                                        className="text-gray-400 hover:text-red-500 shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex gap-2">
                                  <input
                                    value={newSustainabilityItem}
                                    onChange={(e) => setNewSustainabilityItem(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && newSustainabilityItem.trim()) {
                                        e.preventDefault();
                                        setCompleteForm((p) => ({ ...p, sustainabilityPlan: [...p.sustainabilityPlan, newSustainabilityItem.trim()] }));
                                        setNewSustainabilityItem("");
                                      }
                                    }}
                                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                                    style={{ borderColor: "#BBF7D0" }}
                                    placeholder="Add sustainability item, press Enter"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (newSustainabilityItem.trim()) {
                                        setCompleteForm((p) => ({ ...p, sustainabilityPlan: [...p.sustainabilityPlan, newSustainabilityItem.trim()] }));
                                        setNewSustainabilityItem("");
                                      }
                                    }}
                                    className="text-xs px-3 py-2 rounded-lg border font-medium min-h-[40px]"
                                    style={{ borderColor: "#BBF7D0", color: "#166534" }}
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Session notes (general) */}
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">Session notes</label>
                            <textarea
                              value={completeForm.notes}
                              onChange={(e) => setCompleteForm((p) => ({ ...p, notes: e.target.value }))}
                              rows={3}
                              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                              style={{ borderColor: "#e5eaf0" }}
                              placeholder="Key discussion points, observations, progress..."
                            />
                          </div>

                          {/* Action items */}
                          <div>
                            <label className="block text-[11px] font-medium text-gray-500 mb-1">Action items (one per line)</label>
                            <textarea
                              value={completeForm.actionItems}
                              onChange={(e) => setCompleteForm((p) => ({ ...p, actionItems: e.target.value }))}
                              rows={2}
                              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                              style={{ borderColor: "#e5eaf0" }}
                              placeholder={"Practice active listening in ward rounds\nComplete leadership reflection journal"}
                            />
                          </div>

                          {/* Coach reflection (private) */}
                          <div className="rounded-lg border p-3" style={{ background: "#F5F3FF", borderColor: "#DDD6FE" }}>
                            <label className="block text-[11px] font-medium text-purple-700 mb-1">
                              Coach Reflection (private, not shared with coachee)
                            </label>
                            <textarea
                              value={completeForm.coachReflection}
                              onChange={(e) => setCompleteForm((p) => ({ ...p, coachReflection: e.target.value }))}
                              rows={2}
                              className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                              style={{ borderColor: "#DDD6FE" }}
                              placeholder="Your private reflections on this session, approach adjustments..."
                            />
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleCompleteSession(s.id)}
                              disabled={completeSaving}
                              className="text-sm px-4 py-2.5 rounded-lg text-white font-medium disabled:opacity-50 min-h-[44px]"
                              style={{ backgroundColor: "#16a34a" }}
                            >
                              {completeSaving ? "Saving..." : "Mark as Completed"}
                            </button>
                            <button
                              onClick={() => handleCancelSession(s.id)}
                              className="text-sm px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors min-h-[44px]"
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
                            className="text-red-500 hover:text-red-700 mt-1 min-h-[32px]"
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
            <div className="p-4 sm:p-5">
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Completed</h3>
              <div className="space-y-3">
                {sessions.filter((s) => s.status === "COMPLETED").map((s) => {
                  const isExpanded = expandedSession === s.id;
                  const sNotes = s.structuredNotes;
                  return (
                    <div
                      key={s.id}
                      className="rounded-lg border p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      style={{ borderColor: "#e5eaf0" }}
                      onClick={() => setExpandedSession(isExpanded ? null : s.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium" style={{ color: "#0F2744" }}>
                              {new Date(s.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            {s.duration && <span className="text-xs text-gray-400">{s.duration} min</span>}
                            {s.templateName && (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#D4A574" + "15", color: "#92400E" }}>
                                {s.sessionNumber ? `#${s.sessionNumber} ` : ""}{s.templateName}
                              </span>
                            )}
                            {s.coacheeRating && s.coacheeRating > 0 && (
                              <span className="flex items-center gap-0.5">
                                <StarRating value={s.coacheeRating} readonly size="sm" />
                              </span>
                            )}
                          </div>
                          {!isExpanded && (s.focusAreas ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {s.focusAreas.slice(0, 3).map((fa) => (
                                <span key={fa} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{fa}</span>
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
                          {/* Structured notes display */}
                          {sNotes && (
                            <div className="space-y-3">
                              {/* Agenda items */}
                              {(sNotes.agendaItems ?? []).length > 0 && (
                                <div>
                                  <p className="text-[11px] font-semibold text-gray-500 mb-1">Agenda</p>
                                  <ul className="space-y-1">
                                    {sNotes.agendaItems!.map((item, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                        <span className="text-gray-300 mt-0.5 shrink-0">&#8226;</span>
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Key insights */}
                              {sNotes.keyInsights && (
                                <div>
                                  <p className="text-[11px] font-semibold text-gray-500 mb-1">Key Insights</p>
                                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{sNotes.keyInsights}</p>
                                </div>
                              )}

                              {/* Commitments */}
                              {(sNotes.commitments ?? []).length > 0 && (
                                <div>
                                  <p className="text-[11px] font-semibold text-gray-500 mb-1">Commitments</p>
                                  <ul className="space-y-1">
                                    {sNotes.commitments!.map((c, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                        <span className="text-gray-300 mt-0.5 shrink-0">&#8226;</span>
                                        <span className="flex-1">{c.text}</span>
                                        {c.dueDate && <span className="text-[11px] text-gray-400 shrink-0">Due: {c.dueDate}</span>}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Goal ratings */}
                              {(sNotes.goalRatings ?? []).length > 0 && (
                                <div>
                                  <p className="text-[11px] font-semibold text-gray-500 mb-1">Goal Ratings</p>
                                  <div className="space-y-1.5">
                                    {sNotes.goalRatings!.map((r, i) => {
                                      const goal = goals.find((g) => g.id === r.goalId);
                                      return (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                          <span className="text-gray-600 flex-1 truncate">{goal?.title ?? "Goal"}</span>
                                          <div className="flex items-center gap-1">
                                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                              <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: "#D4A574" }} />
                                            </div>
                                            <span className="text-xs text-gray-400 w-8 text-right">{r.score}%</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Mid-point reflection */}
                              {sNotes.midPointReflection && (
                                <div>
                                  <p className="text-[11px] font-semibold text-gray-500 mb-1">Mid-point Reflection</p>
                                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{sNotes.midPointReflection}</p>
                                </div>
                              )}

                              {/* Graduation notes */}
                              {sNotes.graduationNotes && (
                                <div>
                                  <p className="text-[11px] font-semibold text-gray-500 mb-1">Graduation Notes</p>
                                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{sNotes.graduationNotes}</p>
                                </div>
                              )}

                              {/* Sustainability plan */}
                              {(sNotes.sustainabilityPlan ?? []).length > 0 && (
                                <div>
                                  <p className="text-[11px] font-semibold text-gray-500 mb-1">Sustainability Plan</p>
                                  <ul className="space-y-1">
                                    {sNotes.sustainabilityPlan!.map((item, i) => (
                                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                        <span className="text-green-400 mt-0.5 shrink-0">&#8226;</span>
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Coach reflection (private) */}
                              {sNotes.coachReflection && (
                                <div className="rounded-lg p-3 border" style={{ background: "#F5F3FF", borderColor: "#DDD6FE" }}>
                                  <p className="text-[11px] font-semibold text-purple-600 mb-1">Your Reflection (private)</p>
                                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{sNotes.coachReflection}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Legacy notes display */}
                          {(s.focusAreas ?? []).length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold text-gray-500 mb-1">Focus Areas</p>
                              <div className="flex flex-wrap gap-1.5">
                                {s.focusAreas.map((fa) => (
                                  <span key={fa} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{fa}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {s.notes && (
                            <div>
                              <p className="text-[11px] font-semibold text-gray-500 mb-1">Session Notes</p>
                              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{s.notes}</p>
                            </div>
                          )}
                          {(s.actionItems ?? []).length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold text-gray-500 mb-1">Action Items</p>
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
