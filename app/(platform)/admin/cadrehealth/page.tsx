import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PushToOutreachButton } from "@/components/cadrehealth/AdminActions";
import {
  Users,
  ShieldCheck,
  ClipboardList,
  Star,
  Banknote,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export default async function CadreHealthAdmin() {
  const [totalProfessionals, verified, byStatus, byCadre, recentSignups] = await Promise.all([
    prisma.cadreProfessional.count(),
    prisma.cadreProfessional.count({ where: { accountStatus: "VERIFIED" } }),
    prisma.cadreProfessional.groupBy({ by: ["accountStatus"], _count: true }),
    prisma.cadreProfessional.groupBy({ by: ["cadre"], _count: true, orderBy: { _count: { cadre: "desc" } } }),
    prisma.cadreProfessional.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        cadre: true,
        state: true,
        accountStatus: true,
        createdAt: true,
      },
    }),
  ]);

  const openMandates = await prisma.cadreMandate.count({ where: { status: "OPEN" } });
  const totalReviews = await prisma.cadreFacilityReview.count();
  const totalSalaryReports = await prisma.cadreSalaryReport.count();
  const verificationRate =
    totalProfessionals > 0
      ? `${Math.round((verified / totalProfessionals) * 100)}%`
      : "0%";

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
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              CadreHealth
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Healthcare workforce platform
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/cadrehealth/mandates"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-[#0F2744] shadow-sm transition hover:shadow-md"
              style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)" }}
            >
              Manage Mandates
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/admin/cadrehealth/import"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              style={{ backdropFilter: "blur(8px)" }}
            >
              Import Professionals
            </Link>
            <PushToOutreachButton mode="all" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Professionals"
          value={totalProfessionals}
          icon={<Users className="h-5 w-5" />}
          iconBg="bg-[#0B3C5D]/8"
          iconColor="text-[#0B3C5D]"
          accent="#0B3C5D"
        />
        <StatCard
          label="Verified"
          value={verified}
          icon={<ShieldCheck className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          accent="#059669"
        />
        <StatCard
          label="Open Mandates"
          value={openMandates}
          icon={<ClipboardList className="h-5 w-5" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          accent="#2563EB"
        />
        <StatCard
          label="Hospital Reviews"
          value={totalReviews}
          icon={<Star className="h-5 w-5" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          accent="#D97706"
        />
        <StatCard
          label="Salary Reports"
          value={totalSalaryReports}
          icon={<Banknote className="h-5 w-5" />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          accent="#7C3AED"
        />
        <StatCard
          label="Verification Rate"
          value={verificationRate}
          icon={<TrendingUp className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          accent="#059669"
        />
      </div>

      {/* By cadre */}
      <div
        className="rounded-2xl border border-white/60 p-6 shadow-sm"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(16px) saturate(200%)",
          WebkitBackdropFilter: "blur(16px) saturate(200%)",
        }}
      >
        <h2 className="mb-1 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
          By Cadre
        </h2>
        <p className="mb-4 text-xs text-gray-400">
          Professional distribution across medical specialities
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {byCadre.map((g, i) => {
            const colors = [
              { bg: "rgba(11,60,93,0.06)", border: "rgba(11,60,93,0.1)" },
              { bg: "rgba(5,150,105,0.05)", border: "rgba(5,150,105,0.1)" },
              { bg: "rgba(37,99,235,0.05)", border: "rgba(37,99,235,0.1)" },
              { bg: "rgba(124,58,237,0.05)", border: "rgba(124,58,237,0.1)" },
            ];
            const color = colors[i % colors.length];
            return (
              <div
                key={g.cadre}
                className="flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:shadow-sm hover:-translate-y-0.5"
                style={{ background: color.bg, border: `1px solid ${color.border}` }}
              >
                <span className="text-sm font-medium text-gray-700">
                  {g.cadre.replace(/_/g, " ")}
                </span>
                <span
                  className="rounded-lg px-2.5 py-0.5 text-sm font-bold shadow-sm"
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    color: "#0B3C5D",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {g._count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent signups */}
      <div
        className="overflow-hidden rounded-2xl border border-white/60 shadow-sm"
        style={{
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(16px) saturate(200%)",
          WebkitBackdropFilter: "blur(16px) saturate(200%)",
        }}
      >
        <div className="border-b border-gray-100/80 px-6 py-5">
          <h2 className="text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Recent Signups
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">Latest professionals joining the platform</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b border-gray-100/80 text-left"
                style={{ background: "rgba(15,39,68,0.03)" }}
              >
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Name
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Cadre
                </th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 sm:table-cell">
                  State
                </th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Status
                </th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 md:table-cell">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {recentSignups.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-50/80 transition-colors last:border-0 hover:bg-white/60"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/cadrehealth/${p.id}`}
                      className="font-semibold hover:underline"
                      style={{ color: "#0B3C5D" }}
                    >
                      {p.firstName} {p.lastName}
                    </Link>
                    <div className="mt-0.5 text-xs text-gray-400">{p.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {p.cadre.replace(/_/g, " ")}
                  </td>
                  <td className="hidden px-6 py-4 text-gray-600 sm:table-cell">
                    {p.state || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        p.accountStatus === "VERIFIED"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : p.accountStatus === "PENDING_REVIEW"
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          : "bg-gray-100 text-gray-600 ring-1 ring-gray-200"
                      }`}
                    >
                      {p.accountStatus.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="hidden px-6 py-4 text-gray-400 md:table-cell">
                    {p.createdAt.toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  accent: string;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/60 p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(16px) saturate(200%)",
        WebkitBackdropFilter: "blur(16px) saturate(200%)",
      }}
    >
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 rounded-tl-full opacity-[0.04] transition-opacity group-hover:opacity-[0.08]"
        style={{ background: accent }}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
          <div className={`rounded-xl p-2.5 ${iconBg} ${iconColor}`}>{icon}</div>
        </div>
        <p className="mt-3 text-3xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
          {value}
        </p>
      </div>
    </div>
  );
}
