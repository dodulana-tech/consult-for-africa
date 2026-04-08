import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, UserCheck, Clock, UserX } from "lucide-react";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  APPLIED: { bg: "bg-blue-50", color: "text-blue-700", label: "Applied" },
  VETTING: { bg: "bg-amber-50", color: "text-amber-700", label: "Vetting" },
  APPROVED: { bg: "bg-emerald-50", color: "text-emerald-700", label: "Approved" },
  SUSPENDED: { bg: "bg-red-50", color: "text-red-600", label: "Suspended" },
  DEACTIVATED: { bg: "bg-gray-100", color: "text-gray-500", label: "Deactivated" },
};

export default async function AdminAgentsPage() {
  const [agents, totalApplied, totalApproved, totalSuspended] = await Promise.all([
    prisma.salesAgent.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        company: true,
        state: true,
        status: true,
        industries: true,
        totalDeals: true,
        totalCommission: true,
        createdAt: true,
      },
    }),
    prisma.salesAgent.count({ where: { status: "APPLIED" } }),
    prisma.salesAgent.count({ where: { status: "APPROVED" } }),
    prisma.salesAgent.count({ where: { status: "SUSPENDED" } }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Sales Agents
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">{agents.length} total agents</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Agents" value={agents.length} icon={<Users className="h-5 w-5" />} iconBg="bg-[#0B3C5D]/8" iconColor="text-[#0B3C5D]" />
        <StatCard label="Pending Review" value={totalApplied} icon={<Clock className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" />
        <StatCard label="Approved" value={totalApproved} icon={<UserCheck className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard label="Suspended" value={totalSuspended} icon={<UserX className="h-5 w-5" />} iconBg="bg-red-50" iconColor="text-red-500" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left" style={{ background: "#F8F9FB" }}>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Agent</th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 md:table-cell">Company</th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 sm:table-cell">State</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 lg:table-cell">Deals</th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 lg:table-cell">Commission</th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 md:table-cell">Applied</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => {
                const s = STATUS_STYLES[agent.status] ?? STATUS_STYLES.APPLIED;
                return (
                  <tr key={agent.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/60">
                    <td className="px-6 py-4">
                      <Link href={`/admin/agents/${agent.id}`} className="font-semibold hover:underline" style={{ color: "#0B3C5D" }}>
                        {agent.firstName} {agent.lastName}
                      </Link>
                      <div className="mt-0.5 text-xs text-gray-400">{agent.email}</div>
                    </td>
                    <td className="hidden px-6 py-4 text-gray-600 md:table-cell">{agent.company || "-"}</td>
                    <td className="hidden px-6 py-4 text-gray-600 sm:table-cell">{agent.state || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.color}`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="hidden px-6 py-4 font-semibold lg:table-cell" style={{ color: "#0F2744" }}>{agent.totalDeals}</td>
                    <td className="hidden px-6 py-4 font-semibold text-emerald-600 lg:table-cell">
                      {Number(agent.totalCommission) > 0
                        ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(agent.totalCommission))
                        : "-"}
                    </td>
                    <td className="hidden px-6 py-4 text-gray-400 md:table-cell">
                      {agent.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                );
              })}
              {agents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    No agents yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, iconBg, iconColor }: { label: string; value: number; icon: React.ReactNode; iconBg: string; iconColor: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <div className={`rounded-xl p-2.5 ${iconBg} ${iconColor}`}>{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight" style={{ color: "#0F2744" }}>{value}</p>
    </div>
  );
}
