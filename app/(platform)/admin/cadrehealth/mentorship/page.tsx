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
    { label: "Active Mentors", value: totalMentorsActive, icon: <UserCheck className="h-5 w-5" />, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", accent: "#059669" },
    { label: "Pending Approval", value: totalMentorsPending, icon: <Clock className="h-5 w-5" />, iconBg: "bg-amber-50", iconColor: "text-amber-600", accent: "#D97706" },
    { label: "Total Mentorships", value: totalMentorships, icon: <Users className="h-5 w-5" />, iconBg: "bg-blue-50", iconColor: "text-blue-600", accent: "#2563EB" },
    { label: "Completed", value: totalCompleted, icon: <CheckCircle2 className="h-5 w-5" />, iconBg: "bg-[#0B3C5D]/8", iconColor: "text-[#0B3C5D]", accent: "#0B3C5D" },
  ];

  const glassCard = {
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(16px) saturate(200%)",
    WebkitBackdropFilter: "blur(16px) saturate(200%)",
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background: "linear-gradient(135deg, #0F2744 0%, #0B3C5D 60%, #1a5a8a 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(circle at 80% 20%, rgba(212,175,55,0.08) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(26,157,217,0.1) 0%, transparent 50%)",
          }}
        />
        <div className="relative">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            CadreHealth Mentorship
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Manage mentor approvals and track mentorship activity
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="group relative overflow-hidden rounded-2xl border border-white/60 p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            style={glassCard}
          >
            <div
              className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 rounded-tl-full opacity-[0.04] transition-opacity group-hover:opacity-[0.08]"
              style={{ background: s.accent }}
            />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{s.label}</p>
                <div className={`rounded-xl p-2.5 ${s.iconBg} ${s.iconColor}`}>{s.icon}</div>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
                {s.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Partner Org Breakdown */}
      <div
        className="rounded-2xl border border-white/60 p-6 shadow-sm"
        style={glassCard}
      >
        <h2 className="mb-1 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
          Active Mentors by Organization
        </h2>
        <p className="mb-4 text-xs text-gray-400">Distribution across partner organizations</p>
        <div className="space-y-2">
          {partnerOrgCounts.map((item, i) => {
            const colors = [
              { bg: "rgba(11,60,93,0.06)", border: "rgba(11,60,93,0.1)" },
              { bg: "rgba(5,150,105,0.05)", border: "rgba(5,150,105,0.1)" },
              { bg: "rgba(37,99,235,0.05)", border: "rgba(37,99,235,0.1)" },
              { bg: "rgba(124,58,237,0.05)", border: "rgba(124,58,237,0.1)" },
            ];
            const color = colors[i % colors.length];
            return (
              <div
                key={item.partnerOrg ?? "none"}
                className="flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:shadow-sm hover:-translate-y-0.5"
                style={{ background: color.bg, border: `1px solid ${color.border}` }}
              >
                <span className="text-sm font-medium text-gray-700">
                  {item.partnerOrg
                    ? PARTNER_ORG_LABELS[item.partnerOrg] ?? item.partnerOrg
                    : "No Organization"}
                </span>
                <span
                  className="rounded-lg px-2.5 py-0.5 text-sm font-bold shadow-sm"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    color: "#0B3C5D",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {item._count}
                </span>
              </div>
            );
          })}
          {partnerOrgCounts.length === 0 && (
            <div
              className="rounded-xl py-8 text-center"
              style={{ background: "rgba(15,39,68,0.02)" }}
            >
              <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">No active mentors yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending Approvals */}
      <div
        className="overflow-hidden rounded-2xl border border-white/60 shadow-sm"
        style={glassCard}
      >
        <div className="border-b border-gray-100/80 px-6 py-5">
          <h2 className="text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Pending Approvals ({pendingProfiles.length})
          </h2>
        </div>
        {pendingProfiles.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <Clock className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">
              No mentor profiles awaiting approval.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100/80" style={{ background: "rgba(15,39,68,0.03)" }}>
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
                    className="border-b border-gray-50/80 transition-colors last:border-0 hover:bg-white/60"
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
                        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
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
                              background: "rgba(11,60,93,0.06)",
                              color: "#0B3C5D",
                              border: "1px solid rgba(11,60,93,0.1)",
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
