"use client";

import { useState, useEffect } from "react";
import { Sparkles, AlertTriangle, CheckCircle2, RotateCcw, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

type CriterionScore = { score: number; feedback: string };

type AIScore = {
  scores: {
    technical: CriterionScore;
    actionability: CriterionScore;
    nigerianContext: CriterionScore;
    clientReady: CriterionScore;
  };
  overallScore: number;
  overallAssessment: string;
  redFlags: string[];
  recommendation: "APPROVE" | "REVISE" | "NEEDS_WORK";
  suggestedImprovements: string[];
};

const CRITERION_LABELS: Record<string, string> = {
  technical: "Technical Quality",
  actionability: "Actionability",
  nigerianContext: "Nigerian Context",
  clientReady: "Client-Ready",
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 4 ? "#10B981" : score >= 3 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100">
        <div className="h-full rounded-full" style={{ width: `${(score / 5) * 100}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-6" style={{ color }}>{score}/5</span>
    </div>
  );
}

const RECOMMENDATION_CONFIG = {
  APPROVE: { label: "Nuru recommends: Approve", bg: "#ECFDF5", border: "#A7F3D0", color: "#059669", icon: CheckCircle2 },
  REVISE: { label: "Nuru recommends: Request Revision", bg: "#FFFBEB", border: "#FDE68A", color: "#D97706", icon: RotateCcw },
  NEEDS_WORK: { label: "Nuru recommends: Needs Major Work", bg: "#FEF2F2", border: "#FECACA", color: "#DC2626", icon: AlertTriangle },
};

export default function AIQualityScore({ deliverableId, onScoresLoaded }: {
  deliverableId: string;
  onScoresLoaded?: (scores: Record<string, number>) => void;
}) {
  const CACHE_KEY = `cfa_quality_${deliverableId}`;
  const [loading, setLoading] = useState(false);
  const [aiScore, setAiScore] = useState<AIScore | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const score = JSON.parse(cached);
        setAiScore(score);
        if (onScoresLoaded && score?.scores) {
          onScoresLoaded({
            technical: score.scores.technical.score,
            actionability: score.scores.actionability.score,
            context: score.scores.nigerianContext.score,
            clientReady: score.scores.clientReady.score,
          });
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliverableId]);

  async function runScoring() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/score-deliverable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliverableId }),
      });
      if (!res.ok) {
        setError(await res.text().catch(() => "Scoring failed."));
        return;
      }
      const data = await res.json();
      setAiScore(data.score);
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.score)); } catch {}

      if (onScoresLoaded) {
        onScoresLoaded({
          technical: data.score.scores.technical.score,
          actionability: data.score.scores.actionability.score,
          context: data.score.scores.nigerianContext.score,
          clientReady: data.score.scores.clientReady.score,
        });
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const recConfig = aiScore ? RECOMMENDATION_CONFIG[aiScore.recommendation] : null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e5eaf0", background: "#FAFBFF" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#0F2744" }}>
            <Sparkles size={11} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">Nuru Quality Pre-Score</span>
          {aiScore && (
            <span
              className="text-[11px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: aiScore.overallScore >= 4 ? "#10B981" : aiScore.overallScore >= 3 ? "#F59E0B" : "#EF4444" }}
            >
              {aiScore.overallScore.toFixed(1)}/5
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {aiScore && (
            <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          <button
            onClick={runScoring}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: "#0F2744" }}
          >
            <Sparkles size={10} />
            {loading ? "Scoring..." : aiScore ? "Re-score" : "Pre-Score"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-3 flex items-center gap-2 p-2.5 rounded-lg text-xs text-red-600" style={{ background: "#FEF2F2" }}>
          <AlertCircle size={11} />
          {error}
        </div>
      )}

      {aiScore && expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Recommendation banner */}
          {recConfig && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: recConfig.bg, border: `1px solid ${recConfig.border}`, color: recConfig.color }}
            >
              <recConfig.icon size={14} />
              {recConfig.label}
            </div>
          )}

          {/* Overall assessment */}
          <p className="text-xs text-gray-600 leading-relaxed">{aiScore.overallAssessment}</p>

          {/* Criterion scores */}
          <div className="space-y-3">
            {(Object.entries(aiScore.scores) as [string, CriterionScore][]).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-medium text-gray-700">{CRITERION_LABELS[key] ?? key}</span>
                </div>
                <ScoreBar score={val.score} />
                <p className="text-[11px] text-gray-400 mt-0.5">{val.feedback}</p>
              </div>
            ))}
          </div>

          {/* Red flags */}
          {aiScore.redFlags.length > 0 && (
            <div className="rounded-lg p-3 space-y-1.5" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
                <AlertTriangle size={11} /> Red Flags
              </p>
              {aiScore.redFlags.map((flag, i) => (
                <p key={i} className="text-[11px] text-red-600">{flag}</p>
              ))}
            </div>
          )}

          {/* Improvements */}
          {aiScore.suggestedImprovements.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Suggested Improvements</p>
              <ul className="space-y-1">
                {aiScore.suggestedImprovements.map((s, i) => (
                  <li key={i} className="text-[11px] text-gray-500 flex items-start gap-1.5">
                    <span className="mt-0.5 w-3 h-3 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: "#6B7280" }}>
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[10px] text-gray-300">
            Nuru assessment based on deliverable description. Use as a starting point, not a final decision.
          </p>
        </div>
      )}
    </div>
  );
}
