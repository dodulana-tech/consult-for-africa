import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Briefcase, Users, TrendingUp, DollarSign } from "lucide-react";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "bg-gray-100", color: "text-gray-600" },
  OPEN: { bg: "bg-emerald-50", color: "text-emerald-700" },
  ASSIGNED: { bg: "bg-blue-50", color: "text-blue-700" },
  PAUSED: { bg: "bg-amber-50", color: "text-amber-700" },
  CLOSED: { bg: "bg-gray-100", color: "text-gray-500" },
  COMPLETED: { bg: "bg-emerald-50", color: "text-emerald-700" },
};

export default async function AdminAgentOpportunitiesPage() {
  const [opportunities, totalOpen, totalAgentsAssigned, totalDeals] = await Promise.all([
    prisma.agentOpportunity.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { assignments: true, deals: true } },
        client: { select: { name: true } },
      },
    }),
    prisma.agentOpportunity.count({ where: { status: "OPEN" } }),
    prisma.agentOpportunityAssignment.count({ where: { status: "ACTIVE" } }),
    prisma.agentDeal.count({ where: { stage: "CLOSED_WON" } }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Agent Opportunities
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage commission-based sales opportunities
          </p>
        </div>
        <Link
          href="/admin/agent-opportunities/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0B3C5D] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0A3350] hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Create Opportunity
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Opportunities" value={opportunities.length} icon={<Briefcase className="h-5 w-5" />} iconBg="bg-[#0B3C5D]/8" iconColor="text-[#0B3C5D]" />
        <StatCard label="Open" value={totalOpen} icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <StatCard label="Agents Assigned" value={totalAgentsAssigned} icon={<Users className="h-5 w-5" />} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <StatCard label="Deals Won" value={totalDeals} icon={<DollarSign className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left" style={{ background: "#F8F9FB" }}>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Opportunity</th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 md:table-cell">Client</th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 sm:table-cell">Commission</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 lg:table-cell">Agents</th>
                <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 lg:table-cell">Deals</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp) => {
                const s = STATUS_STYLES[opp.status] ?? STATUS_STYLES.DRAFT;
                return (
                  <tr key={opp.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/60">
                    <td className="px-6 py-4">
                      <Link href={`/admin/agent-opportunities/${opp.id}`} className="font-semibold hover:underline" style={{ color: "#0B3C5D" }}>
                        {opp.title}
                      </Link>
                      <div className="mt-0.5 text-xs text-gray-400">
                        {opp.opportunityCode} / {opp.productType}
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 text-gray-600 md:table-cell">
                      {opp.client?.name ?? opp.clientName}
                    </td>
                    <td className="hidden px-6 py-4 sm:table-cell">
                      <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                        {opp.commissionType === "PERCENTAGE" || opp.commissionType === "TIERED"
                          ? `Up to ${Number(opp.commissionValue)}%`
                          : opp.commissionType === "RECURRING"
                          ? `${Number(opp.commissionValue)}% recurring`
                          : opp.commissionType === "FIXED_PER_DEAL"
                          ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(opp.commissionValue))
                          : `${Number(opp.commissionValue)}%`}
                      </span>
                      <div className="text-[10px] text-gray-400">{opp.commissionType.replace(/_/g, " ").toLowerCase()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.color}`}>
                        {opp.status}
                      </span>
                    </td>
                    <td className="hidden px-6 py-4 font-semibold lg:table-cell" style={{ color: "#0F2744" }}>
                      {opp._count.assignments}
                    </td>
                    <td className="hidden px-6 py-4 font-semibold lg:table-cell" style={{ color: "#0F2744" }}>
                      {opp._count.deals}
                    </td>
                  </tr>
                );
              })}
              {opportunities.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                    No opportunities yet. Create your first one.
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
