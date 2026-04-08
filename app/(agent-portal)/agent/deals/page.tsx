import { getAgentSession } from "@/lib/agentPortalAuth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const STAGE_STYLES: Record<string, { bg: string; color: string }> = {
  PROSPECT: { bg: "#F3F4F6", color: "#6B7280" },
  CONTACTED: { bg: "#EFF6FF", color: "#1D4ED8" },
  PITCHED: { bg: "#FEF3C7", color: "#92400E" },
  NEGOTIATING: { bg: "#FDE68A", color: "#92400E" },
  VERBAL_COMMIT: { bg: "#D1FAE5", color: "#065F46" },
  CLOSED_WON: { bg: "#D1FAE5", color: "#065F46" },
  CLOSED_LOST: { bg: "#FEE2E2", color: "#991B1B" },
  DISQUALIFIED: { bg: "#F3F4F6", color: "#9CA3AF" },
};

export default async function AgentDealsPage() {
  const session = await getAgentSession();
  if (!session) redirect("/agent/login");

  const deals = await prisma.agentDeal.findMany({
    where: { agentId: session.sub },
    orderBy: { updatedAt: "desc" },
    include: { opportunity: { select: { title: true } } },
  });

  const active = deals.filter((d) => !["CLOSED_WON", "CLOSED_LOST", "DISQUALIFIED"].includes(d.stage));
  const closed = deals.filter((d) => ["CLOSED_WON", "CLOSED_LOST", "DISQUALIFIED"].includes(d.stage));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
            My Deals
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {active.length} active, {closed.length} closed
          </p>
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="rounded-2xl bg-white p-16 text-center" style={{ border: "1px solid #E8EBF0" }}>
          <p className="text-sm text-gray-400">No deals yet. Apply to an opportunity and start logging deals.</p>
          <Link
            href="/agent/opportunities"
            className="mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "#0F2744" }}
          >
            Browse Opportunities
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => {
            const s = STAGE_STYLES[deal.stage] ?? STAGE_STYLES.PROSPECT;
            return (
              <Link
                key={deal.id}
                href={`/agent/deals/${deal.id}`}
                className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
                style={{ border: "1px solid #E8EBF0" }}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{deal.prospectName}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {deal.opportunity.title}
                    {deal.prospectOrg ? ` / ${deal.prospectOrg}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {deal.dealValue && (
                    <span className="text-sm font-bold" style={{ color: "#0F2744" }}>
                      {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(deal.dealValue))}
                    </span>
                  )}
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {deal.stage.replace(/_/g, " ")}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
