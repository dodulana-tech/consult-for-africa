import { getMaarovaSession } from "@/lib/maarovaAuth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    NOT_STARTED: "bg-gray-100 text-gray-600",
    IN_PROGRESS: "bg-amber-50 text-amber-700",
    COMPLETED: "bg-green-50 text-green-700",
    EXPIRED: "bg-red-50 text-red-600",
  };
  const labels: Record<string, string> = {
    NOT_STARTED: "Not Started",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    EXPIRED: "Expired",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {labels[status] ?? status}
    </span>
  );
}

export default async function MaarovaDashboardPage() {
  const session = await getMaarovaSession();
  if (!session) redirect("/maarova/portal/login");

  const [assessmentSession, coachingMatch, developmentGoals] =
    await Promise.all([
      prisma.maarovaAssessmentSession.findFirst({
        where: { userId: session.sub },
        orderBy: { createdAt: "desc" },
        include: {
          moduleResponses: {
            include: {
              module: { select: { name: true, type: true, order: true } },
            },
            orderBy: { module: { order: "asc" } },
          },
          report: {
            select: {
              overallScore: true,
              leadershipArchetype: true,
              status: true,
            },
          },
        },
      }),
      prisma.maarovaCoachingMatch.findFirst({
        where: { userId: session.sub },
        orderBy: { createdAt: "desc" },
        include: {
          coach: { select: { name: true, specialisms: true } },
        },
      }),
      prisma.maarovaDevelopmentGoal.findMany({
        where: { userId: session.sub },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const completedModules =
    assessmentSession?.moduleResponses.filter(
      (mr) => mr.status === "COMPLETED"
    ).length ?? 0;
  const totalModules = assessmentSession?.moduleResponses.length ?? 0;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session.name.split(" ")[0]}
        </h1>
        <p className="text-gray-500 mt-1">
          Your Maarova leadership assessment dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assessment Status Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Assessment Status
            </h2>
            {assessmentSession && (
              <StatusBadge status={assessmentSession.status} />
            )}
          </div>

          {!assessmentSession ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to Begin
              </h3>
              <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                Your leadership assessment is waiting. The full assessment takes
                approximately 45 minutes and covers behavioural style, values,
                emotional intelligence, and clinical leadership.
              </p>
              <Link
                href="/maarova/portal/assessment"
                className="inline-flex items-center px-6 py-2.5 rounded-lg text-white font-medium text-sm"
                style={{ backgroundColor: "#D4A574" }}
              >
                Start Your Assessment
              </Link>
            </div>
          ) : assessmentSession.status === "IN_PROGRESS" ? (
            <div>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>
                  {completedModules} of {totalModules} modules completed
                </span>
                <span>
                  {totalModules > 0
                    ? Math.round((completedModules / totalModules) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${totalModules > 0 ? (completedModules / totalModules) * 100 : 0}%`,
                    backgroundColor: "#D4A574",
                  }}
                />
              </div>
              <div className="space-y-3">
                {assessmentSession.moduleResponses.map((mr) => (
                  <div
                    key={mr.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          mr.status === "COMPLETED"
                            ? "bg-green-500"
                            : mr.status === "IN_PROGRESS"
                              ? "bg-amber-500"
                              : "bg-gray-300"
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {mr.module.name}
                      </span>
                    </div>
                    <StatusBadge status={mr.status} />
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href="/maarova/portal/assessment"
                  className="inline-flex items-center px-5 py-2 rounded-lg text-white font-medium text-sm"
                  style={{ backgroundColor: "#D4A574" }}
                >
                  Continue Assessment
                </Link>
              </div>
            </div>
          ) : assessmentSession.status === "COMPLETED" ? (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {assessmentSession.report?.overallScore != null && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                      Overall Score
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {assessmentSession.report.overallScore}
                      <span className="text-lg text-gray-400">/100</span>
                    </p>
                  </div>
                )}
                {assessmentSession.report?.leadershipArchetype && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                      Leadership Archetype
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {assessmentSession.report.leadershipArchetype}
                    </p>
                  </div>
                )}
              </div>
              <Link
                href="/maarova/portal/results"
                className="inline-flex items-center px-5 py-2 rounded-lg text-white font-medium text-sm"
                style={{ backgroundColor: "#D4A574" }}
              >
                View Full Results
              </Link>
            </div>
          ) : null}
        </div>

        {/* Coaching Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Coaching
          </h2>
          {coachingMatch ? (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: "#D4A574" }}
                >
                  {coachingMatch.coach.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {coachingMatch.coach.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {coachingMatch.coach.specialisms?.join(", ")}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  Status:{" "}
                  <span className="font-medium text-gray-700">
                    {coachingMatch.status.replace(/_/g, " ")}
                  </span>
                </p>
                <p>
                  Sessions completed:{" "}
                  <span className="font-medium text-gray-700">
                    {coachingMatch.sessionsCompleted}
                  </span>
                </p>
                {coachingMatch.nextSessionAt && (
                  <p>
                    Next session:{" "}
                    <span className="font-medium text-gray-700">
                      {new Date(coachingMatch.nextSessionAt).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}
                    </span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">
                No coaching match yet. Complete your assessment to be matched
                with a leadership coach.
              </p>
            </div>
          )}
        </div>

        {/* Development Goals Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Development Goals
            </h2>
            {developmentGoals.length > 0 && (
              <Link
                href="/maarova/portal/development"
                className="text-sm font-medium hover:underline"
                style={{ color: "#D4A574" }}
              >
                View all
              </Link>
            )}
          </div>
          {developmentGoals.length > 0 ? (
            <div className="space-y-3">
              {developmentGoals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {goal.title}
                    </p>
                    <span className="text-xs text-gray-500 ml-2 shrink-0">
                      {goal.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${goal.progress}%`,
                        backgroundColor: "#D4A574",
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {goal.dimension}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">
                Development goals will appear here after your assessment is
                reviewed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
