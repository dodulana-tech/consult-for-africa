import { getAgentSession } from "@/lib/agentPortalAuth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ApplyButton from "./ApplyButton";
import WithdrawButton from "./WithdrawButton";

export default async function AgentOpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAgentSession();
  if (!session) redirect("/agent/login");

  const { id } = await params;

  const opportunity = await prisma.agentOpportunity.findUnique({
    where: { id },
    include: {
      _count: { select: { assignments: true, deals: true } },
      assignments: {
        where: { agentId: session.sub },
        select: { status: true, id: true },
      },
    },
  });

  if (!opportunity) notFound();

  const myAssignment = opportunity.assignments[0] ?? null;
  const isActive = myAssignment?.status === "ACTIVE";

  return (
    <div className="space-y-6">
      <Link
        href="/agent/opportunities"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-600"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All Opportunities
      </Link>

      {/* Hero */}
      <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
              {opportunity.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {opportunity.clientName} / {opportunity.productType}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">{opportunity.opportunityCode}</p>
          </div>
          <span
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{
              background: opportunity.status === "OPEN" ? "#D1FAE5" : "#F3F4F6",
              color: opportunity.status === "OPEN" ? "#065F46" : "#6B7280",
            }}
          >
            {opportunity.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
            <h2 className="mb-3 text-base font-bold" style={{ color: "#0F2744" }}>Description</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{opportunity.description}</p>
          </div>

          {opportunity.targetDescription && (
            <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
              <h2 className="mb-3 text-base font-bold" style={{ color: "#0F2744" }}>Target Audience</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{opportunity.targetDescription}</p>
            </div>
          )}

          {(opportunity.pitchDeckUrl || opportunity.briefingDocUrl) && (
            <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
              <h2 className="mb-3 text-base font-bold" style={{ color: "#0F2744" }}>Resources</h2>
              <div className="flex flex-wrap gap-3">
                {opportunity.pitchDeckUrl && (
                  <a href={opportunity.pitchDeckUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                    Pitch Deck
                  </a>
                )}
                {opportunity.briefingDocUrl && (
                  <a href={opportunity.briefingDocUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                    Briefing Document
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Commission */}
          <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
            <h2 className="mb-3 text-base font-bold" style={{ color: "#0F2744" }}>Commission</h2>
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: "#D4AF37" }}>
                {opportunity.commissionType === "PERCENTAGE"
                  ? `${Number(opportunity.commissionValue)}%`
                  : new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(opportunity.commissionValue))}
              </p>
              <p className="mt-1 text-xs text-gray-500">{opportunity.commissionType.replace(/_/g, " ").toLowerCase()}</p>
            </div>
            {(opportunity.expectedDealValueMin || opportunity.expectedDealValueMax) && (
              <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-center text-xs text-gray-500">
                Expected deal value: {opportunity.expectedDealValueMin ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(opportunity.expectedDealValueMin)) : "N/A"} - {opportunity.expectedDealValueMax ? new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(Number(opportunity.expectedDealValueMax)) : "N/A"}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
            <h2 className="mb-3 text-base font-bold" style={{ color: "#0F2744" }}>Details</h2>
            <dl className="space-y-2 text-sm">
              {opportunity.territories.length > 0 && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Territories</dt>
                  <dd className="text-gray-900">{opportunity.territories.join(", ")}</dd>
                </div>
              )}
              {opportunity.targetIndustries.length > 0 && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">Industries</dt>
                  <dd className="text-gray-900">{opportunity.targetIndustries.join(", ")}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-gray-400">Agents</dt>
                <dd className="text-gray-900">
                  {opportunity._count.assignments} assigned
                  {opportunity.maxAgents ? ` / ${opportunity.maxAgents} max` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-400">Start Date</dt>
                <dd className="text-gray-900">{opportunity.startDate.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</dd>
              </div>
              {opportunity.endDate && (
                <div>
                  <dt className="text-xs font-medium text-gray-400">End Date</dt>
                  <dd className="text-gray-900">{opportunity.endDate.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Apply / Status */}
          <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
            {!myAssignment && opportunity.status === "OPEN" && (
              <ApplyButton opportunityId={opportunity.id} />
            )}
            {myAssignment && (
              <div className="text-center">
                <span
                  className="inline-flex rounded-full px-4 py-2 text-sm font-semibold"
                  style={{
                    background: isActive ? "#D1FAE5" : "#EFF6FF",
                    color: isActive ? "#065F46" : "#1D4ED8",
                  }}
                >
                  {isActive ? "You are active on this opportunity" : "Application pending review"}
                </span>
                {isActive && (
                  <Link
                    href="/agent/deals"
                    className="mt-4 block rounded-xl py-2.5 text-center text-sm font-semibold text-white"
                    style={{ background: "#0F2744" }}
                  >
                    View My Deals
                  </Link>
                )}
                <WithdrawButton opportunityId={opportunity.id} />
              </div>
            )}
            {opportunity.status !== "OPEN" && !myAssignment && (
              <p className="text-center text-sm text-gray-400">
                This opportunity is not accepting applications.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
