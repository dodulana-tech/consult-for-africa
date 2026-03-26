import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/platform/TopBar";
import Link from "next/link";

export default async function MaarovaAdminPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = ["PARTNER", "ADMIN"].includes(session.user.role);
  if (!isAdmin) redirect("/dashboard");

  const [orgCount, userCount, sessionCounts, coachingCount, totalSessions, recentCompletions] = await Promise.all([
    prisma.maarovaOrganisation.count(),
    prisma.maarovaUser.count(),
    prisma.maarovaAssessmentSession.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.maarovaCoachingMatch.count({
      where: { status: { in: ["ACTIVE", "MATCHED"] } },
    }),
    prisma.maarovaAssessmentSession.count(),
    prisma.maarovaAssessmentSession.findMany({
      where: { status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const completedSessions =
    sessionCounts.find((s) => s.status === "COMPLETED")?._count.id ?? 0;
  const inProgressSessions =
    sessionCounts.find((s) => s.status === "IN_PROGRESS")?._count.id ?? 0;
  const notStarted = userCount - totalSessions;

  const completionRate = userCount > 0 ? Math.round((completedSessions / userCount) * 100) : 0;

  const recentOrgs = await prisma.maarovaOrganisation.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { users: true } },
    },
  });

  const stats = [
    { label: "Organisations", value: orgCount },
    { label: "Users", value: userCount },
    { label: "Assessments Completed", value: completedSessions },
    { label: "Active Coaching", value: coachingCount },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Maarova Admin" subtitle="Manage organisations, users, and assessments" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-5"
              style={{ background: "#fff", border: "1px solid #e5eaf0" }}
            >
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {s.label}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: "#0F2744" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Completion Funnel */}
          <div
            className="rounded-xl p-5"
            style={{ background: "#fff", border: "1px solid #e5eaf0" }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>
              Assessment Funnel
            </h2>
            <div className="space-y-3">
              {[
                { label: "Not Started", value: Math.max(0, notStarted), color: "#E5E7EB", pct: userCount > 0 ? Math.max(0, notStarted) / userCount : 0 },
                { label: "In Progress", value: inProgressSessions, color: "#FCD34D", pct: userCount > 0 ? inProgressSessions / userCount : 0 },
                { label: "Completed", value: completedSessions, color: "#10B981", pct: userCount > 0 ? completedSessions / userCount : 0 },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">{row.label}</span>
                    <span className="text-xs font-semibold text-gray-800">{row.value} ({Math.round(row.pct * 100)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.round(row.pct * 100)}%`, background: row.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid #F3F4F6" }}>
              <span className="text-xs text-gray-400">Overall completion rate</span>
              <span className="text-lg font-bold" style={{ color: "#0F2744" }}>{completionRate}%</span>
            </div>
          </div>

          {/* Recent Completions */}
          <div
            className="rounded-xl p-5"
            style={{ background: "#fff", border: "1px solid #e5eaf0" }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>
              Recent Completions
            </h2>
            {recentCompletions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No completions yet</p>
            ) : (
              <div className="space-y-2">
                {recentCompletions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-2"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.user.name}</p>
                      <p className="text-xs text-gray-400">{s.user.email}</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {s.completedAt
                        ? new Date(s.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/maarova/organisations"
            className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: "#0F2744", color: "#fff" }}
          >
            View All Organisations
          </Link>
          <Link
            href="/admin/maarova/coaches"
            className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border"
            style={{ background: "#D4A574", color: "#06090f" }}
          >
            Manage Coaches
          </Link>
        </div>

        {/* Recent Organisations Table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "#fff", border: "1px solid #e5eaf0" }}
        >
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #e5eaf0" }}>
            <h2 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
              Recent Organisations
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#F9FAFB" }}>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Stream
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Users
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Assessments
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrgs.map((org) => (
                  <tr
                    key={org.id}
                    className="hover:bg-gray-50 transition-colors"
                    style={{ borderBottom: "1px solid #F3F4F6" }}
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/maarova/organisations/${org.id}`}
                        className="font-medium hover:underline"
                        style={{ color: "#0F2744" }}
                      >
                        {org.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background:
                            org.stream === "RECRUITMENT"
                              ? "#DBEAFE"
                              : org.stream === "DEVELOPMENT"
                              ? "#D1FAE5"
                              : "#FEF3C7",
                          color:
                            org.stream === "RECRUITMENT"
                              ? "#1E40AF"
                              : org.stream === "DEVELOPMENT"
                              ? "#065F46"
                              : "#92400E",
                        }}
                      >
                        {org.stream}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{org._count.users}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {org.usedAssessments} / {org.maxAssessments}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background: org.isActive ? "#D1FAE5" : "#FEE2E2",
                          color: org.isActive ? "#065F46" : "#991B1B",
                        }}
                      >
                        {org.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrgs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                      No organisations yet
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
