import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import ApproveButton from "./ApproveButton";

const PARTNER_ORG_LABELS: Record<string, string> = {
  MANSAG: "MANSAG",
  ANPA: "ANPA",
  DFC: "DFC",
  NDF_SA: "NDF-SA",
  OTHER: "Other",
};

export default async function AdminMentorshipPage() {
  // Stats
  const [
    totalMentorsActive,
    totalMentorsPending,
    totalMentorships,
    totalCompleted,
    partnerOrgCounts,
    pendingProfiles,
  ] = await Promise.all([
    prisma.cadreMentorProfile.count({ where: { status: "ACTIVE" } }),
    prisma.cadreMentorProfile.count({ where: { status: "PENDING" } }),
    prisma.cadreMentorship.count(),
    prisma.cadreMentorship.count({ where: { status: "COMPLETED" } }),
    prisma.cadreMentorProfile.groupBy({
      by: ["partnerOrg"],
      where: { status: "ACTIVE" },
      _count: true,
    }),
    prisma.cadreMentorProfile.findMany({
      where: { status: "PENDING" },
      include: {
        professional: {
          select: {
            firstName: true,
            lastName: true,
            cadre: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const stats = [
    { label: "Active Mentors", value: totalMentorsActive, color: "#059669" },
    { label: "Pending Approval", value: totalMentorsPending, color: "#D97706" },
    { label: "Total Mentorships", value: totalMentorships, color: "#2563EB" },
    { label: "Completed", value: totalCompleted, color: "#0B3C5D" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
          CadreHealth Mentorship
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage mentor approvals and track mentorship activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border bg-white p-5"
            style={{ borderColor: "#E8EBF0" }}
          >
            <p className="text-xs font-medium text-gray-500">{s.label}</p>
            <p
              className="mt-1 text-2xl font-bold"
              style={{ color: s.color }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Partner Org Breakdown */}
      <div
        className="rounded-2xl border bg-white p-6"
        style={{ borderColor: "#E8EBF0" }}
      >
        <h2
          className="mb-4 text-base font-bold"
          style={{ color: "#0F2744" }}
        >
          Active Mentors by Organization
        </h2>
        <div className="space-y-2">
          {partnerOrgCounts.map((item) => (
            <div
              key={item.partnerOrg ?? "none"}
              className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{ background: "#F8F9FB" }}
            >
              <span className="text-sm font-medium text-gray-700">
                {item.partnerOrg
                  ? PARTNER_ORG_LABELS[item.partnerOrg] ?? item.partnerOrg
                  : "No Organization"}
              </span>
              <span className="text-sm font-bold" style={{ color: "#0B3C5D" }}>
                {item._count}
              </span>
            </div>
          ))}
          {partnerOrgCounts.length === 0 && (
            <p className="text-sm text-gray-400">No active mentors yet.</p>
          )}
        </div>
      </div>

      {/* Pending Approvals */}
      <div
        className="rounded-2xl border bg-white p-6"
        style={{ borderColor: "#E8EBF0" }}
      >
        <h2
          className="mb-4 text-base font-bold"
          style={{ color: "#0F2744" }}
        >
          Pending Approvals ({pendingProfiles.length})
        </h2>
        {pendingProfiles.length === 0 ? (
          <p className="text-sm text-gray-400">
            No mentor profiles awaiting approval.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr
                  className="border-b text-xs font-semibold uppercase tracking-wider text-gray-500"
                  style={{ borderColor: "#E8EBF0" }}
                >
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Cadre</th>
                  <th className="pb-3 pr-4">Organization</th>
                  <th className="pb-3 pr-4">Areas</th>
                  <th className="pb-3 pr-4">Country</th>
                  <th className="pb-3 pr-4">Applied</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingProfiles.map((profile) => (
                  <tr
                    key={profile.id}
                    className="border-b last:border-0"
                    style={{ borderColor: "#E8EBF0" }}
                  >
                    <td className="py-3 pr-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {profile.professional.firstName}{" "}
                          {profile.professional.lastName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {profile.professional.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {getCadreLabel(profile.professional.cadre)}
                    </td>
                    <td className="py-3 pr-4">
                      {profile.partnerOrg ? (
                        <span
                          className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: "#FFFBEB",
                            color: "#D97706",
                          }}
                        >
                          {PARTNER_ORG_LABELS[profile.partnerOrg] ??
                            profile.partnerOrg}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {profile.mentorAreas.slice(0, 2).map((a) => (
                          <span
                            key={a}
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                              background: "#0B3C5D08",
                              color: "#0B3C5D",
                            }}
                          >
                            {a}
                          </span>
                        ))}
                        {profile.mentorAreas.length > 2 && (
                          <span className="text-[10px] text-gray-400">
                            +{profile.mentorAreas.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-500">
                      {profile.countryOfPractice ?? "N/A"}
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-400">
                      {profile.createdAt.toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3">
                      <ApproveButton mentorProfileId={profile.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
