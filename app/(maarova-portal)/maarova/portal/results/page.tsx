import { getMaarovaSession } from "@/lib/maarovaAuth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MaarovaResultsPage() {
  const session = await getMaarovaSession();
  if (!session) redirect("/maarova/portal/login");

  const completedSessions = await prisma.maarovaAssessmentSession.findMany({
    where: {
      userId: session.sub,
      status: "COMPLETED",
    },
    include: {
      report: true,
    },
    orderBy: { completedAt: "desc" },
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "#0F2744" }}
        >
          Assessment Results
        </h1>
        <p className="text-gray-500 mt-1">
          View your completed assessments and leadership profile reports.
        </p>
      </div>

      {completedSessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#D4A574", opacity: 0.2 }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: "#D4A574" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No completed assessments yet
          </h2>
          <p className="text-gray-500 mb-6">
            Complete your first Maarova assessment to see your leadership profile
            here.
          </p>
          <Link
            href="/maarova/portal/assessment"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
            style={{ backgroundColor: "#D4A574" }}
          >
            Go to Assessment
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {completedSessions.map((as) => {
            const report = as.report;
            const hasReport = report && report.status === "READY";
            const completedDate = as.completedAt
              ? new Date(as.completedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "Unknown";

            return (
              <div
                key={as.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Leadership Assessment
                      </h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          hasReport
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {hasReport ? "Report Ready" : "Report Pending"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mb-3">
                      Completed on {completedDate}
                      {as.totalTimeMinutes
                        ? ` in ${as.totalTimeMinutes} minutes`
                        : ""}
                    </p>

                    <div className="flex items-center gap-6">
                      {hasReport && report.overallScore != null && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            Overall Score
                          </span>
                          <span
                            className="text-xl font-bold"
                            style={{ color: "#0F2744" }}
                          >
                            {report.overallScore}
                          </span>
                          <span className="text-sm text-gray-400">/100</span>
                        </div>
                      )}

                      {hasReport && report.leadershipArchetype && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            Archetype
                          </span>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: "#D4A574" }}
                          >
                            {report.leadershipArchetype}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/maarova/portal/results/${as.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={
                      hasReport
                        ? { backgroundColor: "#0F2744", color: "#fff" }
                        : { backgroundColor: "#D4A574", color: "#fff" }
                    }
                  >
                    {hasReport ? "View Results" : "Generate Report"}
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
