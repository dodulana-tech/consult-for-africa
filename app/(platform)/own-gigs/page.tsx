import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/platform/TopBar";
import { Plus, ChevronRight, Briefcase } from "lucide-react";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PLANNING:  { bg: "#EFF6FF", color: "#1D4ED8" },
  ACTIVE:    { bg: "#D1FAE5", color: "#065F46" },
  ON_HOLD:   { bg: "#F3F4F6", color: "#6B7280" },
  AT_RISK:   { bg: "#FEF3C7", color: "#92400E" },
  COMPLETED: { bg: "#F0FDF4", color: "#15803D" },
  CANCELLED: { bg: "#FEE2E2", color: "#991B1B" },
};

const FEE_LABELS: Record<string, string> = {
  PERCENTAGE: "% of value",
  FLAT_MONTHLY: "Flat monthly",
};

const APPROVAL_BADGES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:        { bg: "#FEF3C7", color: "#92400E", label: "Pending Approval" },
  APPROVED:       { bg: "#D1FAE5", color: "#065F46", label: "Approved" },
  NEEDS_CHANGES:  { bg: "#FFF7ED", color: "#9A3412", label: "Changes Requested" },
  REJECTED:       { bg: "#FEE2E2", color: "#991B1B", label: "Rejected" },
};

export default async function OwnGigsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const { role, id: userId } = session.user;
  const isElevated = ["DIRECTOR", "PARTNER", "ADMIN"].includes(role);

  if (role !== "CONSULTANT" && !isElevated) redirect("/dashboard");

  const where = isElevated
    ? { isOwnGig: true }
    : { isOwnGig: true, ownGigOwnerId: userId };

  const gigs = await prisma.engagement.findMany({
    where,
    include: {
      client: { select: { name: true } },
      ownGigOwner: { select: { name: true } },
      _count: { select: { assignments: true, ownGigFees: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const active = gigs.filter((g) => g.status === "ACTIVE" || g.status === "PLANNING").length;
  const totalValue = gigs.reduce((s, g) => s + Number(g.budgetAmount), 0);

  // Sum pending fees this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const pendingFees = await prisma.ownGigPlatformFee.aggregate({
    where: {
      ...(isElevated ? {} : { consultantId: userId }),
      periodStart: { gte: monthStart },
      status: "PENDING",
    },
    _sum: { feeAmount: true },
  });
  const feesThisMonth = Number(pendingFees._sum.feeAmount ?? 0);

  return (
    <>
      <TopBar title="My Gigs" subtitle="Manage your own consulting engagements" />

      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-slate-500">Active gigs</p>
              <p className="text-2xl font-bold text-[#0F2744]">{active}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total value</p>
              <p className="text-2xl font-bold text-[#0F2744]">
                ₦{totalValue.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Fees this month</p>
              <p className="text-2xl font-bold text-[#D4AF37]">
                ₦{feesThisMonth.toLocaleString()}
              </p>
            </div>
          </div>

          {role === "CONSULTANT" && (
            <Link
              href="/own-gigs/new"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "#0F2744" }}
            >
              <Plus size={16} /> New Own Gig
            </Link>
          )}
        </div>

        {/* Gig list */}
        {gigs.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-300 rounded-xl">
            <Briefcase size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">No own gigs yet.</p>
            <p className="text-slate-400 text-xs mt-1">Click &ldquo;New Own Gig&rdquo; to bring your first client on board.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Project</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Approval</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Fee Model</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">Budget</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Team</th>
                  {isElevated && <th className="text-left px-4 py-3 font-medium text-slate-500">Owner</th>}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {gigs.map((g) => {
                  const sc = STATUS_COLORS[g.status] ?? STATUS_COLORS.PLANNING;
                  return (
                    <tr key={g.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-[#0F2744]">
                        <Link href={`/projects/${g.id}`} className="hover:underline">
                          {g.name}
                        </Link>
                        {g.engagementCode && (
                          <span className="ml-2 text-xs text-slate-400">{g.engagementCode}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{g.client.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{ backgroundColor: sc.bg, color: sc.color }}
                        >
                          {g.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const ab = g.ownGigApprovalStatus ? APPROVAL_BADGES[g.ownGigApprovalStatus] : null;
                          if (!ab) return null;
                          return (
                            <div>
                              <span
                                className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                style={{ backgroundColor: ab.bg, color: ab.color }}
                              >
                                {ab.label}
                              </span>
                              {(g.ownGigApprovalStatus === "NEEDS_CHANGES" || g.ownGigApprovalStatus === "REJECTED") && g.ownGigApprovalNote && (
                                <p className="text-xs text-slate-500 mt-1 max-w-[200px] truncate" title={g.ownGigApprovalNote}>
                                  {g.ownGigApprovalNote}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                        {g.ownGigFeeModel && FEE_LABELS[g.ownGigFeeModel]}
                        {g.ownGigFeeModel === "PERCENTAGE" && g.ownGigFeePct && (
                          <span className="ml-1 font-medium">{Number(g.ownGigFeePct)}%</span>
                        )}
                        {g.ownGigFeeModel === "FLAT_MONTHLY" && g.ownGigFlatMonthlyFee && (
                          <span className="ml-1 font-medium">₦{Number(g.ownGigFlatMonthlyFee).toLocaleString()}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {g.budgetCurrency} {Number(g.budgetAmount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{g._count.assignments}</td>
                      {isElevated && (
                        <td className="px-4 py-3 text-slate-500">{g.ownGigOwner?.name ?? "—"}</td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <Link href={`/projects/${g.id}`}>
                          <ChevronRight size={16} className="text-slate-400" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
