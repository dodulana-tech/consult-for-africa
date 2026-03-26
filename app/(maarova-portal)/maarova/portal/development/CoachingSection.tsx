"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Coach {
  id: string;
  name: string;
  title: string;
  bio: string;
  specialisms: string[];
  certifications: string[];
  country: string;
  city: string | null;
  yearsExperience: number;
  avatarUrl: string | null;
}

interface CoachingMatch {
  id: string;
  status: string;
  programme: string;
  startDate: string | null;
  endDate: string | null;
  sessionsCompleted: number;
  sessionsScheduled: number;
  nextSessionAt: string | null;
  coach: Coach;
  sessions: { id: string; scheduledAt: string; meetingLink: string | null; status: string }[];
}

interface Props {
  existingMatch: CoachingMatch | null;
  hasReport: boolean;
  userName: string;
}

const PROGRAMME_INFO: Record<string, { label: string; sessions: number; duration: string }> = {
  coaching_lite_3_month: { label: "Coaching Lite", sessions: 6, duration: "3 months" },
  standard_6_month: { label: "Standard Programme", sessions: 12, duration: "6 months" },
  intensive_12_month: { label: "Intensive Programme", sessions: 24, duration: "12 months" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_MATCH: { label: "Chemistry call pending", color: "text-amber-700", bg: "bg-amber-50" },
  MATCHED: { label: "Ready to begin", color: "text-blue-700", bg: "bg-blue-50" },
  ACTIVE: { label: "In progress", color: "text-green-700", bg: "bg-green-50" },
  PAUSED: { label: "Paused", color: "text-gray-600", bg: "bg-gray-100" },
  COMPLETED: { label: "Programme complete", color: "text-green-800", bg: "bg-green-50" },
};

function CoachAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-10 h-10 text-sm", md: "w-14 h-14 text-lg", lg: "w-16 h-16 text-xl" };
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ background: "linear-gradient(135deg, #D4A574, #B8865A)" }}
    >
      {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
    </div>
  );
}

export default function CoachingSection({ existingMatch, hasReport, userName }: Props) {
  const router = useRouter();
  const [match, setMatch] = useState<CoachingMatch | null>(existingMatch);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [showBrowse, setShowBrowse] = useState(false);
  const [viewingCoach, setViewingCoach] = useState<Coach | null>(null);
  const [showCoachProfile, setShowCoachProfile] = useState(false);
  const [showChangeCoach, setShowChangeCoach] = useState(false);
  const [changingCoach, setChangingCoach] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available coaches
  useEffect(() => {
    if (showBrowse && coaches.length === 0) {
      setLoading(true);
      fetch("/api/maarova/coaching/coaches")
        .then((r) => r.json())
        .then((data) => setCoaches(data.coaches ?? []))
        .catch(() => setError("Could not load coaches"))
        .finally(() => setLoading(false));
    }
  }, [showBrowse, coaches.length]);

  async function selectCoach(coachId: string) {
    setSelecting(coachId);
    setError(null);
    try {
      const res = await fetch("/api/maarova/coaching/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId, programme: "standard_6_month" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to select coach");
      setMatch(data.match);
      setShowBrowse(false);
      setViewingCoach(null);
      setShowChangeCoach(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSelecting(null);
    }
  }

  async function handleChangeCoach() {
    if (!match) return;
    setChangingCoach(true);
    setError(null);
    try {
      const res = await fetch(`/api/maarova/coaching/match/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Could not change coach");
      }
      setMatch(null);
      setShowBrowse(true);
      setShowChangeCoach(false);
      setCoaches([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setChangingCoach(false);
    }
  }

  // Can change coach: before programme starts OR within first 2 sessions (one free switch)
  const canChangeCoach = match && (
    match.status === "PENDING_MATCH" ||
    match.status === "MATCHED" ||
    (match.status === "ACTIVE" && match.sessionsCompleted <= 2)
  );

  // ─── ACTIVE ENGAGEMENT VIEW ───
  if (match) {
    const coach = match.coach;
    const programme = PROGRAMME_INFO[match.programme] ?? {
      label: match.programme.replace(/_/g, " "),
      sessions: match.sessionsScheduled || 12,
      duration: "6 months",
    };
    const statusCfg = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.ACTIVE;
    const totalSessions = match.sessionsScheduled || programme.sessions;
    const progressPct = totalSessions > 0
      ? Math.round((match.sessionsCompleted / totalSessions) * 100)
      : 0;

    const isPending = match.status === "PENDING_MATCH";
    const isMatched = match.status === "MATCHED";
    const isActive = match.status === "ACTIVE";
    const isCompleted = match.status === "COMPLETED";

    // Programme journey steps
    const journeySteps = [
      { label: "Coach selected", done: true },
      { label: "Chemistry call", done: !isPending },
      { label: "Session 1: Goal setting", done: isActive && match.sessionsCompleted >= 1 || isCompleted },
      { label: `Sessions 2-${totalSessions - 2}: Development`, done: isActive && match.sessionsCompleted >= 2 || isCompleted },
      { label: `Session ${totalSessions - 1}: Progress review`, done: match.sessionsCompleted >= totalSessions - 1 || isCompleted },
      { label: `Session ${totalSessions}: Integration`, done: isCompleted },
    ];

    // Coach profile detail overlay
    if (showCoachProfile) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <button
            onClick={() => setShowCoachProfile(false)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to engagement
          </button>

          <div className="flex items-start gap-5 mb-6">
            <CoachAvatar name={coach.name} size="lg" />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900">{coach.name}</h3>
              <p className="text-sm text-gray-500">{coach.title}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {coach.country}{coach.city ? `, ${coach.city}` : ""}
                </span>
                <span>{coach.yearsExperience} years experience</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">About</h4>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{coach.bio}</p>
          </div>

          {(coach.specialisms ?? []).length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Specialisms</h4>
              <div className="flex flex-wrap gap-2">
                {coach.specialisms.map((sp, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(212,165,116,0.1)", color: "#92400E" }}>
                    {sp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(coach.certifications ?? []).length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Certifications</h4>
              <div className="flex flex-wrap gap-2">
                {coach.certifications.map((c, i) => (
                  <span key={i} className="text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Change coach confirmation
    if (showChangeCoach) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "#0F2744" }}>Change Coach</h2>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">{error}</div>
          )}

          <div className="rounded-lg border p-4 mb-4" style={{ borderColor: "#e5eaf0" }}>
            <div className="flex items-center gap-3 mb-3">
              <CoachAvatar name={coach.name} size="sm" />
              <div>
                <p className="text-sm font-medium text-gray-900">{coach.name}</p>
                <p className="text-xs text-gray-500">{coach.title}</p>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p>
                {isPending
                  ? "Your chemistry call has not taken place yet. You can switch to a different coach with no impact to your programme."
                  : isMatched
                    ? "Your chemistry call is complete but sessions have not started. You can switch coaches before your programme begins."
                    : `You have completed ${match.sessionsCompleted} of ${totalSessions} sessions. You have one free coach switch available within the first 2 sessions.`
                }
              </p>
            </div>
          </div>

          <div className="rounded-lg p-3 mb-4" style={{ background: "#FEF3C7" }}>
            <p className="text-xs text-amber-800">
              {match.sessionsCompleted > 0
                ? "Switching coaches will end your current engagement. Your completed session records will be preserved, and your new coach will have access to your assessment summary."
                : "Your current match will be cancelled and you will be able to select a new coach."
              }
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleChangeCoach}
              disabled={changingCoach}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: "#DC2626" }}
            >
              {changingCoach ? "Changing..." : "Confirm Change"}
            </button>
            <button
              onClick={() => { setShowChangeCoach(false); setError(null); }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border transition-colors"
              style={{ borderColor: "#e5eaf0" }}
            >
              Keep Current Coach
            </button>
          </div>
        </div>
      );
    }

    // Main engagement view
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Header with status */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold" style={{ color: "#0F2744" }}>
            Your Coaching Engagement
          </h2>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">{error}</div>
        )}

        {/* Coach card */}
        <div className="flex items-start gap-4 mb-5">
          <CoachAvatar name={coach.name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">{coach.name}</h3>
                <p className="text-sm text-gray-500">{coach.title}</p>
              </div>
              <button
                onClick={() => setShowCoachProfile(true)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
                style={{ borderColor: "#e5eaf0", color: "#0F2744" }}
              >
                View Profile
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(coach.certifications ?? []).map((c, i) => (
                <span key={i} className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {c}
                </span>
              ))}
              <span className="text-xs text-gray-400">
                {coach.country}{coach.city ? `, ${coach.city}` : ""} | {coach.yearsExperience}yr exp
              </span>
            </div>
          </div>
        </div>

        {/* Chemistry call prompt */}
        {isPending && (
          <div
            className="rounded-lg p-4 mb-5 border"
            style={{ background: "#D4A574" + "08", borderColor: "#D4A574" + "30" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "#D4A574" + "20" }}>
                <svg className="w-4 h-4" style={{ color: "#D4A574" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                  Next step: Chemistry call
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  A 15-minute introductory Google Meet call with {coach.name.split(" ")[0]} to ensure a good fit before
                  your coaching programme begins. Your coach will reach out to schedule this call.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Not the right fit? You can switch coaches at any time before your programme starts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ready to begin prompt */}
        {isMatched && (
          <div
            className="rounded-lg p-4 mb-5 border"
            style={{ background: "#EFF6FF", borderColor: "#BFDBFE" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900">
                  Chemistry call complete
                </h4>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  Great news! Your chemistry call went well. {coach.name.split(" ")[0]} is preparing
                  for your first session where you will review your assessment together and set 2-3 development goals.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Next session */}
        {(() => {
          const nextSession = (match.sessions ?? []).find((s) => s.status === "SCHEDULED");
          if (!nextSession || isPending) return null;
          return (
            <div
              className="rounded-lg p-4 mb-5 border"
              style={{ background: "#0F2744" + "05", borderColor: "#0F2744" + "15" }}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "#0F2744" + "10" }}>
                  <svg className="w-4 h-4" style={{ color: "#0F2744" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                    Next session: {new Date(nextSession.scheduledAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </h4>
                  {nextSession.meetingLink ? (
                    <a
                      href={nextSession.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline mt-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Join Google Meet
                    </a>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">Meeting link will be shared by your coach</p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Programme overview */}
        <div className="rounded-lg p-4 mb-5" style={{ background: "#F9FAFB" }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Programme</h4>
            <span className="text-xs font-medium" style={{ color: "#0F2744" }}>{programme.label}</span>
          </div>

          {/* Session progress */}
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Sessions completed</span>
            <span>{match.sessionsCompleted} of {totalSessions}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 mb-3">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${progressPct}%`, background: isCompleted ? "#16a34a" : "#D4A574" }}
            />
          </div>

          {/* Programme details */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>{totalSessions}</p>
              <p className="text-xs text-gray-400">Sessions</p>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>{programme.duration}</p>
              <p className="text-xs text-gray-400">Duration</p>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>Biweekly</p>
              <p className="text-xs text-gray-400">Cadence</p>
            </div>
          </div>

          {match.startDate && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              Started {new Date(match.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              {match.endDate && (
                <> | Ends {new Date(match.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</>
              )}
            </p>
          )}
        </div>

        {/* Journey tracker */}
        {(isPending || isMatched || (isActive && match.sessionsCompleted < totalSessions)) && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Your Journey</h4>
            <div className="space-y-0">
              {journeySteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        step.done ? "border-green-500 bg-green-500" : "border-gray-300 bg-white"
                      }`}
                    >
                      {step.done && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {i < journeySteps.length - 1 && (
                      <div className={`w-0.5 h-6 ${step.done ? "bg-green-300" : "bg-gray-200"}`} />
                    )}
                  </div>
                  <p className={`text-xs pt-0.5 ${step.done ? "text-gray-500" : "text-gray-400"}`}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed programme */}
        {isCompleted && (
          <div
            className="rounded-lg p-4 mb-5 border"
            style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-green-900">Programme Complete</h4>
                <p className="text-xs text-green-700 mt-1 leading-relaxed">
                  Congratulations, {userName.split(" ")[0]}! You have completed your {programme.label} with {coach.name.split(" ")[0]}.
                  Your session records and development goals remain available for your reference.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {canChangeCoach && (
          <div className="pt-4 border-t" style={{ borderColor: "#e5eaf0" }}>
            <button
              onClick={() => setShowChangeCoach(true)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isPending ? "Choose a different coach" : "Request coach change"}
            </button>
            {isActive && match.sessionsCompleted > 0 && (
              <p className="text-xs text-gray-300 mt-1">
                One free switch available within the first 2 sessions
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── NO MATCH: BROWSE & SELECT ───
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-2" style={{ color: "#0F2744" }}>
        Leadership Coaching
      </h2>

      {!hasReport ? (
        <p className="text-sm text-gray-500">
          Complete your assessment to be matched with a leadership coach tailored to your development needs.
        </p>
      ) : !showBrowse ? (
        <div>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Your assessment is complete. Select a coach to begin your leadership development journey.
            Our coaches are experienced healthcare leadership specialists who will work with your
            assessment insights to accelerate your growth.
          </p>

          {/* What to expect */}
          <div className="rounded-lg p-4 mb-4" style={{ background: "#F9FAFB" }}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">How it works</h4>
            <div className="space-y-2">
              {[
                "Browse coach profiles and select one that resonates with your development needs",
                "Have a 15-minute chemistry call to ensure a good fit",
                "Begin your programme with a goal-setting session based on your assessment",
                "Meet biweekly via Google Meet for structured coaching sessions over 6 months",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                    style={{ background: "#D4A574" + "20", color: "#92400E" }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-xs text-gray-600">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowBrowse(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
            style={{ background: "#D4A574", color: "#06090f" }}
          >
            Browse Coaches
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Select a coach to begin your engagement. You will have a chemistry call before sessions start.
          </p>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
            </div>
          ) : coaches.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No coaches available at the moment. Please check back soon.
            </p>
          ) : (
            <div className="space-y-4">
              {viewingCoach ? (
                /* Coach Detail View */
                <div className="rounded-xl border p-6" style={{ borderColor: "#E5E7EB" }}>
                  <button
                    onClick={() => setViewingCoach(null)}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to coaches
                  </button>

                  <div className="flex items-start gap-5 mb-6">
                    <CoachAvatar name={viewingCoach.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900">{viewingCoach.name}</h3>
                      <p className="text-sm text-gray-500">{viewingCoach.title}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {viewingCoach.country}{viewingCoach.city ? `, ${viewingCoach.city}` : ""}
                        </span>
                        <span>{viewingCoach.yearsExperience} years experience</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">About</h4>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{viewingCoach.bio}</p>
                  </div>

                  {(viewingCoach.specialisms ?? []).length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Specialisms</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingCoach.specialisms.map((sp, i) => (
                          <span key={i} className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(212,165,116,0.1)", color: "#92400E" }}>
                            {sp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(viewingCoach.certifications ?? []).length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Certifications</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingCoach.certifications.map((c, i) => (
                          <span key={i} className="text-xs font-medium px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t" style={{ borderColor: "#e5eaf0" }}>
                    <button
                      onClick={() => selectCoach(viewingCoach.id)}
                      disabled={selecting !== null}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-50"
                      style={{ background: "#0F2744", color: "#fff" }}
                    >
                      {selecting === viewingCoach.id ? "Selecting..." : "Select as Your Coach"}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-2">
                      You will have a chemistry call before sessions begin
                    </p>
                  </div>
                </div>
              ) : (
                /* Coach browse list */
                <>
                  {coaches.map((coach) => (
                    <div
                      key={coach.id}
                      className="rounded-xl border p-5 transition-all hover:shadow-md cursor-pointer"
                      style={{ borderColor: selecting === coach.id ? "#D4A574" : "#E5E7EB" }}
                      onClick={() => setViewingCoach(coach)}
                    >
                      <div className="flex items-start gap-4">
                        <CoachAvatar name={coach.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-bold text-gray-900">{coach.name}</h3>
                            <span className="text-xs text-gray-400">{coach.country}{coach.city ? `, ${coach.city}` : ""}</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">{coach.title} | {coach.yearsExperience} years experience</p>
                          <p className="text-xs text-gray-600 leading-relaxed mb-3">{coach.bio.slice(0, 180)}{coach.bio.length > 180 ? "..." : ""}</p>

                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {(coach.specialisms ?? []).slice(0, 4).map((sp, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(212,165,116,0.1)", color: "#92400E" }}>
                                {sp}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            {(coach.certifications ?? []).map((c, i) => (
                              <span key={i} className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                          View full profile
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); selectCoach(coach.id); }}
                          disabled={selecting !== null}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                          style={{ background: "#0F2744", color: "#fff" }}
                        >
                          {selecting === coach.id ? "Selecting..." : "Select Coach"}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              <button
                onClick={() => { setShowBrowse(false); setViewingCoach(null); }}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
