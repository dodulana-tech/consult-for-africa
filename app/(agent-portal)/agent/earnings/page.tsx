import { getAgentSession } from "@/lib/agentPortalAuth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING: { bg: "bg-gray-100", color: "text-gray-600", label: "Pending" },
  VERIFIED: { bg: "bg-blue-50", color: "text-blue-700", label: "Verified" },
  APPROVED: { bg: "bg-emerald-50", color: "text-emerald-700", label: "Approved" },
  PROCESSING: { bg: "bg-amber-50", color: "text-amber-700", label: "Processing" },
  PAID: { bg: "bg-emerald-50", color: "text-emerald-700", label: "Paid" },
  DISPUTED: { bg: "bg-red-50", color: "text-red-600", label: "Disputed" },
  CANCELLED: { bg: "bg-gray-100", color: "text-gray-500", label: "Cancelled" },
};

export default async function AgentEarningsPage() {
  const session = await getAgentSession();
  if (!session) redirect("/agent/login");

  const [commissions, totals, agent] = await Promise.all([
    prisma.agentCommission.findMany({
      where: { agentId: session.sub },
      orderBy: { createdAt: "desc" },
      include: { deal: { select: { prospectName: true, prospectOrg: true } } },
    }),
    prisma.agentCommission.groupBy({
      by: ["status"],
      where: { agentId: session.sub },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.salesAgent.findUnique({
      where: { id: session.sub },
      select: { totalCommission: true },
    }),
  ]);

  const pending = totals.find((t) => t.status === "PENDING")?._sum.amount ?? 0;
  const approved = totals.find((t) => t.status === "APPROVED")?._sum.amount ?? 0;
  const paid = totals.find((t) => t.status === "PAID")?._sum.amount ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
          Earnings
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Commission history and payout tracking
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Earned</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{formatNGN(Number(agent?.totalCommission ?? 0))}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Pending</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: "#0F2744" }}>{formatNGN(Number(pending))}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Approved</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: "#D4AF37" }}>{formatNGN(Number(approved))}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Paid Out</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{formatNGN(Number(paid))}</p>
        </div>
      </div>

      {/* Commission table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b px-6 py-5" style={{ borderColor: "#E8EBF0" }}>
          <h2 className="text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
            Commission History
          </h2>
        </div>
        {commissions.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No commissions yet. Close your first deal to earn.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left" style={{ background: "#F8F9FB" }}>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Deal</th>
                  <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 sm:table-cell">Type</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Amount</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="hidden px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => {
                  const s = STATUS_STYLES[c.status] ?? STATUS_STYLES.PENDING;
                  return (
                    <tr key={c.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{c.deal.prospectName}</p>
                        {c.deal.prospectOrg && (
                          <p className="mt-0.5 text-xs text-gray-400">{c.deal.prospectOrg}</p>
                        )}
                      </td>
                      <td className="hidden px-6 py-4 text-xs text-gray-500 sm:table-cell">
                        {c.commissionType.replace(/_/g, " ")}
                      </td>
                      <td className="px-6 py-4 font-bold" style={{ color: "#059669" }}>
                        {formatNGN(Number(c.amount))}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.color}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="hidden px-6 py-4 text-gray-400 md:table-cell">
                        {c.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function formatNGN(amount: number): string {
  if (amount === 0) return "N0";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}
