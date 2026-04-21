import { getAgentSession } from "@/lib/agentPortalAuth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AgentDashboardPage() {
  const session = await getAgentSession();
  if (!session) redirect("/agent/login");

  const agent = await prisma.salesAgent.findUnique({
    where: { id: session.sub },
    select: {
      firstName: true,
      status: true,
      totalDeals: true,
      totalRevenue: true,
      totalCommission: true,
    },
  });

  if (!agent) redirect("/agent/login");

  // Pending review state
  if (agent.status === "APPLIED" || agent.status === "VETTING") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{ background: "#FEF9E7" }}
        >
          <svg className="h-10 w-10" style={{ color: "#D4AF37" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
          Application Under Review
        </h1>
        <p className="mt-3 max-w-md text-sm text-gray-500 leading-relaxed">
          Thank you for applying, {agent.firstName}. Our team is reviewing your application.
          You will receive an email once you have been approved and can start taking on opportunities.
        </p>
        <div className="mt-6 rounded-xl bg-white px-6 py-4 text-sm text-gray-600" style={{ border: "1px solid #E8EBF0" }}>
          Status: <span className="font-semibold text-amber-600">{agent.status === "APPLIED" ? "Submitted" : "Under Vetting"}</span>
        </div>
      </div>
    );
  }

  // Active agent dashboard
  const [activeAssignments, pipelineDeals, pendingCommissions, recentDeals] = await Promise.all([
    prisma.agentOpportunityAssignment.count({
      where: { agentId: session.sub, status: "ACTIVE" },
    }),
    prisma.agentDeal.count({
      where: {
        agentId: session.sub,
        stage: { notIn: ["CLOSED_WON", "CLOSED_LOST", "DISQUALIFIED"] },
      },
    }),
    prisma.agentCommission.aggregate({
      where: { agentId: session.sub, status: { in: ["PENDING", "VERIFIED", "APPROVED"] } },
      _sum: { amount: true },
    }),
    prisma.agentDeal.findMany({
      where: { agentId: session.sub },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { opportunity: { select: { title: true } } },
    }),
  ]);

  const pendingAmount = Number(pendingCommissions._sum.amount ?? 0);

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
          {greeting}, {agent.firstName}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Here is your sales performance overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Opportunities" value={activeAssignments} accent="#0F2744" />
        <StatCard label="Deals in Pipeline" value={pipelineDeals} accent="#D4AF37" />
        <StatCard label="Total Deals Won" value={agent.totalDeals} accent="#059669" />
        <StatCard
          label="Pending Commission"
          value={formatNGN(pendingAmount)}
          accent="#D4AF37"
        />
      </div>

      {/* Earnings summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid #E8EBF0" }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Revenue Generated</p>
          <p className="mt-2 text-3xl font-bold" style={{ color: "#0F2744" }}>
            {formatNGN(Number(agent.totalRevenue))}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6" style={{ border: "1px solid #E8EBF0" }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Total Commission Earned</p>
          <p className="mt-2 text-3xl font-bold" style={{ color: "#059669" }}>
            {formatNGN(Number(agent.totalCommission))}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/agent/opportunities"
          className="group rounded-2xl bg-white p-6 transition hover:shadow-md"
          style={{ border: "1px solid #E8EBF0" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>Browse Opportunities</p>
          <p className="mt-1 text-xs text-gray-500">Find new opportunities to earn commission</p>
        </Link>
        <Link
          href="/agent/deals"
          className="group rounded-2xl bg-white p-6 transition hover:shadow-md"
          style={{ border: "1px solid #E8EBF0" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>My Deal Pipeline</p>
          <p className="mt-1 text-xs text-gray-500">Track and manage your active deals</p>
        </Link>
        <Link
          href="/agent/earnings"
          className="group rounded-2xl bg-white p-6 transition hover:shadow-md"
          style={{ border: "1px solid #E8EBF0" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>Earnings</p>
          <p className="mt-1 text-xs text-gray-500">View commissions and payout history</p>
        </Link>
      </div>

      {/* Recent deals */}
      {recentDeals.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <div className="border-b px-6 py-5" style={{ borderColor: "#E8EBF0" }}>
            <h2 className="text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
              Recent Deals
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
            {recentDeals.map((deal) => (
              <Link
                key={deal.id}
                href={`/agent/deals/${deal.id}`}
                className="flex items-center justify-between px-6 py-4 transition hover:bg-gray-50/60"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{deal.prospectName}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {deal.opportunity.title} {deal.prospectOrg ? `/ ${deal.prospectOrg}` : ""}
                  </p>
                </div>
                <StageBadge stage={deal.stage} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold" style={{ color: accent }}>{value}</p>
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    PROSPECT: { bg: "#F3F4F6", color: "#6B7280" },
    CONTACTED: { bg: "#EFF6FF", color: "#1D4ED8" },
    PITCHED: { bg: "#FEF3C7", color: "#92400E" },
    NEGOTIATING: { bg: "#FDE68A", color: "#92400E" },
    VERBAL_COMMIT: { bg: "#D1FAE5", color: "#065F46" },
    CLOSED_WON: { bg: "#D1FAE5", color: "#065F46" },
    CLOSED_LOST: { bg: "#FEE2E2", color: "#991B1B" },
    DISQUALIFIED: { bg: "#F3F4F6", color: "#9CA3AF" },
  };
  const s = styles[stage] ?? styles.PROSPECT;
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      {stage.replace(/_/g, " ")}
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
