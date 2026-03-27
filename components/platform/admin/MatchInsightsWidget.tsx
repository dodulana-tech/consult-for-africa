"use client";

import { useState } from "react";
import { formatEnumLabel } from "@/lib/utils";

interface ScoreBreakdown {
  expertiseMatch: number;
  tierFit: number;
  availability: number;
  trackRecord: number;
}

interface MatchResult {
  consultantId: string;
  matchScore: number;
  scoreBreakdown: ScoreBreakdown;
  anonymisedProfile: {
    tier: string;
    yearsExperience: number;
    expertiseAreas: string[];
    bioSnippet: string;
    rating: number | null;
  };
  capacityWarning?: boolean;
  currentUtilisation?: number;
}

interface Props {
  requestId: string;
  requestStatus: string;
}

const SCORE_COLOR = (score: number) => {
  if (score >= 75) return "#10B981";
  if (score >= 50) return "#F59E0B";
  if (score >= 25) return "#F97316";
  return "#EF4444";
};

const TIER_LABELS: Record<string, string> = {
  ELITE: "Elite",
  EXPERIENCED: "Experienced",
  STANDARD: "Standard",
  EMERGING: "Emerging",
  INTERN: "Intern",
};

export default function MatchInsightsWidget({ requestId, requestStatus }: Props) {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSuggest = ["SUBMITTED", "MATCHING"].includes(requestStatus);
  if (!canSuggest) return null;

  const handleSuggest = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/partner-requests/${requestId}/suggest`);
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Failed to load suggestions");
        return;
      }
      const data = await res.json();
      setMatches(data.matches || []);
      setLoaded(true);
    } catch {
      setError("Network error loading suggestions");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSendShortlist = async () => {
    if (selected.size === 0) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/partner-requests/${requestId}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultantIds: Array.from(selected) }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Failed to send shortlist");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error sending shortlist");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div
        className="rounded-xl p-4 mt-3"
        style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
      >
        <p className="text-sm font-medium" style={{ color: "#065F46" }}>
          Shortlist sent successfully with {selected.size} consultant{selected.size !== 1 ? "s" : ""}.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      {!loaded && (
        <button
          onClick={handleSuggest}
          disabled={loading}
          className="text-xs font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}
        >
          {loading ? "Finding matches..." : "Suggest Matches"}
        </button>
      )}

      {error && (
        <p className="text-xs mt-2" style={{ color: "#DC2626" }}>{error}</p>
      )}

      {loaded && matches.length === 0 && (
        <p className="text-xs text-gray-400 mt-2">No matching consultants found.</p>
      )}

      {loaded && matches.length > 0 && (
        <div className="space-y-2 mt-3">
          <p className="text-xs font-medium text-gray-500">
            {matches.length} match{matches.length !== 1 ? "es" : ""} found
          </p>

          {matches.map((m, idx) => {
            const scoreColor = SCORE_COLOR(m.matchScore);
            const isSelected = selected.has(m.consultantId);

            return (
              <div
                key={m.consultantId}
                className="rounded-xl p-4 bg-white"
                style={{
                  border: isSelected ? "2px solid #1D4ED8" : "1px solid #e5eaf0",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(m.consultantId)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-xs font-semibold text-gray-400">
                        #{idx + 1}
                      </span>
                    </label>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "#EFF6FF", color: "#1D4ED8" }}
                        >
                          {TIER_LABELS[m.anonymisedProfile.tier] || m.anonymisedProfile.tier}
                        </span>
                        <span className="text-xs text-gray-500">
                          {m.anonymisedProfile.yearsExperience} years
                        </span>
                        {m.anonymisedProfile.rating && (
                          <span className="text-xs text-gray-500">
                            {m.anonymisedProfile.rating.toFixed(1)}/5.0
                          </span>
                        )}
                        {m.capacityWarning && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "#FEF3C7", color: "#92400E" }}
                          >
                            {m.currentUtilisation}% utilisation
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {m.anonymisedProfile.bioSnippet}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {m.anonymisedProfile.expertiseAreas.slice(0, 4).map((area) => (
                          <span
                            key={area}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-500"
                          >
                            {formatEnumLabel(area)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="text-right shrink-0" style={{ width: 60 }}>
                    <p className="text-sm font-bold" style={{ color: scoreColor }}>
                      {m.matchScore}
                    </p>
                    <div
                      className="h-1.5 rounded-full mt-1"
                      style={{ background: "#F3F4F6", width: 60 }}
                    >
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          background: scoreColor,
                          width: `${m.matchScore}%`,
                        }}
                      />
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      {Object.entries(m.scoreBreakdown).map(([key, val]) => (
                        <div key={key} className="flex items-center gap-1 justify-end">
                          <span className="text-[9px] text-gray-400 capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <span className="text-[9px] font-medium text-gray-600">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-400">
              {selected.size} selected
            </p>
            <button
              onClick={handleSendShortlist}
              disabled={selected.size === 0 || sending}
              className="text-xs font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "#D4AF37", color: "#0F2744" }}
            >
              {sending ? "Sending..." : "Send Shortlist"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
