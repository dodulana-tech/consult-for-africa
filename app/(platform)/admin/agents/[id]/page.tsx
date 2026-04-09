import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AgentStatusActions from "./AgentStatusActions";
import DealVerifyButton from "./DealVerifyButton";

export default async function AdminAgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const agent = await prisma.salesAgent.findUnique({
    where: { id },
    include: {
      opportunityAssignments: {
        include: { opportunity: { select: { title: true, status: true } } },
        orderBy: { createdAt: "desc" },
      },
      deals: {
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: { opportunity: { select: { title: true } } },
        select: {
          id: true,
          dealCode: true,
          prospectName: true,
          prospectOrg: true,
          dealValue: true,
          stage: true,
          verifiedAt: true,
          verifiedById: true,
          closedValue: true,
          opportunity: { select: { title: true } },
        },
      },
      commissions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      documents: { orderBy: { uploadedAt: "desc" } },
    },
  });

  if (!agent) notFound();

  const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
    APPLIED: { bg: "bg-blue-50", color: "text-blue-700" },
    VETTING: { bg: "bg-amber-50", color: "text-amber-700" },
    APPROVED: { bg: "bg-emerald-50", color: "text-emerald-700" },
    SUSPENDED: { bg: "bg-red-50", color: "text-red-600" },
    DEACTIVATED: { bg: "bg-gray-100", color: "text-gray-500" },
  };
  const s = STATUS_STYLES[agent.status] ?? STATUS_STYLES.APPLIED;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/agents"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-gray-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All Agents
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>
              {agent.firstName} {agent.lastName}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {agent.email} {agent.phone ? `/ ${agent.phone}` : ""}
            </p>
          </div>
          <span className={`shrink-0 self-start rounded-full px-4 py-1.5 text-sm font-semibold ${s.bg} ${s.color}`}>
            {agent.status}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info */}
        <Card title="Agent Information">
          <dl className="space-y-2.5 text-sm">
            <Row label="Company" value={agent.company || "N/A"} />
            <Row label="Title" value={agent.title || "N/A"} />
            <Row label="State" value={agent.state || "N/A"} />
            <Row label="Country" value={agent.country} />
            <Row label="Sales Experience" value={agent.salesExperience ? `${agent.salesExperience} years` : "N/A"} />
            <Row label="Industries" value={agent.industries.length > 0 ? agent.industries.join(", ") : "N/A"} />
            <Row label="Referral Source" value={agent.referralSource || "N/A"} />
            <Row label="LinkedIn" value={agent.linkedinUrl || "N/A"} />
            <Row label="Applied" value={agent.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} />
          </dl>
        </Card>

        {/* Status Actions */}
        <Card title="Status Management">
          <AgentStatusActions agentId={agent.id} currentStatus={agent.status} />
        </Card>

        {/* Performance */}
        <Card title="Performance">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>{agent.totalDeals}</p>
              <p className="mt-0.5 text-xs text-gray-500">Deals Won</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>
                {formatNGN(Number(agent.totalRevenue))}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">Revenue</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {formatNGN(Number(agent.totalCommission))}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">Commission</p>
            </div>
          </div>
        </Card>

        {/* Bank Details */}
        <Card title="Bank Details">
          <dl className="space-y-2.5 text-sm">
            <Row label="Bank" value={agent.bankName || "Not provided"} />
            <Row label="Account Number" value={agent.accountNumber || "Not provided"} />
            <Row label="Account Name" value={agent.accountName || "Not provided"} />
          </dl>
        </Card>

        {/* Recent Deals */}
        {agent.deals.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="mb-4 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>
              Recent Deals ({agent.deals.length})
            </h2>
            <div className="space-y-2">
              {agent.deals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{deal.prospectName}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {deal.opportunity.title} {deal.prospectOrg ? `/ ${deal.prospectOrg}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {deal.dealValue && (
                      <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                        {formatNGN(Number(deal.dealValue))}
                      </span>
                    )}
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                      {deal.stage.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-bold tracking-tight" style={{ color: "#0F2744" }}>{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-36 shrink-0 text-sm font-medium text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

function formatNGN(amount: number): string {
  if (amount === 0) return "N0";
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}
