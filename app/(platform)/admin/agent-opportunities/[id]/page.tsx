import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import OpportunityStatusActions from "./OpportunityStatusActions";
import AssignmentActions from "./AssignmentActions";

export default async function AdminOpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const opp = await prisma.agentOpportunity.findUnique({
    where: { id },
    include: {
      client: { select: { name: true } },
      engagement: { select: { name: true } },
      assignments: {
        include: {
          agent: { select: { id: true, firstName: true, lastName: true, email: true, state: true, totalDeals: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      deals: {
        include: {
          agent: { select: { firstName: true, lastName: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      },
    },
  });

  if (!opp) notFound();

  const totalDealValue = opp.deals
    .filter((d) => d.stage === "CLOSED_WON")
    .reduce((sum, d) => sum + Number(d.closedValue ?? 0), 0);

  return (
    <div className="space-y-6">
      <Link href="/admin/agent-opportunities" className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-600">
        <ArrowLeft className="h-3.5 w-3.5" />
        All Opportunities
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>{opp.title}</h1>
          <p className="mt-0.5 text-sm text-gray-500">{opp.opportunityCode} / {opp.clientName} / {opp.productType}</p>
        </div>
        <OpportunityStatusActions opportunityId={opp.id} currentStatus={opp.status} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Agents" value={opp.assignments.length} />
        <Stat label="Deals" value={opp.deals.length} />
        <Stat label="Won" value={opp.deals.filter((d) => d.stage === "CLOSED_WON").length} />
        <Stat label="Revenue" value={formatNGN(totalDealValue)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details */}
        <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <h2 className="mb-4 text-base font-bold" style={{ color: "#0F2744" }}>Details</h2>
          <dl className="space-y-2.5 text-sm">
            <Row label="Commission" value={opp.commissionType === "PERCENTAGE" ? `${Number(opp.commissionValue)}%` : formatNGN(Number(opp.commissionValue))} />
            <Row label="Type" value={opp.commissionType.replace(/_/g, " ")} />
            <Row label="Territories" value={opp.territories.join(", ") || "Any"} />
            <Row label="Industries" value={opp.targetIndustries.join(", ") || "Any"} />
            <Row label="Engagement" value={opp.engagement?.name ?? "Not linked"} />
            <Row label="Start" value={opp.startDate.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} />
            {opp.endDate && <Row label="End" value={opp.endDate.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} />}
            {opp.maxAgents && <Row label="Max Agents" value={String(opp.maxAgents)} />}
          </dl>
          {opp.description && (
            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{opp.description}</p>
            </div>
          )}
        </div>

        {/* Agents */}
        <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <h2 className="mb-4 text-base font-bold" style={{ color: "#0F2744" }}>
            Agents ({opp.assignments.length})
          </h2>
          {opp.assignments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No agents assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {opp.assignments.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                  <div>
                    <Link href={`/admin/agents/${a.agent.id}`} className="text-sm font-semibold hover:underline" style={{ color: "#0B3C5D" }}>
                      {a.agent.firstName} {a.agent.lastName}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-400">{a.agent.email} / {a.agent.state ?? "N/A"}</p>
                  </div>
                  <AssignmentActions assignmentId={a.id} currentStatus={a.status} opportunityId={opp.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deals */}
      {opp.deals.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <div className="border-b px-6 py-5" style={{ borderColor: "#E8EBF0" }}>
            <h2 className="text-base font-bold" style={{ color: "#0F2744" }}>Deals ({opp.deals.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left" style={{ background: "#F8F9FB" }}>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Prospect</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Agent</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Value</th>
                  <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Stage</th>
                </tr>
              </thead>
              <tbody>
                {opp.deals.map((deal) => (
                  <tr key={deal.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{deal.prospectName}</p>
                      {deal.prospectOrg && <p className="text-xs text-gray-400">{deal.prospectOrg}</p>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{deal.agent.firstName} {deal.agent.lastName}</td>
                    <td className="px-6 py-4 font-semibold" style={{ color: "#0F2744" }}>
                      {deal.closedValue ? formatNGN(Number(deal.closedValue)) : deal.dealValue ? formatNGN(Number(deal.dealValue)) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                        {deal.stage.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold" style={{ color: "#0F2744" }}>{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-28 shrink-0 text-sm font-medium text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function formatNGN(amount: number): string {
  if (amount === 0) return "N0";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}
