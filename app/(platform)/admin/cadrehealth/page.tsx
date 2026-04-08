import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Users,
  ShieldCheck,
  ClipboardList,
  Star,
  Banknote,
  TrendingUp,
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
            CadreHealth
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">Healthcare workforce platform</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/cadrehealth/mandates"
            className="rounded-xl bg-[#0B3C5D] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0A3350] hover:shadow-md"
          >
            Manage Mandates
          </Link>
          <Link
            href="/admin/cadrehealth/import"
            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
          >
            Import Professionals
          </Link>
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
        />
        <StatCard
          label="Verified"
          value={verified}
          icon={<ShieldCheck className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Open Mandates"
          value={openMandates}
          icon={<ClipboardList className="h-5 w-5" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Hospital Reviews"
          value={totalReviews}
          icon={<Star className="h-5 w-5" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Salary Reports"
          value={totalSalaryReports}
          icon={<Banknote className="h-5 w-5" />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          label="Verification Rate"
          value={verificationRate}
          icon={<TrendingUp className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* By cadre */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
          By Cadre
        </h2>
        <p className="mb-4 text-xs text-gray-400">
          Professional distribution across medical specialities
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {byCadre.map((g, i) => (
            <div
              key={g.cadre}
              className="flex items-center justify-between rounded-xl px-4 py-3 transition hover:shadow-sm"
              style={{ background: i % 2 === 0 ? "#F8F9FB" : "#F1F5F9" }}
            >
              <span className="text-sm font-medium text-gray-700">
                {g.cadre.replace(/_/g, " ")}
              </span>
              <span className="rounded-lg bg-white px-2.5 py-0.5 text-sm font-bold shadow-sm" style={{ color: "#0B3C5D" }}>
                {g._count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent signups */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Recent Signups
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">Latest professionals joining the platform</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left" style={{ background: "#F8F9FB" }}>
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
                  className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/60"
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
                          ? "bg-emerald-50 text-emerald-700"
                          : p.accountStatus === "PENDING_REVIEW"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-gray-100 text-gray-600"
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
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <div className={`rounded-xl p-2.5 ${iconBg} ${iconColor}`}>{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
        {value}
      </p>
    </div>
  );
}
