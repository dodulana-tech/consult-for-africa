"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Star, Clock, DollarSign, Zap, User, MapPin, ChevronDown, ChevronUp, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { parseApiError } from "@/lib/parse-api-error";

type ScoreBreakdown = {
  expertise: number;
  performance: number;
  availability: number;
  cost: number;
  fit: number;
};

type Match = {
  consultantId: string;
  consultantProfileId: string;
  name: string;
  email: string;
  title: string;
  location: string;
  isDiaspora: boolean;
  tier: string;
  expertiseAreas: string[];
  yearsExperience: number;
  averageRating: number | null;
  totalProjects: number;
  availabilityStatus: string;
  hoursPerWeek: number | null;
  hourlyRateUSD: number | null;
  matchScore: number;
  rankPosition: number;
  scores: ScoreBreakdown;
  explanation: string;
  confidence: number;
};

const TIER_COLORS: Record<string, string> = {
  ELITE: "#7C3AED",
  EXPERIENCED: "#0F2744",
  STANDARD: "#374151",
  EMERGING: "#6B7280",
};

const AVAIL_LABEL: Record<string, string> = {
  AVAILABLE: "Available",
  PARTIALLY_AVAILABLE: "Partial",
  UNAVAILABLE: "Unavailable",
  ON_LEAVE: "On Leave",
};

function ScorePill({ label, score, icon: Icon }: { label: string; score: number; icon: React.ElementType }) {
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon size={12} style={{ color }} />
      <span className="text-[11px] font-semibold" style={{ color }}>{score}%</span>
      <span className="text-[10px] text-gray-400">{label}</span>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{score}%</span>
    </div>
  );
}

interface AssignForm {
  role: string;
  rateAmount: string;
  rateCurrency: "NGN" | "USD";
  rateType: "HOURLY" | "MONTHLY" | "FIXED_PROJECT";
}

interface Props {
  projectId: string;
  projectServiceType: string;
  projectStartDate: string;
  projectEndDate: string;
  isEM: boolean;
}

export default function ConsultantMatchingWidget({ projectId, projectServiceType, projectStartDate, projectEndDate, isEM }: Props) {
  const router = useRouter();
  const CACHE_KEY = `cfa_matching_${projectId}`;

  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [ran, setRan] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState<Record<string, AssignForm>>({});
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [assignError, setAssignError] = useState<Record<string, string>>({});

  // Restore cached results on mount
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { matches: m, totalCandidates: t, assigned: a } = JSON.parse(cached);
        setMatches(m ?? []);
        setTotalCandidates(t ?? 0);
        setAssigned(new Set(a ?? []));
        if (m?.length > 0) setRan(true);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function runMatching() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/match-consultants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, serviceType: projectServiceType }),
      });
      if (!res.ok) {
        const text = await parseApiError(res, "");
        setError(text || "Matching failed. Please try again.");
        return;
      }
      const data = await res.json();
      const newMatches = data.matches ?? [];
      const newTotal = data.totalCandidates ?? 0;
      setMatches(newMatches);
      setTotalCandidates(newTotal);
      setRan(true);
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ matches: newMatches, totalCandidates: newTotal, assigned: [] }));
      } catch {}
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function startAssign(m: Match) {
    setAssigning(m.consultantId);
    setExpanded(null); // Collapse details to avoid layout conflict
    setAssignForm((prev) => ({
      ...prev,
      [m.consultantId]: {
        role: m.title,
        rateAmount: m.hourlyRateUSD ? String(m.hourlyRateUSD) : "",
        rateCurrency: m.hourlyRateUSD ? "USD" : "NGN",
        rateType: "HOURLY",
      },
    }));
    setAssignError((prev) => ({ ...prev, [m.consultantId]: "" }));
  }

  async function confirmAssign(m: Match) {
    const form = assignForm[m.consultantId];
    if (!form?.role?.trim() || !form.rateAmount) {
      setAssignError((prev) => ({ ...prev, [m.consultantId]: "Role and rate are required." }));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultantId: m.consultantId,
          role: form.role,
          rateAmount: parseFloat(form.rateAmount),
          rateCurrency: form.rateCurrency,
          rateType: form.rateType,
          startDate: projectStartDate,
          endDate: projectEndDate,
        }),
      });
      if (!res.ok) {
        const text = await parseApiError(res, "");
        setAssignError((prev) => ({ ...prev, [m.consultantId]: text || "Assignment failed." }));
        return;
      }
      const newAssigned = new Set(assigned).add(m.consultantId);
      setAssigned(newAssigned);
      setAssigning(null);
      // Persist updated assigned set
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const data = JSON.parse(cached);
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, assigned: [...newAssigned] }));
        }
      } catch {}
      // Refresh server data so the Team tab shows the new consultant
      router.refresh();
    } catch {
      setAssignError((prev) => ({ ...prev, [m.consultantId]: "Network error." }));
    } finally {
      setLoading(false);
    }
  }

  if (!isEM) return null;

  return (
    <div className="rounded-xl p-5" style={{ border: "1px solid #e5eaf0", background: "#FAFBFF" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "#0F2744" }}
          >
            <Sparkles size={13} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Nuru Consultant Matching</h3>
            <p className="text-[11px] text-gray-400">Find the best-fit consultants for this project</p>
          </div>
        </div>
        <button
          onClick={runMatching}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-opacity"
          style={{ background: "#0F2744" }}
        >
          <Sparkles size={11} />
          {loading ? "Matching..." : ran ? "Re-run" : "Match Now"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-600 mb-4" style={{ background: "#FEF2F2" }}>
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      {ran && matches.length === 0 && !error && (
        <div className="text-center py-8 text-sm text-gray-400">
          No available consultants found. Check consultant availability statuses.
        </div>
      )}

      {matches.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] text-gray-400">
            Top {matches.length} matches from {totalCandidates} available consultants
          </p>

          {matches.map((m, idx) => (
            <div
              key={m.consultantId}
              className="rounded-xl bg-white overflow-hidden"
              style={{ border: "1px solid #e5eaf0" }}
            >
              {/* Main row */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Rank badge */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: idx === 0 ? "#0F2744" : idx === 1 ? "#374151" : "#9CA3AF" }}
                  >
                    {m.rankPosition}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{m.name}</span>
                      {idx === 0 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ background: "#0F2744" }}>
                          Top Match
                        </span>
                      )}
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                        style={{ background: "#F0F4FF", color: TIER_COLORS[m.tier] ?? "#374151" }}
                      >
                        {m.tier}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{m.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <MapPin size={10} />
                        {m.location}{m.isDiaspora ? " (Diaspora)" : ""}
                      </span>
                      {m.averageRating && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Star size={10} />
                          {m.averageRating.toFixed(1)}/5
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Zap size={10} />
                        {AVAIL_LABEL[m.availabilityStatus] ?? m.availabilityStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-2 italic">{m.explanation}</p>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <div
                      className="text-2xl font-extrabold"
                      style={{ color: m.matchScore >= 80 ? "#10B981" : m.matchScore >= 60 ? "#F59E0B" : "#EF4444" }}
                    >
                      {m.matchScore}%
                    </div>
                    <div className="text-[10px] text-gray-400">match</div>
                  </div>
                </div>

                {/* Score pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-3 pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
                  <ScorePill label="Expertise" score={m.scores.expertise} icon={Star} />
                  <ScorePill label="Track Record" score={m.scores.performance} icon={TrendingUp} />
                  <ScorePill label="Availability" score={m.scores.availability} icon={Clock} />
                  <ScorePill label="Cost Fit" score={m.scores.cost} icon={DollarSign} />
                  <ScorePill label="Overall Fit" score={m.scores.fit} icon={Zap} />
                </div>

                {/* Actions */}
                <div className="mt-3 space-y-2">
                  {assigned.has(m.consultantId) ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                      <CheckCircle size={13} />
                      Assigned successfully
                    </div>
                  ) : assigning === m.consultantId ? (
                    <div className="rounded-lg p-3 space-y-2" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
                      <p className="text-xs font-semibold text-gray-700">Confirm Assignment</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Role title</label>
                          <input
                            type="text"
                            value={assignForm[m.consultantId]?.role ?? ""}
                            onChange={(e) => setAssignForm((prev) => ({ ...prev, [m.consultantId]: { ...prev[m.consultantId], role: e.target.value } }))}
                            className="w-full text-xs rounded-md px-2 py-1.5 focus:outline-none"
                            style={{ border: "1px solid #e5eaf0" }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Rate amount</label>
                          <input
                            type="number"
                            value={assignForm[m.consultantId]?.rateAmount ?? ""}
                            onChange={(e) => setAssignForm((prev) => ({ ...prev, [m.consultantId]: { ...prev[m.consultantId], rateAmount: e.target.value } }))}
                            className="w-full text-xs rounded-md px-2 py-1.5 focus:outline-none"
                            style={{ border: "1px solid #e5eaf0" }}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Currency</label>
                          <select
                            value={assignForm[m.consultantId]?.rateCurrency ?? "USD"}
                            onChange={(e) => setAssignForm((prev) => ({ ...prev, [m.consultantId]: { ...prev[m.consultantId], rateCurrency: e.target.value as "NGN" | "USD" } }))}
                            className="w-full text-xs rounded-md px-2 py-1.5 focus:outline-none"
                            style={{ border: "1px solid #e5eaf0" }}
                          >
                            <option value="USD">USD</option>
                            <option value="NGN">NGN</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Rate type</label>
                          <select
                            value={assignForm[m.consultantId]?.rateType ?? "HOURLY"}
                            onChange={(e) => setAssignForm((prev) => ({ ...prev, [m.consultantId]: { ...prev[m.consultantId], rateType: e.target.value as "HOURLY" | "MONTHLY" | "FIXED_PROJECT" } }))}
                            className="w-full text-xs rounded-md px-2 py-1.5 focus:outline-none"
                            style={{ border: "1px solid #e5eaf0" }}
                          >
                            <option value="HOURLY">Hourly</option>
                            <option value="MONTHLY">Monthly</option>
                            <option value="FIXED_PROJECT">Fixed Project</option>
                          </select>
                        </div>
                      </div>
                      {assignError[m.consultantId] && (
                        <p className="text-[11px] text-red-500">{assignError[m.consultantId]}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => confirmAssign(m)}
                          disabled={loading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                          style={{ background: "#0F2744" }}
                        >
                          {loading ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                          Confirm
                        </button>
                        <button
                          onClick={() => setAssigning(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500"
                          style={{ background: "#F3F4F6" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startAssign(m)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                        style={{ background: "#0F2744" }}
                      >
                        Assign to Project
                      </button>
                      <button
                        onClick={() => setExpanded(expanded === m.consultantId ? null : m.consultantId)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600"
                        style={{ background: "#F3F4F6" }}
                      >
                        {expanded === m.consultantId ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        {expanded === m.consultantId ? "Less" : "Details"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === m.consultantId && (
                <div className="px-4 pb-4 pt-0 space-y-3" style={{ borderTop: "1px solid #F3F4F6" }}>
                  <div className="pt-3">
                    <p className="text-[11px] font-medium text-gray-400 mb-2">Expertise Areas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.expertiseAreas.map((a) => (
                        <span
                          key={a}
                          className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "#F0F4FF", color: "#0F2744" }}
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-medium text-gray-400">Score Breakdown</p>
                    {(Object.entries(m.scores) as [string, number][]).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-500 w-24 capitalize">
                          {key === "fit" ? "Overall Fit" : key}
                        </span>
                        <div className="flex-1">
                          <ScoreBar score={val} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Projects completed</span>
                      <span className="font-medium">{m.totalProjects}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Experience</span>
                      <span className="font-medium">{m.yearsExperience} yrs</span>
                    </div>
                    {m.hoursPerWeek && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Hrs/week available</span>
                        <span className="font-medium">{m.hoursPerWeek}h</span>
                      </div>
                    )}
                    {m.hourlyRateUSD && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rate</span>
                        <span className="font-medium">${m.hourlyRateUSD}/hr</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Nuru confidence</span>
                      <span className="font-medium">{m.confidence}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Re-export icon for use in ScorePill
function TrendingUp({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
