import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const MODULE_LABELS: Record<string, string> = {
  DISC: "Behavioural Style",
  VALUES_DRIVERS: "Values & Drivers",
  EMOTIONAL_INTEL: "Emotional Intelligence",
  CILTI: "Clinical Leadership Transition",
  THREE_SIXTY: "360 Feedback",
  CULTURE_TEAM: "Culture & Team",
};

const DIMENSION_LABELS: Record<string, Record<string, string>> = {
  DISC: { D: "Dominance", I: "Influence", S: "Steadiness", C: "Conscientiousness" },
  VALUES_DRIVERS: {
    theoretical: "Theoretical", economic: "Economic", aesthetic: "Aesthetic",
    social: "Social", political: "Political", regulatory: "Regulatory",
  },
  EMOTIONAL_INTEL: {
    selfAwareness: "Self-Awareness", empathy: "Empathy",
    socialSkills: "Social Skills", emotionalRegulation: "Emotional Regulation",
    overallEQ: "Overall EQ",
  },
  CILTI: {
    clinicalIdentity: "Clinical Identity", leadershipIdentity: "Leadership Identity",
    transitionReadiness: "Transition Readiness", identityFriction: "Identity Friction",
    ciltiComposite: "CILTI Composite",
  },
  CULTURE_TEAM: {
    collaborate: "Collaborate", create: "Create", compete: "Compete", control: "Control",
    teamEffectiveness: "Team Effectiveness",
  },
};

// Keys to skip (meta-data, not scores)
const SKIP_KEYS = new Set([
  "primaryStyle", "adaptedStyle", "primaryDriver", "secondaryDriver",
  "riskZone", "dominant", "note", "error", "answeredCount",
  "engagementDrivers", "raw",
]);

function isScoreKey(key: string): boolean {
  return !SKIP_KEYS.has(key) && !key.startsWith("raw");
}

export default async function MaarovaResultsPage() {
  const session = await getMaarovaSession();
  if (!session) redirect("/maarova/portal/login");

  // Get most recent session (active or completed)
  const assessmentSession = await prisma.maarovaAssessmentSession.findFirst({
    where: {
      userId: session.sub,
      status: { in: ["IN_PROGRESS", "COMPLETED"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      moduleResponses: {
        include: { module: true },
        orderBy: { module: { order: "asc" } },
      },
      report: true,
    },
  });

  if (!assessmentSession) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Assessment Results
          </h1>
          <p className="text-gray-500 mt-1">
            View your scores as you complete each module.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No assessment started yet</h2>
          <p className="text-gray-500 mb-6">Start your assessment to see results here.</p>
          <Link
            href="/maarova/portal/assessment"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: "#D4A574" }}
          >
            Go to Assessment
          </Link>
        </div>
      </div>
    );
  }

  const coreResponses = assessmentSession.moduleResponses.filter(
    (mr) => mr.module.type !== "THREE_SIXTY"
  );
  const completedCoreModules = coreResponses.filter((mr) => mr.status === "COMPLETED");
  const allCoreComplete = completedCoreModules.length === coreResponses.length;
  const report = assessmentSession.report;
  const hasReport = report && report.status === "READY";

  // Build radar data from completed modules
  const radarPoints: { dimension: string; score: number }[] = [];
  for (const mr of completedCoreModules) {
    const scores = mr.scaledScores as Record<string, number> | null;
    if (!scores) continue;
    const numericScores = Object.entries(scores)
      .filter(([k]) => isScoreKey(k) && typeof scores[k] === "number")
      .map(([, v]) => v);
    if (numericScores.length > 0) {
      const avg = Math.round(numericScores.reduce((a, b) => a + b, 0) / numericScores.length);
      radarPoints.push({ dimension: MODULE_LABELS[mr.module.type] ?? mr.module.name, score: avg });
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
          Assessment Results
        </h1>
        <p className="text-gray-500 mt-1">
          {allCoreComplete
            ? "All core modules complete. Your leadership profile is ready."
            : `${completedCoreModules.length} of ${coreResponses.length} core modules completed. Results appear as you finish each module.`}
        </p>
      </div>

      {/* Profile completeness + radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Completeness card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Profile Completeness</p>
          <div className="flex items-end gap-2 mb-4">
            <span className="text-4xl font-bold" style={{ color: "#0F2744" }}>
              {Math.round((completedCoreModules.length / coreResponses.length) * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(completedCoreModules.length / coreResponses.length) * 100}%`,
                background: allCoreComplete ? "#10B981" : "linear-gradient(90deg, #D4A574, #e8c9a0)",
              }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {completedCoreModules.length} of {coreResponses.length} modules
          </p>
        </div>

        {/* Radar-like dimension overview */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Dimension Scores</p>
          {radarPoints.length === 0 ? (
            <p className="text-sm text-gray-400">Complete a module to see your scores.</p>
          ) : (
            <div className="space-y-3">
              {radarPoints.map((pt) => (
                <div key={pt.dimension} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-40 flex-shrink-0 truncate">{pt.dimension}</span>
                  <div className="flex-1 h-6 rounded-full bg-gray-100 overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pt.score}%`,
                        background: pt.score >= 70 ? "#10B981" : pt.score >= 50 ? "#D4A574" : "#EF4444",
                      }}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-600">
                      {pt.score}
                    </span>
                  </div>
                </div>
              ))}
              {/* Placeholder bars for incomplete modules */}
              {coreResponses
                .filter((mr) => mr.status !== "COMPLETED")
                .map((mr) => (
                  <div key={mr.id} className="flex items-center gap-3 opacity-40">
                    <span className="text-xs text-gray-400 w-40 flex-shrink-0 truncate">
                      {MODULE_LABELS[mr.module.type] ?? mr.module.name}
                    </span>
                    <div className="flex-1 h-6 rounded-full bg-gray-100 overflow-hidden relative">
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                        Pending
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Per-module score cards */}
      <div className="space-y-4 mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Module Results
        </h2>
        {coreResponses.map((mr) => {
          const mod = mr.module;
          const isCompleted = mr.status === "COMPLETED";
          const scores = mr.scaledScores as Record<string, number> | null;
          const dimLabels = DIMENSION_LABELS[mod.type] ?? {};

          return (
            <div
              key={mr.id}
              id={`module-${mod.type}`}
              className="bg-white rounded-xl border p-6"
              style={{ borderColor: isCompleted ? "rgba(16,185,129,0.2)" : "rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    {MODULE_LABELS[mod.type] ?? mod.name}
                  </h3>
                  {isCompleted ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      Complete
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {mr.status === "IN_PROGRESS" ? "In Progress" : "Not Started"}
                    </span>
                  )}
                </div>
                {!isCompleted && (
                  <Link
                    href={`/maarova/portal/assessment/${mod.slug}`}
                    className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: "#0f1a2a", color: "#fff" }}
                  >
                    {mr.status === "IN_PROGRESS" ? "Continue" : "Start"}
                  </Link>
                )}
              </div>

              {isCompleted && scores ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.entries(scores)
                    .filter(([k, v]) => isScoreKey(k) && typeof v === "number")
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-lg p-3 text-center"
                        style={{ background: "rgba(15,39,68,0.03)" }}
                      >
                        <p className="text-xs text-gray-500 mb-1 truncate">
                          {dimLabels[key] ?? key.replace(/([A-Z])/g, " $1").trim()}
                        </p>
                        <p
                          className="text-xl font-bold"
                          style={{
                            color: (value as number) >= 70 ? "#10B981" : (value as number) >= 50 ? "#D4A574" : "#EF4444",
                          }}
                        >
                          {Math.round(value as number)}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Complete this module to see your scores.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Comprehensive Report Section */}
      {allCoreComplete && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Comprehensive Leadership Report
          </h2>
          {hasReport ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Leadership Profile</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      Report Ready
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    {report.overallScore != null && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Overall Score</span>
                        <span className="text-2xl font-bold" style={{ color: "#0F2744" }}>
                          {report.overallScore}
                        </span>
                        <span className="text-sm text-gray-400">/100</span>
                      </div>
                    )}
                    {report.leadershipArchetype && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Archetype</span>
                        <span className="text-sm font-semibold" style={{ color: "#D4A574" }}>
                          {report.leadershipArchetype}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Link
                  href={`/maarova/portal/results/${assessmentSession.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: "#0F2744", color: "#fff" }}
                >
                  View Full Report
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-500 mb-4">
                All core modules complete. Generate your comprehensive leadership report.
              </p>
              <Link
                href={`/maarova/portal/results/${assessmentSession.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: "#D4A574", color: "#06090f" }}
              >
                Generate Report
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
