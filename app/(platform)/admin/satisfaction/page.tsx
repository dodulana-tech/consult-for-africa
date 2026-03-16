import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";

function scoreColor(score: number): { bg: string; color: string } {
  if (score >= 4) return { bg: "#D1FAE5", color: "#065F46" };
  if (score >= 3) return { bg: "#FEF3C7", color: "#92400E" };
  return { bg: "#FEE2E2", color: "#991B1B" };
}

function stars(score: number): string {
  return "\u2605".repeat(score) + "\u2606".repeat(5 - score);
}

export default async function SatisfactionPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allowed = ["PARTNER", "ADMIN", "DIRECTOR"].includes(session.user.role);
  if (!allowed) redirect("/dashboard");

  const pulses = await prisma.clientSatisfactionPulse.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          client: { select: { id: true, name: true } },
        },
      },
    },
  });

  const totalResponses = pulses.length;
  const avgScore =
    totalResponses > 0
      ? (pulses.reduce((sum, p) => sum + p.score, 0) / totalResponses).toFixed(1)
      : "N/A";
  const lowScoreCount = pulses.filter((p) => p.score <= 2).length;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Client Satisfaction"
        subtitle={`${totalResponses} responses across all projects`}
        backHref="/dashboard"
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className="rounded-xl p-5"
            style={{ background: "#fff", border: "1px solid #e5eaf0" }}
          >
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Average Score
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: "#0F2744" }}>
              {avgScore}
              <span className="text-sm font-normal text-gray-400"> / 5</span>
            </p>
          </div>
          <div
            className="rounded-xl p-5"
            style={{ background: "#fff", border: "1px solid #e5eaf0" }}
          >
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Total Responses
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: "#0F2744" }}>
              {totalResponses}
            </p>
          </div>
          <div
            className="rounded-xl p-5"
            style={{
              background: lowScoreCount > 0 ? "#FEF2F2" : "#fff",
              border: `1px solid ${lowScoreCount > 0 ? "#FECACA" : "#e5eaf0"}`,
            }}
          >
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Low-Score Alerts
            </p>
            <p
              className="text-3xl font-bold mt-1"
              style={{ color: lowScoreCount > 0 ? "#991B1B" : "#0F2744" }}
            >
              {lowScoreCount}
            </p>
            {lowScoreCount > 0 && (
              <p className="text-xs text-red-600 mt-1">
                Scores of 1 or 2 need attention
              </p>
            )}
          </div>
        </div>

        {/* Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Project
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Client
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Contact ID
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Score
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Feedback
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Period
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {pulses.map((pulse) => {
                  const sc = scoreColor(pulse.score);
                  return (
                    <tr
                      key={pulse.id}
                      className="hover:bg-gray-50 transition-colors"
                      style={{ borderBottom: "1px solid #F3F4F6" }}
                    >
                      <td className="px-5 py-3 font-medium" style={{ color: "#0F2744" }}>
                        {pulse.project.name}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {pulse.project.client.name}
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs font-mono">
                        {pulse.contactId.slice(0, 8)}...
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium"
                          style={{ background: sc.bg, color: sc.color }}
                        >
                          <span>{pulse.score}/5</span>
                          <span className="text-[10px] tracking-tight">{stars(pulse.score)}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600 max-w-xs truncate">
                        {pulse.feedback ?? "No feedback provided"}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{pulse.period}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">
                        {pulse.createdAt.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
                {pulses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                      No satisfaction data collected yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
