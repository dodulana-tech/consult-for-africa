import { getMaarovaSession } from "@/lib/maarovaAuth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function MaarovaDashboardPage() {
  const session = await getMaarovaSession();
  if (!session) redirect("/maarova/portal/login");

  const sessionInclude = {
    moduleResponses: {
      include: { module: { select: { name: true, type: true, order: true } } },
      orderBy: { module: { order: "asc" } } as const,
    },
    report: {
      select: { leadershipArchetype: true, archetypeNarrative: true, signatureStrengths: true, status: true },
    },
  };

  const [user, coachingMatch, developmentGoals] = await Promise.all([
    prisma.maarovaUser.findUnique({
      where: { id: session.sub },
      select: { name: true, title: true, department: true, organisation: { select: { name: true } } },
    }),
    prisma.maarovaCoachingMatch.findFirst({
      where: { userId: session.sub, status: { in: ["MATCHED", "ACTIVE"] } },
      orderBy: { createdAt: "desc" },
      include: { coach: { select: { name: true, specialisms: true } } },
    }),
    prisma.maarovaDevelopmentGoal.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  // Prefer completed session over empty/active ones
  const assessmentSession =
    (await prisma.maarovaAssessmentSession.findFirst({
      where: { userId: session.sub, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      include: sessionInclude,
    })) ??
    (await prisma.maarovaAssessmentSession.findFirst({
      where: { userId: session.sub, status: { in: ["IN_PROGRESS", "NOT_STARTED"] }, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      include: sessionInclude,
    }));

  const firstName = (user?.name ?? session.name).split(" ")[0];
  const coreModules = assessmentSession?.moduleResponses.filter(
    (mr) => mr.module.type !== "THREE_SIXTY"
  ) ?? [];
  const completedCore = coreModules.filter((mr) => mr.status === "COMPLETED").length;
  const totalCore = coreModules.length;
  const hasReport = assessmentSession?.report?.status === "READY";
  const report = assessmentSession?.report;
  const signatureStrengths = (report?.signatureStrengths as { dimension: string; title: string; description: string }[] | null) ?? [];

  // Determine the real state
  const assessmentNotStarted = !assessmentSession;
  const assessmentInProgress = assessmentSession?.status === "IN_PROGRESS" || (assessmentSession?.status === "NOT_STARTED" && totalCore > 0);
  const assessmentComplete = assessmentSession?.status === "COMPLETED";

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Welcome back, {firstName}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {user?.title && user?.organisation?.name
            ? `${user.title}, ${user.organisation.name}`
            : "Your Maarova leadership assessment dashboard"}
        </p>
      </div>

      {/* ── Hero: Archetype card (when report is ready) ──────────────── */}
      {hasReport && report?.leadershipArchetype && (
        <div
          className="rounded-2xl p-5 sm:p-8 mb-6"
          style={{ background: "linear-gradient(135deg, #0f1a2a 0%, #1a2d45 100%)" }}
        >
          <p className="text-xs uppercase tracking-wider mb-3" style={{ color: "#D4A574" }}>
            Your Leadership Archetype
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
            {report.leadershipArchetype}
          </h2>
          {report.archetypeNarrative && (
            <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "rgba(255,255,255,0.65)" }}>
              {(report.archetypeNarrative as string).slice(0, 200)}
              {(report.archetypeNarrative as string).length > 200 ? "..." : ""}
            </p>
          )}
          <Link
            href="/maarova/portal/results"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
            style={{ background: "#D4A574", color: "#06090f" }}
          >
            View Full Report
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* ── Signature Strengths (when report is ready) ────────────────── */}
      {hasReport && signatureStrengths.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {signatureStrengths.map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-5"
              style={{ borderLeft: "4px solid #D4A574", border: "1px solid #e5eaf0", borderLeftWidth: "4px", borderLeftColor: "#D4A574" }}
            >
              <p className="text-xs text-gray-400 mb-1">{s.dimension}</p>
              <p className="text-sm font-bold mb-1" style={{ color: "#0F2744" }}>{s.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{s.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* ── Assessment Status ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Assessment Progress</h2>
            {assessmentComplete && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Complete
              </span>
            )}
          </div>

          {assessmentNotStarted ? (
            <div className="text-center py-8">
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Ready to discover your leadership profile?
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                Complete five assessment modules to receive your personalised
                leadership archetype, signature strengths, and development roadmap.
                Takes approximately 45 minutes.
              </p>
              <Link
                href="/maarova/portal/assessment"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{ background: "#D4A574", color: "#06090f" }}
              >
                Start Assessment
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          ) : (
            <div>
              {/* Progress bar */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>{completedCore} of {totalCore} core modules</span>
                <span>{totalCore > 0 ? Math.round((completedCore / totalCore) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${totalCore > 0 ? (completedCore / totalCore) * 100 : 0}%`,
                    background: assessmentComplete ? "#10B981" : "linear-gradient(90deg, #D4A574, #e8c9a0)",
                  }}
                />
              </div>

              {/* Module list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {coreModules.map((mr) => {
                  const done = mr.status === "COMPLETED";
                  const inProg = mr.status === "IN_PROGRESS";
                  return (
                    <div
                      key={mr.id}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
                      style={{ background: done ? "rgba(16,185,129,0.05)" : "#F9FAFB" }}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: done ? "#10B981" : inProg ? "#D4A574" : "#D1D5DB",
                        }}
                      >
                        {done ? (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className={`text-xs font-medium ${done ? "text-gray-700" : "text-gray-500"}`}>
                        {mr.module.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {!assessmentComplete && (
                <div className="mt-4">
                  <Link
                    href="/maarova/portal/assessment"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                    style={{ background: "#D4A574", color: "#06090f" }}
                  >
                    Continue Assessment
                  </Link>
                </div>
              )}

              {assessmentComplete && !hasReport && (
                <div className="mt-4 p-4 rounded-lg" style={{ background: "rgba(212,165,116,0.08)", border: "1px solid rgba(212,165,116,0.2)" }}>
                  <p className="text-sm text-gray-700 mb-2">Core modules complete. Generate your leadership report.</p>
                  <Link
                    href="/maarova/portal/results"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: "#D4A574", color: "#06090f" }}
                  >
                    Generate Report
                  </Link>
                </div>
              )}

              {assessmentComplete && hasReport && (
                <div className="mt-4">
                  <Link
                    href="/maarova/portal/results"
                    className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                    style={{ color: "#D4A574" }}
                  >
                    View detailed results
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Coaching ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Coaching</h2>
          {coachingMatch ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                  style={{ backgroundColor: "#D4A574" }}
                >
                  {coachingMatch.coach.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{coachingMatch.coach.name}</p>
                  <p className="text-xs text-gray-500">{coachingMatch.coach.specialisms?.join(", ")}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Sessions: <span className="font-medium text-gray-700">{coachingMatch.sessionsCompleted} completed</span>
              </p>
            </div>
          ) : assessmentComplete ? (
            <div>
              <p className="text-sm text-gray-500 mb-3">
                Your assessment is complete. Explore coaching options to accelerate your leadership development.
              </p>
              <Link
                href="/maarova/portal/development"
                className="inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: "#D4A574" }}
              >
                Explore coaching
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Complete your assessment to unlock coaching recommendations.
            </p>
          )}
        </div>

        {/* ── Development Goals ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Development Goals</h2>
            {developmentGoals.length > 0 && (
              <Link href="/maarova/portal/development" className="text-xs font-medium hover:underline" style={{ color: "#D4A574" }}>
                View all
              </Link>
            )}
          </div>
          {developmentGoals.length > 0 ? (
            <div className="space-y-3">
              {developmentGoals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="rounded-lg p-3" style={{ background: "#F9FAFB" }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{goal.title}</p>
                    <span className="text-xs text-gray-500 ml-2 shrink-0">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${goal.progress}%`, backgroundColor: "#D4A574" }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{goal.dimension}</p>
                </div>
              ))}
            </div>
          ) : assessmentComplete ? (
            <div>
              <p className="text-sm text-gray-500 mb-3">
                Set development goals based on your assessment insights.
              </p>
              <Link
                href="/maarova/portal/development"
                className="inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: "#D4A574" }}
              >
                Set goals
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Complete your assessment to set development goals.
            </p>
          )}
        </div>

        {/* ── Quick Links ────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/maarova/portal/assessment", label: "Assessment", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
              { href: "/maarova/portal/results", label: "Results", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
              { href: "/maarova/portal/development", label: "Development", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
              { href: "/maarova/portal/three-sixty", label: "360 Feedback", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-col items-center gap-2 px-3 py-3 sm:px-4 sm:py-4 rounded-xl transition-all hover:bg-gray-50 hover:shadow-sm"
                style={{ border: "1px solid #e5eaf0" }}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
                </svg>
                <span className="text-xs font-medium text-gray-600">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
