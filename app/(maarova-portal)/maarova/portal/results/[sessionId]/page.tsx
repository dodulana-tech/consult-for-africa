"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModuleResponse {
  id: string;
  moduleId: string;
  moduleName: string;
  moduleType: string;
  moduleSlug: string;
  status: string;
  scaledScores: Record<string, number> | null;
  completedAt: string | null;
  timeSpentSeconds: number | null;
}

interface CoachingPriority {
  priority: number;
  title: string;
  description: string;
  suggestedActions: string[];
  timeframe: string;
}

interface ReportData {
  id: string;
  status: string;
  overallScore: number | null;
  dimensionScores: Record<string, number> | null;
  radarChartData: { dimension: string; score: number; benchmark: number }[] | null;
  benchmarkComparisons: unknown;
  executiveSummary: string | null;
  strengthsAnalysis: string | null;
  developmentAreas: string | null;
  blindSpotAnalysis: string | null;
  coachingPriorities: CoachingPriority[] | null;
  leadershipArchetype: string | null;
  fullReportContent: {
    archetypeDescription?: string;
    dimensionInterpretations?: Record<string, string>;
  } | null;
  generatedAt: string | null;
  pdfUrl: string | null;
}

interface SessionData {
  id: string;
  status: string;
  stream: string;
  completedAt: string | null;
  totalTimeMinutes: number | null;
  moduleResponses: ModuleResponse[];
}

// ─── Radar Chart ──────────────────────────────────────────────────────────────

function RadarChart({
  data,
}: {
  data: { dimension: string; score: number; benchmark: number }[];
}) {
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = 150;
  const levels = 5;

  const angleSlice = (Math.PI * 2) / data.length;

  function polarToCartesian(angle: number, radius: number) {
    // Start from top (subtract PI/2)
    const a = angle - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(a),
      y: cy + radius * Math.sin(a),
    };
  }

  // Grid circles
  const gridCircles = Array.from({ length: levels }, (_, i) => {
    const r = (maxRadius / levels) * (i + 1);
    return (
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={1}
        strokeDasharray={i < levels - 1 ? "2,3" : "none"}
      />
    );
  });

  // Axis lines and labels
  const axes = data.map((d, i) => {
    const angle = angleSlice * i;
    const end = polarToCartesian(angle, maxRadius);
    const labelPos = polarToCartesian(angle, maxRadius + 28);

    // Truncate long dimension names
    const label =
      d.dimension.length > 20
        ? d.dimension.slice(0, 18) + "..."
        : d.dimension;

    return (
      <g key={i}>
        <line
          x1={cx}
          y1={cy}
          x2={end.x}
          y2={end.y}
          stroke="#d1d5db"
          strokeWidth={1}
        />
        <text
          x={labelPos.x}
          y={labelPos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[10px]"
          fill="#6b7280"
        >
          {label}
        </text>
      </g>
    );
  });

  // Score polygon (gold)
  const scorePoints = data
    .map((d, i) => {
      const angle = angleSlice * i;
      const r = (d.score / 100) * maxRadius;
      const p = polarToCartesian(angle, r);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  // Benchmark polygon (gray)
  const benchmarkPoints = data
    .map((d, i) => {
      const angle = angleSlice * i;
      const r = (d.benchmark / 100) * maxRadius;
      const p = polarToCartesian(angle, r);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  // Score dots
  const scoreDots = data.map((d, i) => {
    const angle = angleSlice * i;
    const r = (d.score / 100) * maxRadius;
    const p = polarToCartesian(angle, r);
    return (
      <circle key={i} cx={p.x} cy={p.y} r={4} fill="#D4A574" stroke="#fff" strokeWidth={2} />
    );
  });

  // Level labels (0, 20, 40, 60, 80, 100)
  const levelLabels = Array.from({ length: levels }, (_, i) => {
    const val = ((i + 1) / levels) * 100;
    const r = (maxRadius / levels) * (i + 1);
    return (
      <text
        key={i}
        x={cx + 4}
        y={cy - r - 2}
        className="text-[9px]"
        fill="#9ca3af"
      >
        {val}
      </text>
    );
  });

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[420px]"
        role="img"
        aria-label="Leadership profile radar chart"
      >
        {gridCircles}
        {levelLabels}
        {axes}

        {/* Benchmark area */}
        <polygon
          points={benchmarkPoints}
          fill="rgba(156, 163, 175, 0.12)"
          stroke="#9ca3af"
          strokeWidth={1.5}
          strokeDasharray="4,3"
        />

        {/* Score area */}
        <polygon
          points={scorePoints}
          fill="rgba(212, 165, 116, 0.2)"
          stroke="#D4A574"
          strokeWidth={2.5}
        />

        {scoreDots}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 rounded" style={{ backgroundColor: "#D4A574" }} />
          <span className="text-xs text-gray-600">Your Score</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-0.5 rounded"
            style={{
              backgroundColor: "#9ca3af",
              borderTop: "1px dashed #9ca3af",
            }}
          />
          <span className="text-xs text-gray-600">Benchmark</span>
        </div>
      </div>
    </div>
  );
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, score }: { label: string; score: number }) {
  const colour =
    score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444";
  const bgColour =
    score >= 70
      ? "rgba(34,197,94,0.1)"
      : score >= 40
        ? "rgba(245,158,11,0.1)"
        : "rgba(239,68,68,0.1)";

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-semibold" style={{ color: colour }}>
          {score}
        </span>
      </div>
      <div className="w-full h-2.5 rounded-full" style={{ backgroundColor: bgColour }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: colour }}
        />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MaarovaResultDetailPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/maarova/reports/${sessionId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load results");
      }
      const data = await res.json();
      setSession(data.session);
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load results");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function generateReport() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/maarova/reports/${sessionId}/generate`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate report");
      }
      const data = await res.json();
      setReport({
        ...data.report,
        fullReportContent: data.report.fullReportContent,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate report"
      );
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-4 bg-gray-200 rounded w-96" />
          <div className="h-[400px] bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  const reportReady = report && report.status === "READY";
  const fullContent = report?.fullReportContent as {
    archetypeDescription?: string;
    dimensionInterpretations?: Record<string, string>;
  } | null;

  return (
    <div className="p-8 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <a
            href="/maarova/portal/results"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </a>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#0F2744" }}
          >
            Leadership Profile
          </h1>
        </div>
        {session?.completedAt && (
          <p className="text-gray-500 text-sm ml-8">
            Assessment completed on{" "}
            {new Date(session.completedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Report not ready: generate prompt */}
      {!reportReady && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: "rgba(212,165,116,0.15)" }}
          >
            <svg
              className="w-10 h-10"
              style={{ color: "#D4A574" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: "#0F2744" }}
          >
            Generate Your Leadership Report
          </h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Our AI will analyse your assessment scores and generate a detailed
            leadership profile report with personalised insights.
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 max-w-md mx-auto">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          <button
            onClick={generateReport}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-60"
            style={{ backgroundColor: "#D4A574" }}
          >
            {generating ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generating Report...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Generate Report
              </>
            )}
          </button>
        </div>
      )}

      {/* Report content */}
      {reportReady && report && (
        <div className="space-y-6">
          {/* Top summary row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overall Score */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                Overall Score
              </p>
              <p
                className="text-5xl font-bold"
                style={{ color: "#0F2744" }}
              >
                {report.overallScore ?? "--"}
              </p>
              <p className="text-sm text-gray-400 mt-1">out of 100</p>
            </div>

            {/* Leadership Archetype */}
            <div
              className="bg-white rounded-xl border border-gray-200 p-6 text-center col-span-1 md:col-span-2"
              style={{ borderLeft: "4px solid #D4A574" }}
            >
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                Leadership Archetype
              </p>
              <p
                className="text-2xl font-bold mb-2"
                style={{ color: "#D4A574" }}
              >
                {report.leadershipArchetype ?? "Not classified"}
              </p>
              {fullContent?.archetypeDescription && (
                <p className="text-sm text-gray-600 max-w-lg mx-auto">
                  {fullContent.archetypeDescription}
                </p>
              )}
            </div>
          </div>

          {/* Radar Chart */}
          {report.radarChartData && report.radarChartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: "#0F2744" }}
              >
                Leadership Profile
              </h2>
              <RadarChart data={report.radarChartData} />
            </div>
          )}

          {/* Executive Summary */}
          {report.executiveSummary && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2
                className="text-lg font-bold mb-3"
                style={{ color: "#0F2744" }}
              >
                Executive Summary
              </h2>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                {report.executiveSummary.split("\n\n").map((p, i) => (
                  <p key={i} className="mb-3 last:mb-0">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Dimension Breakdown */}
          {session?.moduleResponses && session.moduleResponses.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2
                className="text-lg font-bold mb-5"
                style={{ color: "#0F2744" }}
              >
                Dimension Breakdown
              </h2>
              <div className="space-y-6">
                {session.moduleResponses.map((mr) => {
                  const scores = mr.scaledScores;
                  if (!scores) return null;
                  const values = Object.values(scores);
                  const avg =
                    values.length > 0
                      ? Math.round(
                          values.reduce((a, b) => a + b, 0) / values.length
                        )
                      : 0;

                  const interpretation =
                    fullContent?.dimensionInterpretations?.[mr.moduleName];

                  return (
                    <div
                      key={mr.id}
                      className="border-b border-gray-100 pb-5 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">
                          {mr.moduleName}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xl font-bold"
                            style={{
                              color:
                                avg >= 70
                                  ? "#22c55e"
                                  : avg >= 40
                                    ? "#f59e0b"
                                    : "#ef4444",
                            }}
                          >
                            {avg}
                          </span>
                          <span className="text-sm text-gray-400">/100</span>
                        </div>
                      </div>

                      {/* Sub-dimension bars */}
                      <div className="pl-1">
                        {Object.entries(scores).map(([dim, score]) => (
                          <ScoreBar key={dim} label={dim} score={score} />
                        ))}
                      </div>

                      {/* AI interpretation */}
                      {interpretation && (
                        <p className="text-sm text-gray-600 mt-3 pl-1 italic">
                          {interpretation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strengths and Development Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            {report.strengthsAnalysis && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(34,197,94,0.1)" }}
                  >
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2
                    className="text-lg font-bold"
                    style={{ color: "#0F2744" }}
                  >
                    Strengths
                  </h2>
                </div>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                  {report.strengthsAnalysis.split("\n\n").map((p, i) => (
                    <p key={i} className="mb-3 last:mb-0">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Development Areas */}
            {report.developmentAreas && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(245,158,11,0.1)" }}
                  >
                    <svg
                      className="w-4 h-4 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <h2
                    className="text-lg font-bold"
                    style={{ color: "#0F2744" }}
                  >
                    Development Areas
                  </h2>
                </div>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                  {report.developmentAreas.split("\n\n").map((p, i) => (
                    <p key={i} className="mb-3 last:mb-0">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Blind Spot Analysis */}
          {report.blindSpotAnalysis && (
            <div
              className="bg-white rounded-xl border border-gray-200 p-6"
              style={{ borderLeft: "4px solid #0F2744" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "rgba(15,39,68,0.08)" }}
                >
                  <svg
                    className="w-4 h-4"
                    style={{ color: "#0F2744" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <h2
                  className="text-lg font-bold"
                  style={{ color: "#0F2744" }}
                >
                  Blind Spot Analysis
                </h2>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                {report.blindSpotAnalysis.split("\n\n").map((p, i) => (
                  <p key={i} className="mb-3 last:mb-0">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Coaching Priorities */}
          {report.coachingPriorities &&
            report.coachingPriorities.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2
                  className="text-lg font-bold mb-5"
                  style={{ color: "#0F2744" }}
                >
                  Coaching Priorities
                </h2>
                <div className="space-y-4">
                  {report.coachingPriorities.map((cp, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-100 rounded-lg p-5 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                          style={{ backgroundColor: "#D4A574" }}
                        >
                          {cp.priority ?? idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {cp.title}
                            </h3>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                              {cp.timeframe}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {cp.description}
                          </p>
                          {cp.suggestedActions &&
                            cp.suggestedActions.length > 0 && (
                              <div className="space-y-1.5">
                                <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                                  Suggested Actions
                                </p>
                                {cp.suggestedActions.map((action, ai) => (
                                  <div
                                    key={ai}
                                    className="flex items-start gap-2"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                                      style={{ color: "#D4A574" }}
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    <span className="text-sm text-gray-700">
                                      {action}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Download PDF (placeholder) */}
          <div className="flex justify-end">
            <button
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors border"
              style={{
                borderColor: "#0F2744",
                color: "#0F2744",
              }}
              onClick={() => {
                // Placeholder for PDF download
                alert(
                  "PDF download will be available soon. Your report is saved and accessible from this page."
                );
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
