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
  coach: Coach;
}

interface Props {
  existingMatch: CoachingMatch | null;
  hasReport: boolean;
  userName: string;
}

export default function CoachingSection({ existingMatch, hasReport, userName }: Props) {
  const router = useRouter();
  const [match, setMatch] = useState<CoachingMatch | null>(existingMatch);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [showBrowse, setShowBrowse] = useState(false);
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
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSelecting(null);
    }
  }

  // Has active match - show coach card
  if (match) {
    const coach = match.coach;
    const progressPct = match.sessionsScheduled > 0
      ? Math.round((match.sessionsCompleted / match.sessionsScheduled) * 100)
      : 0;

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#0F2744" }}>
          Your Coach
        </h2>
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #D4A574, #B8865A)" }}
          >
            {coach.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900">{coach.name}</h3>
            <p className="text-sm text-gray-500">{coach.title}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {coach.certifications.map((c, i) => (
                <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed mb-4">{coach.bio.slice(0, 200)}{coach.bio.length > 200 ? "..." : ""}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {coach.specialisms.map((sp, i) => (
            <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(212,165,116,0.1)", color: "#92400E" }}>
              {sp}
            </span>
          ))}
        </div>

        {/* Session progress */}
        <div className="rounded-lg p-4" style={{ background: "#F9FAFB" }}>
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Sessions completed</span>
            <span>{match.sessionsCompleted} of {match.sessionsScheduled}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${progressPct}%`, background: "#D4A574" }}
            />
          </div>
          {match.startDate && (
            <p className="text-xs text-gray-400 mt-2">
              Programme: {match.programme.replace(/_/g, " ")} | Started{" "}
              {new Date(match.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
    );
  }

  // No match - show browse/select
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
              {coaches.map((coach) => (
                <div
                  key={coach.id}
                  className="rounded-xl border p-5 transition-all hover:shadow-md"
                  style={{ borderColor: selecting === coach.id ? "#D4A574" : "#E5E7EB" }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #D4A574, #B8865A)" }}
                    >
                      {coach.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-gray-900">{coach.name}</h3>
                        <span className="text-xs text-gray-400">{coach.country}{coach.city ? `, ${coach.city}` : ""}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{coach.title} | {coach.yearsExperience} years experience</p>
                      <p className="text-xs text-gray-600 leading-relaxed mb-3">{coach.bio.slice(0, 180)}{coach.bio.length > 180 ? "..." : ""}</p>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {coach.specialisms.slice(0, 4).map((sp, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(212,165,116,0.1)", color: "#92400E" }}>
                            {sp}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        {coach.certifications.map((c, i) => (
                          <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => selectCoach(coach.id)}
                      disabled={selecting !== null}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                      style={{ background: "#0F2744", color: "#fff" }}
                    >
                      {selecting === coach.id ? "Selecting..." : "Select Coach"}
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setShowBrowse(false)}
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
