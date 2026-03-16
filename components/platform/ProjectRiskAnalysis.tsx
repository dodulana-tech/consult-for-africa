"use client";

import { useState, useEffect } from "react";
import { Sparkles, AlertTriangle, AlertCircle, CheckCircle2, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";

type Risk = {
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  description: string;
  likelihood: number;
  impact: number;
  earlyWarningSign: string;
  recommendedAction: string;
};

type Analysis = {
  overallRiskScore: number;
  riskLevel: string;
  riskSummary: string;
  risks: Risk[];
  predictedOutcomes: { onTimeDelivery: number; withinBudget: number; clientSatisfaction: number };
  topPriority: string;
  healthScore: number;
};

const SEVERITY_CONFIG = {
  LOW: { bg: "#F0FDF4", border: "#BBF7D0", color: "#15803D", dot: "#22C55E" },
  MEDIUM: { bg: "#FFFBEB", border: "#FDE68A", color: "#B45309", dot: "#F59E0B" },
  HIGH: { bg: "#FFF7ED", border: "#FED7AA", color: "#C2410C", dot: "#F97316" },
  CRITICAL: { bg: "#FEF2F2", border: "#FECACA", color: "#B91C1C", dot: "#EF4444" },
};

function OutcomePill({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? "#10B981" : value >= 55 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-lg font-extrabold" style={{ color }}>{value}%</div>
      <div className="text-[10px] text-gray-400 text-center">{label}</div>
    </div>
  );
}

export default function ProjectRiskAnalysis({ projectId, isEM }: { projectId: string; isEM: boolean }) {
  const CACHE_KEY = `cfa_risk_${projectId}`;
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [expandedRisk, setExpandedRisk] = useState<number | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState("");

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { analysis: a, analyzedAt: t } = JSON.parse(cached);
        if (a) { setAnalysis(a); setAnalyzedAt(t ?? ""); }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (!isEM) return null;

  async function runAnalysis() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/project-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (!res.ok) {
        const status = res.status;
        if (status === 403) {
          setError("You don't have permission to run risk analysis.");
        } else if (status === 500) {
          setError("Nuru is unavailable right now. Please try again shortly or contact support if the issue persists.");
        } else {
          setError("Could not complete the analysis. Please try again.");
        }
        return;
      }
      const data = await res.json();
      setAnalysis(data.analysis);
      setAnalyzedAt(data.analyzedAt);
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ analysis: data.analysis, analyzedAt: data.analyzedAt })); } catch {}
    } catch {
      setError("Could not reach Nuru. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const riskColor =
    analysis?.riskLevel === "CRITICAL" ? "#EF4444"
    : analysis?.riskLevel === "HIGH" ? "#F97316"
    : analysis?.riskLevel === "MEDIUM" ? "#F59E0B"
    : "#10B981";

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e5eaf0", background: "#FAFBFF" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#0F2744" }}>
            <TrendingUp size={11} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">Nuru Risk Analysis</span>
          {analysis && (
            <span
              className="text-[11px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: riskColor }}
            >
              {analysis.riskLevel}
            </span>
          )}
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
          style={{ background: "#0F2744" }}
        >
          <Sparkles size={10} />
          {loading ? "Analyzing..." : analysis ? "Re-analyze" : "Analyze Risk"}
        </button>
      </div>

      {error && (
        <div className="mx-4 mb-3 flex items-center gap-2 p-2.5 rounded-lg text-xs text-red-600" style={{ background: "#FEF2F2" }}>
          <AlertCircle size={11} />
          {error}
        </div>
      )}

      {analysis && (
        <div className="px-5 pb-5 space-y-4">
          {/* Risk meter + health */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-gray-400 mb-1">Risk Score</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold" style={{ color: riskColor }}>
                  {analysis.overallRiskScore}
                </span>
                <span className="text-xs text-gray-400">/100</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 mt-1.5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${analysis.overallRiskScore}%`, background: riskColor }}
                />
              </div>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-1">Health Score</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold" style={{ color: analysis.healthScore >= 7 ? "#10B981" : analysis.healthScore >= 5 ? "#F59E0B" : "#EF4444" }}>
                  {analysis.healthScore}
                </span>
                <span className="text-xs text-gray-400">/10</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <p className="text-xs text-gray-600 leading-relaxed">{analysis.riskSummary}</p>

          {/* Top priority */}
          <div className="rounded-lg p-3" style={{ background: "#F0F4FF", border: "1px solid #C7D7FF" }}>
            <p className="text-[11px] font-semibold text-gray-700 mb-1">Top Priority Action</p>
            <p className="text-xs text-gray-600">{analysis.topPriority}</p>
          </div>

          {/* Predicted outcomes */}
          <div>
            <p className="text-[11px] text-gray-400 mb-2">Predicted Outcomes</p>
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-white p-3" style={{ border: "1px solid #e5eaf0" }}>
              <OutcomePill label="On-Time Delivery" value={analysis.predictedOutcomes.onTimeDelivery} />
              <OutcomePill label="Within Budget" value={analysis.predictedOutcomes.withinBudget} />
              <OutcomePill label="Client Satisfaction" value={analysis.predictedOutcomes.clientSatisfaction} />
            </div>
          </div>

          {/* Risk items */}
          <div>
            <p className="text-[11px] text-gray-400 mb-2">Risk Breakdown ({analysis.risks.length})</p>
            <div className="space-y-2">
              {analysis.risks.map((risk, i) => {
                const cfg = SEVERITY_CONFIG[risk.severity];
                const isOpen = expandedRisk === i;
                return (
                  <div
                    key={i}
                    className="rounded-lg overflow-hidden"
                    style={{ border: `1px solid ${cfg.border}`, background: cfg.bg }}
                  >
                    <button
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                      onClick={() => setExpandedRisk(isOpen ? null : i)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.dot }} />
                        <span className="text-xs font-semibold" style={{ color: cfg.color }}>{risk.title}</span>
                        <span className="text-[10px] text-gray-400">{risk.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium" style={{ color: cfg.color }}>
                          {risk.severity}
                        </span>
                        {isOpen ? <ChevronUp size={11} className="text-gray-400" /> : <ChevronDown size={11} className="text-gray-400" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 space-y-2.5" style={{ borderTop: `1px solid ${cfg.border}` }}>
                        <p className="text-[11px] text-gray-600 pt-2">{risk.description}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] text-gray-400 mb-0.5">Likelihood</p>
                            <div className="h-1.5 rounded-full bg-white">
                              <div className="h-full rounded-full" style={{ width: `${risk.likelihood}%`, background: cfg.dot }} />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">{risk.likelihood}%</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 mb-0.5">Impact</p>
                            <div className="h-1.5 rounded-full bg-white">
                              <div className="h-full rounded-full" style={{ width: `${risk.impact}%`, background: cfg.dot }} />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">{risk.impact}%</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-gray-500 mb-0.5">Watch for:</p>
                          <p className="text-[11px] text-gray-600">{risk.earlyWarningSign}</p>
                        </div>
                        <div className="rounded-lg p-2" style={{ background: "rgba(255,255,255,0.7)" }}>
                          <p className="text-[10px] font-semibold text-gray-700 mb-0.5">Recommended action:</p>
                          <p className="text-[11px] text-gray-600">{risk.recommendedAction}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {analyzedAt && (
            <p className="text-[10px] text-gray-300">
              Analyzed {new Date(analyzedAt).toLocaleTimeString()}. Re-run for updated assessment.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
