import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PayoutActions from "./PayoutActions";
import CommissionReviewActions from "./CommissionReviewActions";

export default async function AdminAgentPayoutsPage() {
  // Fetch commissions pending review (PENDING / VERIFIED but not yet APPROVED)
  const commissionsNeedingReview = await prisma.agentCommission.findMany({
    where: {
      status: { in: ["PENDING", "VERIFIED"] },
    },
    include: {
      agent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      deal: {
        select: {
          dealCode: true,
          prospectName: true,
          prospectOrg: true,
          stage: true,
          closedValue: true,
          verifiedAt: true,
          verifiedById: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch approved commissions ready for payout
  const approvedCommissions = await prisma.agentCommission.findMany({
    where: {
      status: "APPROVED",
      payoutId: null,
    },
    include: {
      agent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          bankName: true,
          accountNumber: true,
          accountName: true,
        },
      },
      deal: {
        select: {
          dealCode: true,
          prospectName: true,
          prospectOrg: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group approved commissions by agent
  const byAgent = new Map<
    string,
    {
      agent: (typeof approvedCommissions)[0]["agent"];
      commissions: typeof approvedCommissions;
      total: number;
    }
  >();

  for (const c of approvedCommissions) {
    const existing = byAgent.get(c.agentId);
    if (existing) {
      existing.commissions.push(c);
      existing.total += Number(c.amount);
    } else {
      byAgent.set(c.agentId, {
        agent: c.agent,
        commissions: [c],
        total: Number(c.amount),
      });
    }
  }

  const agentGroups = Array.from(byAgent.values());

  // Fetch existing payouts
  const payouts = await prisma.agentPayout.findMany({
    include: {
      agent: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          bankName: true,
          accountNumber: true,
          accountName: true,
        },
      },
      commissions: {
        select: { id: true, amount: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/agents"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Agents
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
          Agent Payouts
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Review commissions, approve them, then process payouts.
        </p>
      </div>

      {/* Commissions Needing Review */}
      <div className="rounded-2xl bg-white shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <div className="border-b px-6 py-5" style={{ borderColor: "#E8EBF0" }}>
          <h2 className="text-base font-bold" style={{ color: "#0F2744" }}>
            Commissions Pending Review ({commissionsNeedingReview.length})
          </h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Verify the deal, then approve the commission before it can be paid out.
          </p>
        </div>

        {commissionsNeedingReview.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            No commissions pending review.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left" style={{ background: "#F8F9FB" }}>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Deal</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Agent</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Amount</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Deal Verified</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {commissionsNeedingReview.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{c.deal.dealCode}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {c.deal.prospectName}
                        {c.deal.prospectOrg ? ` - ${c.deal.prospectOrg}` : ""}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{c.agent.firstName} {c.agent.lastName}</p>
                      <p className="text-xs text-gray-400">{c.agent.email}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold" style={{ color: "#0F2744" }}>
                      {formatNGN(Number(c.amount))}
                    </td>
                    <td className="px-6 py-4">
                      {c.deal.verifiedAt ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          Not verified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <CommissionStatusBadge status={c.status} />
                    </td>
                    <td className="px-6 py-4">
                      <CommissionReviewActions
                        commissionId={c.id}
                        dealId={c.deal.dealCode}
                        currentStatus={c.status}
                        dealVerified={!!c.deal.verifiedAt}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approved Commissions Ready for Payout */}
      <div className="rounded-2xl bg-white shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <div className="border-b px-6 py-5" style={{ borderColor: "#E8EBF0" }}>
          <h2 className="text-base font-bold" style={{ color: "#0F2744" }}>
            Approved Commissions Ready for Payout ({approvedCommissions.length})
          </h2>
        </div>

        {agentGroups.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            No approved commissions waiting for payout.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#E8EBF0" }}>
            {agentGroups.map((group) => (
              <div key={group.agent.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {group.agent.firstName} {group.agent.lastName}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{group.agent.email}</p>
                    {group.agent.bankName && (
                      <p className="mt-1 text-xs text-gray-500">
                        {group.agent.bankName} / {group.agent.accountNumber} / {group.agent.accountName}
                      </p>
                    )}
                    {!group.agent.bankName && (
                      <p className="mt-1 text-xs text-amber-600 font-medium">
                        No bank details on file
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: "#0F2744" }}>
                      {formatNGN(group.total)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {group.commissions.length} commission{group.commissions.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Commission details */}
                <div className="mt-3 space-y-1.5">
                  {group.commissions.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
                      <div>
                        <span className="font-semibold text-gray-700">{c.deal.dealCode}</span>
                        <span className="mx-1.5 text-gray-300">-</span>
                        <span className="text-gray-500">{c.deal.prospectName}</span>
                        {c.deal.prospectOrg && (
                          <span className="text-gray-400"> ({c.deal.prospectOrg})</span>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900">{formatNGN(Number(c.amount))}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <PayoutActions
                    type="create"
                    commissionIds={group.commissions.map((c) => c.id)}
                    agentName={`${group.agent.firstName} ${group.agent.lastName}`}
                    total={group.total}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Existing Payouts */}
      <div className="rounded-2xl bg-white shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <div className="border-b px-6 py-5" style={{ borderColor: "#E8EBF0" }}>
          <h2 className="text-base font-bold" style={{ color: "#0F2744" }}>
            Payout History ({payouts.length})
          </h2>
        </div>

        {payouts.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            No payouts created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left" style={{ background: "#F8F9FB" }}>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Code</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Agent</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Amount</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Bank</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-4 font-semibold text-gray-900">{p.payoutCode}</td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{p.agent.firstName} {p.agent.lastName}</p>
                      <p className="text-xs text-gray-400">{p.agent.email}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold" style={{ color: "#0F2744" }}>
                      {formatNGN(Number(p.totalAmount))}
                    </td>
                    <td className="px-6 py-4">
                      {p.bankName ? (
                        <div>
                          <p className="text-gray-700">{p.bankName}</p>
                          <p className="text-xs text-gray-400">{p.accountNumber} / {p.accountName}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <PayoutStatusBadge status={p.status} />
                    </td>
                    <td className="px-6 py-4">
                      <PayoutActions
                        type="update"
                        payoutId={p.id}
                        currentStatus={p.status}
                      />
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

function CommissionStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    PENDING: { bg: "bg-amber-50", color: "text-amber-700" },
    VERIFIED: { bg: "bg-blue-50", color: "text-blue-700" },
    APPROVED: { bg: "bg-emerald-50", color: "text-emerald-700" },
    PROCESSING: { bg: "bg-indigo-50", color: "text-indigo-700" },
    PAID: { bg: "bg-green-50", color: "text-green-700" },
    DISPUTED: { bg: "bg-red-50", color: "text-red-600" },
    CANCELLED: { bg: "bg-gray-100", color: "text-gray-500" },
  };

  const s = styles[status] ?? styles.PENDING;

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.color}`}>
      {status}
    </span>
  );
}

function PayoutStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    PENDING: { bg: "bg-amber-50", color: "text-amber-700" },
    PROCESSING: { bg: "bg-blue-50", color: "text-blue-700" },
    PAID: { bg: "bg-emerald-50", color: "text-emerald-700" },
  };

  const s = styles[status] ?? styles.PENDING;

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.color}`}>
      {status}
    </span>
  );
}

function formatNGN(amount: number): string {
  if (amount === 0) return "N0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
