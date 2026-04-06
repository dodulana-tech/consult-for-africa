import { prisma } from "@/lib/prisma";
import Link from "next/link";

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CadreHealth</h1>
          <p className="text-gray-500">Healthcare workforce platform</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/cadrehealth/mandates"
            className="rounded-lg bg-[#0B3C5D] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A3350]"
          >
            Manage Mandates
          </Link>
          <Link
            href="/admin/cadrehealth/import"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Import Professionals
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Professionals" value={totalProfessionals} />
        <StatCard label="Verified" value={verified} />
        <StatCard label="Open Mandates" value={openMandates} />
        <StatCard label="Hospital Reviews" value={totalReviews} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Salary Reports" value={totalSalaryReports} />
        <StatCard
          label="Verification Rate"
          value={
            totalProfessionals > 0
              ? `${Math.round((verified / totalProfessionals) * 100)}%`
              : "0%"
          }
        />
      </div>

      {/* By cadre */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold text-gray-900">By Cadre</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {byCadre.map((g) => (
            <div key={g.cadre} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-sm text-gray-700">{g.cadre.replace(/_/g, " ")}</span>
              <span className="text-sm font-semibold text-gray-900">{g._count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent signups */}
      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-4 font-semibold text-gray-900">Recent Signups</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Cadre</th>
                <th className="pb-2 font-medium">State</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentSignups.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-3">
                    <Link href={`/admin/cadrehealth/${p.id}`} className="font-medium text-[#0B3C5D] hover:underline">
                      {p.firstName} {p.lastName}
                    </Link>
                    <div className="text-xs text-gray-400">{p.email}</div>
                  </td>
                  <td className="py-3 text-gray-600">{p.cadre.replace(/_/g, " ")}</td>
                  <td className="py-3 text-gray-600">{p.state || "N/A"}</td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.accountStatus === "VERIFIED"
                          ? "bg-emerald-100 text-emerald-700"
                          : p.accountStatus === "PENDING_REVIEW"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.accountStatus}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400">
                    {p.createdAt.toLocaleDateString()}
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

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}
