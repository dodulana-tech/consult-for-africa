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

interface SignatureStrength {
  dimension: string;
  title: string;
  description: string;
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
  nextLeadershipEdge: string | null;
  blindSpotAnalysis: string | null;
  coachingPriorities: CoachingPriority[] | null;
  leadershipArchetype: string | null;
  archetypeNarrative: string | null;
  signatureStrengths: SignatureStrength[] | null;
  fullReportContent: {
    archetypeDescription?: string;
    dimensionInterpretations?: Record<string, string>;
  } | null;
  generatedAt: string | null;
  pdfUrl: string | null;
}

function scoreZone(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: "Signature Strength", color: "#92400E", bg: "#FEF3C7" };
  if (score >= 60) return { label: "Natural Strength", color: "#065F46", bg: "#D1FAE5" };
  if (score >= 40) return { label: "Developing", color: "#1E40AF", bg: "#DBEAFE" };
  return { label: "Emerging", color: "#6B7280", bg: "#F3F4F6" };
}

interface SessionData {
  id: string;
  status: string;
  stream: string;
  completedAt: string | null;
  totalTimeMinutes: number | null;
  moduleResponses: ModuleResponse[];
}

// ─── Radar Chart (FIFA-style) ─────────────────────────────────────────────────

const RADAR_LABELS: Record<string, string> = {
  "Behavioural Style (DISC)": "Behavioural\nStyle",
  "Values and Motivational Drivers": "Values &\nDrivers",
  "Emotional Intelligence": "Emotional\nIntelligence",
  "Clinical Leadership and Team Impact": "Clinical\nLeadership",
  "Culture and Team Dynamics": "Culture\n& Team",
  "360-Degree Feedback": "360\nFeedback",
};

function RadarChart({
  data,
}: {
  data: { dimension: string; score: number; benchmark: number }[];
}) {
  const size = 600;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = 180;
  const levels = 5;
  const n = data.length;
  const angleSlice = (Math.PI * 2) / n;

  function polar(angle: number, radius: number) {
    const a = angle - Math.PI / 2;
    return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
  }

  // Polygon grid (not circles - FIFA style)
  const gridPolygons = Array.from({ length: levels }, (_, lvl) => {
    const r = (maxRadius / levels) * (lvl + 1);
    const points = Array.from({ length: n }, (__, i) => {
      const p = polar(angleSlice * i, r);
      return `${p.x},${p.y}`;
    }).join(" ");
    return (
      <polygon
        key={lvl}
        points={points}
        fill={lvl === levels - 1 ? "rgba(15,39,68,0.03)" : "none"}
        stroke={lvl === levels - 1 ? "rgba(15,39,68,0.15)" : "rgba(15,39,68,0.06)"}
        strokeWidth={lvl === levels - 1 ? 1.5 : 0.75}
      />
    );
  });

  // Axis lines
  const axisLines = data.map((_, i) => {
    const end = polar(angleSlice * i, maxRadius);
    return (
      <line
        key={i}
        x1={cx} y1={cy} x2={end.x} y2={end.y}
        stroke="rgba(15,39,68,0.08)"
        strokeWidth={0.75}
      />
    );
  });

  // Benchmark polygon
  const benchmarkPts = data.map((d, i) => {
    const p = polar(angleSlice * i, (d.benchmark / 100) * maxRadius);
    return `${p.x},${p.y}`;
  }).join(" ");

  // Score polygon
  const scorePts = data.map((d, i) => {
    const p = polar(angleSlice * i, (d.score / 100) * maxRadius);
    return `${p.x},${p.y}`;
  }).join(" ");

  // Score vertex dots and score labels
  const vertices = data.map((d, i) => {
    const angle = angleSlice * i;
    const r = (d.score / 100) * maxRadius;
    const p = polar(angle, r);
    // Label position: outside the max radius
    const labelR = maxRadius + 55;
    const lp = polar(angle, labelR);
    // Score badge position: just outside the score point
    const scoreR = Math.max(r + 18, maxRadius * 0.15);
    const sp = polar(angle, scoreR);
    const label = RADAR_LABELS[d.dimension] ?? d.dimension;
    const lines = label.split("\n");

    // Text anchor based on angle
    const normAngle = angle - Math.PI / 2;
    const cosA = Math.cos(normAngle);
    const anchor = Math.abs(cosA) < 0.15 ? "middle" : cosA < 0 ? "end" : "start";

    return (
      <g key={i}>
        {/* Vertex dot */}
        <circle cx={p.x} cy={p.y} r={5} fill="#D4A574" stroke="#fff" strokeWidth={2.5} />

        {/* Score number near vertex */}
        <text
          x={sp.x} y={sp.y}
          textAnchor="middle" dominantBaseline="middle"
          fill="#0F2744" fontWeight="700" fontSize="14"
        >
          {d.score}
        </text>

        {/* Dimension label outside */}
        {lines.map((line, li) => (
          <text
            key={li}
            x={lp.x}
            y={lp.y + (li - (lines.length - 1) / 2) * 14}
            textAnchor={anchor}
            dominantBaseline="middle"
            fill="#374151" fontWeight="600" fontSize="12"
          >
            {line}
          </text>
        ))}
      </g>
    );
  });

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[520px]"
        role="img"
        aria-label="Leadership fingerprint"
      >
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4A574" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#D4A574" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="benchGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F2744" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0F2744" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridPolygons}
        {axisLines}

        {/* Benchmark area */}
        <polygon
          points={benchmarkPts}
          fill="url(#benchGrad)"
          stroke="#0F2744"
          strokeWidth={1}
          strokeDasharray="6,4"
          strokeOpacity={0.2}
        />

        {/* Score area - the hero */}
        <polygon
          points={scorePts}
          fill="url(#scoreGrad)"
          stroke="#D4A574"
          strokeWidth={3}
          strokeLinejoin="round"
        />

        {vertices}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-3 rounded-sm" style={{ backgroundColor: "rgba(212,165,116,0.3)", border: "2px solid #D4A574" }} />
          <span className="text-xs font-medium text-gray-600">Your Pattern</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-3 rounded-sm" style={{ backgroundColor: "rgba(15,39,68,0.05)", border: "1.5px dashed rgba(15,39,68,0.2)" }} />
          <span className="text-xs font-medium text-gray-600">Typical Pattern</span>
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
          {/* Hero: Leadership Archetype */}
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "linear-gradient(135deg, #0f1a2a 0%, #1a2d45 100%)" }}
          >
            <p className="text-xs uppercase tracking-wider mb-4" style={{ color: "#D4A574" }}>
              Your Leadership Archetype
            </p>
            <h2 className="text-3xl font-bold text-white mb-4">
              {report.leadershipArchetype ?? "Leadership Profile"}
            </h2>
            {report.archetypeNarrative ? (
              <p className="text-sm leading-relaxed max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.7)" }}>
                {report.archetypeNarrative}
              </p>
            ) : fullContent?.archetypeDescription ? (
              <p className="text-sm leading-relaxed max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.7)" }}>
                {fullContent.archetypeDescription}
              </p>
            ) : null}
          </div>

          {/* Signature Strengths */}
          {report.signatureStrengths && report.signatureStrengths.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
                Your Signature Strengths
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {report.signatureStrengths.map((s: SignatureStrength, i: number) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-5"
                    style={{ borderLeft: "4px solid #D4A574", border: "1px solid #e5eaf0", borderLeftWidth: "4px", borderLeftColor: "#D4A574" }}
                  >
                    <p className="text-xs text-gray-400 mb-1">{s.dimension}</p>
                    <p className="text-sm font-bold mb-1.5" style={{ color: "#0F2744" }}>{s.title}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Radar Chart */}
          {report.radarChartData && report.radarChartData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: "#0F2744" }}
              >
                Your Leadership Fingerprint
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

            {/* Next Leadership Edge */}
            {(report.nextLeadershipEdge ?? report.developmentAreas) && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: "rgba(212,165,116,0.1)" }}
                  >
                    <svg
                      className="w-4 h-4"
                      style={{ color: "#D4A574" }}
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
                    Your Next Leadership Edge
                  </h2>
                </div>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                  {(report.nextLeadershipEdge ?? report.developmentAreas ?? "").split("\n\n").map((p: string, i: number) => (
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
