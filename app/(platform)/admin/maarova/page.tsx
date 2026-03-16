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

  const [orgCount, userCount, sessionCounts, coachingCount] = await Promise.all([
    prisma.maarovaOrganisation.count(),
    prisma.maarovaUser.count(),
    prisma.maarovaAssessmentSession.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.maarovaCoachingMatch.count({
      where: { status: { in: ["ACTIVE", "MATCHED"] } },
    }),
  ]);

  const completedSessions =
    sessionCounts.find((s) => s.status === "COMPLETED")?._count.id ?? 0;

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

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link
            href="/admin/maarova/organisations"
            className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: "#0F2744", color: "#fff" }}
          >
            View All Organisations
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
