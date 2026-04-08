import { prisma } from "@/lib/prisma";
import { getCadreLabel } from "@/lib/cadreHealth/cadres";
import ApproveButton from "./ApproveButton";
import {
  UserCheck,
  Clock,
  Users,
  CheckCircle2,
} from "lucide-react";

const PARTNER_ORG_LABELS: Record<string, string> = {
  MANSAG: "MANSAG",
  ANPA: "ANPA",
  DFC: "DFC",
  NDF_SA: "NDF-SA",
  OTHER: "Other",
};

export default async function AdminMentorshipPage() {
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
    { label: "Active Mentors", value: totalMentorsActive, icon: <UserCheck className="h-5 w-5" />, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
    { label: "Pending Approval", value: totalMentorsPending, icon: <Clock className="h-5 w-5" />, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
    { label: "Total Mentorships", value: totalMentorships, icon: <Users className="h-5 w-5" />, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
    { label: "Completed", value: totalCompleted, icon: <CheckCircle2 className="h-5 w-5" />, iconBg: "bg-[#0B3C5D]/8", iconColor: "text-[#0B3C5D]" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
          CadreHealth Mentorship
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Manage mentor approvals and track mentorship activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
              <div className={`rounded-xl p-2.5 ${s.iconBg} ${s.iconColor}`}>{s.icon}</div>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Partner Org Breakdown */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
          Active Mentors by Organization
        </h2>
        <p className="mb-4 text-xs text-gray-400">Distribution across partner organizations</p>
        <div className="space-y-2">
          {partnerOrgCounts.map((item) => (
            <div
              key={item.partnerOrg ?? "none"}
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: "#F8F9FB" }}
            >
              <span className="text-sm font-medium text-gray-700">
                {item.partnerOrg
                  ? PARTNER_ORG_LABELS[item.partnerOrg] ?? item.partnerOrg
                  : "No Organization"}
              </span>
              <span className="rounded-lg bg-white px-2.5 py-0.5 text-sm font-bold shadow-sm" style={{ color: "#0B3C5D" }}>
                {item._count}
              </span>
            </div>
          ))}
          {partnerOrgCounts.length === 0 && (
            <div className="rounded-xl bg-gray-50 py-6 text-center">
              <p className="text-sm text-gray-400">No active mentors yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Pending Approvals ({pendingProfiles.length})
          </h2>
        </div>
        {pendingProfiles.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-gray-400">
              No mentor profiles awaiting approval.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100" style={{ background: "#F8F9FB" }}>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Name</th>
                  <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 sm:table-cell">Cadre</th>
                  <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 md:table-cell">Organization</th>
                  <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 lg:table-cell">Areas</th>
                  <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 md:table-cell">Country</th>
                  <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 sm:table-cell">Applied</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingProfiles.map((profile) => (
                  <tr
                    key={profile.id}
                    className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {profile.professional.firstName}{" "}
                          {profile.professional.lastName}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {profile.professional.email}
                        </p>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 text-gray-600 sm:table-cell">
                      {getCadreLabel(profile.professional.cadre)}
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      {profile.partnerOrg ? (
                        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          {PARTNER_ORG_LABELS[profile.partnerOrg] ??
                            profile.partnerOrg}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="hidden px-6 py-4 lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {profile.mentorAreas.slice(0, 2).map((a) => (
                          <span
                            key={a}
                            className="rounded-lg px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              background: "#0B3C5D0A",
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
                    <td className="hidden px-6 py-4 text-xs text-gray-500 md:table-cell">
                      {profile.countryOfPractice ?? "N/A"}
                    </td>
                    <td className="hidden px-6 py-4 text-xs text-gray-400 sm:table-cell">
                      {profile.createdAt.toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
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
