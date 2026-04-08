import { getAgentSession } from "@/lib/agentPortalAuth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DealStageUpdater from "./DealStageUpdater";

const STAGE_ORDER = ["PROSPECT", "CONTACTED", "PITCHED", "NEGOTIATING", "VERBAL_COMMIT", "CLOSED_WON"];

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

export default async function AgentDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAgentSession();
  if (!session) redirect("/agent/login");

  const { id } = await params;

  const deal = await prisma.agentDeal.findUnique({
    where: { id },
    include: {
      opportunity: { select: { title: true, commissionType: true, commissionValue: true } },
      commissions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!deal || deal.agentId !== session.sub) notFound();

  const stageHistory = (deal.stageHistory as Array<{ stage: string; changedAt: string; notes?: string }>) ?? [];
  const isClosed = ["CLOSED_WON", "CLOSED_LOST", "DISQUALIFIED"].includes(deal.stage);
  const currentStageIndex = STAGE_ORDER.indexOf(deal.stage);

  return (
    <div className="space-y-6">
      <Link
        href="/agent/deals"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-600"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All Deals
      </Link>

      {/* Hero */}
      <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
              {deal.prospectName}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {deal.opportunity.title}
              {deal.prospectOrg ? ` / ${deal.prospectOrg}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">{deal.dealCode}</p>
          </div>
          <span
            className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold"
            style={{
              background: STAGE_STYLES[deal.stage]?.bg ?? "#F3F4F6",
              color: STAGE_STYLES[deal.stage]?.color ?? "#6B7280",
            }}
          >
            {deal.stage.replace(/_/g, " ")}
          </span>
        </div>

        {/* Stage progress */}
        {!isClosed && (
          <div className="mt-6">
            <div className="flex gap-1">
              {STAGE_ORDER.map((stage, idx) => (
                <div key={stage} className="flex-1">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      background: idx <= currentStageIndex ? "#0F2744" : "#E5E7EB",
                    }}
                  />
                  <p className="mt-1 text-[10px] text-center" style={{ color: idx <= currentStageIndex ? "#0F2744" : "#9CA3AF" }}>
                    {stage.replace(/_/g, " ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Prospect info */}
          <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
            <h2 className="mb-4 text-base font-bold" style={{ color: "#0F2744" }}>Prospect Information</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs font-medium text-gray-400">Name</dt>
                <dd className="text-gray-900">{deal.prospectName}</dd>
              </div>
              {deal.prospectOrg && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Organisation</dt>
                  <dd className="text-gray-900">{deal.prospectOrg}</dd>
                </div>
              )}
              {deal.prospectEmail && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Email</dt>
                  <dd className="text-gray-900">{deal.prospectEmail}</dd>
                </div>
              )}
              {deal.prospectPhone && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Phone</dt>
                  <dd className="text-gray-900">{deal.prospectPhone}</dd>
                </div>
              )}
              {deal.prospectTitle && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Title</dt>
                  <dd className="text-gray-900">{deal.prospectTitle}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Stage history */}
          {stageHistory.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
              <h2 className="mb-4 text-base font-bold" style={{ color: "#0F2744" }}>Activity History</h2>
              <div className="space-y-0">
                {stageHistory.map((entry, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: "#0F2744" }} />
                      {idx < stageHistory.length - 1 && (
                        <div className="my-1 w-0.5 flex-1" style={{ background: "#E5E7EB", minHeight: 20 }} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-semibold text-gray-900">{entry.stage.replace(/_/g, " ")}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(entry.changedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {entry.notes && <p className="mt-1 text-xs text-gray-500">{entry.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commissions */}
          {deal.commissions.length > 0 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
              <h2 className="mb-4 text-base font-bold" style={{ color: "#0F2744" }}>Commission</h2>
              {deal.commissions.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-emerald-600">
                      {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(c.amount))}
                    </p>
                    <p className="text-xs text-gray-500">{c.commissionType.replace(/_/g, " ").toLowerCase()}</p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{
                      background: c.status === "PAID" ? "#D1FAE5" : c.status === "APPROVED" ? "#EFF6FF" : "#F3F4F6",
                      color: c.status === "PAID" ? "#065F46" : c.status === "APPROVED" ? "#1D4ED8" : "#6B7280",
                    }}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar - actions */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
            <h2 className="mb-3 text-base font-bold" style={{ color: "#0F2744" }}>Deal Value</h2>
            <p className="text-3xl font-bold" style={{ color: "#0F2744" }}>
              {deal.dealValue
                ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(deal.dealValue))
                : "Not set"}
            </p>
            {deal.closedValue && deal.stage === "CLOSED_WON" && (
              <p className="mt-1 text-sm text-emerald-600 font-semibold">
                Closed: {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(deal.closedValue))}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Commission: {deal.opportunity.commissionType === "PERCENTAGE"
                ? `${Number(deal.opportunity.commissionValue)}% of deal value`
                : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(deal.opportunity.commissionValue)) + " per deal"}
            </p>
          </div>

          {!isClosed && (
            <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
              <h2 className="mb-3 text-base font-bold" style={{ color: "#0F2744" }}>Update Deal</h2>
              <DealStageUpdater dealId={deal.id} currentStage={deal.stage} />
            </div>
          )}

          {deal.notes && (
            <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
              <h2 className="mb-3 text-base font-bold" style={{ color: "#0F2744" }}>Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{deal.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
