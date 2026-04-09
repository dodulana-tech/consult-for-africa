import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  DollarSign, Users, Briefcase, Stethoscope, Target,
  TrendingUp, Building2, Send, BarChart3,
} from "lucide-react";

export default async function MetricsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) redirect("/dashboard");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [
    // Revenue deep
    totalRevenue, last30Revenue, last90Revenue, overdueInvoices, outstandingAmount,
    invoicesByStatus, recentInvoices,
    // Clients
    clientsByStatus, clientsByType,
    // Engagements
    engagementsByStatus, engagementsByType, totalBudget, totalSpent,
    // Workforce
    consultantsByTier, consultantsByAvailability, totalAssignments, activeAssignments,
    // Pipeline
    leadsByStatus, leadsBySource, proposalsByStatus, referralsByStatus,
    // CadreHealth
    professionalsByCadre, outreachByStatus, outreachByTier,
    mandatesByStatus, totalReviews, totalSalaryReports, mentorshipsByStatus,
    // Agent
    agentsByStatus, dealsByStage, commissionsByStatus,
    // Partners
    partnersByStatus, partnerRequestsByStatus,
    // Maarova
    assessmentsByStatus, coachingByStatus,
  ] = await Promise.all([
    // Revenue
    prisma.invoice.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
    prisma.payment.aggregate({ where: { status: "CONFIRMED", paymentDate: { gte: thirtyDaysAgo } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "CONFIRMED", paymentDate: { gte: ninetyDaysAgo } }, _sum: { amount: true } }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
    prisma.invoice.aggregate({ where: { status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID"] } }, _sum: { balanceDue: true } }),
    prisma.invoice.groupBy({ by: ["status"], _count: true }),
    prisma.invoice.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, total: true, status: true, client: { select: { name: true } }, createdAt: true } }),
    // Clients
    prisma.client.groupBy({ by: ["status"], _count: true }),
    prisma.client.groupBy({ by: ["type"], _count: true }),
    // Engagements
    prisma.engagement.groupBy({ by: ["status"], _count: true }),
    prisma.engagement.groupBy({ by: ["engagementType"], _count: true }),
    prisma.engagement.aggregate({ where: { status: { in: ["ACTIVE", "PLANNING"] } }, _sum: { budgetAmount: true } }),
    prisma.engagement.aggregate({ where: { status: { in: ["ACTIVE", "PLANNING"] } }, _sum: { actualSpent: true } }),
    // Workforce
    prisma.consultantProfile.groupBy({ by: ["tier"], _count: true }),
    prisma.consultantProfile.groupBy({ by: ["availabilityStatus"], _count: true }),
    prisma.assignment.count(),
    prisma.assignment.count({ where: { status: "ACTIVE" } }),
    // Pipeline
    prisma.lead.groupBy({ by: ["status"], _count: true }),
    prisma.lead.groupBy({ by: ["source"], _count: true }),
    prisma.proposal.groupBy({ by: ["status"], _count: true }),
    prisma.referral.groupBy({ by: ["status"], _count: true }),
    // CadreHealth
    prisma.cadreProfessional.groupBy({ by: ["cadre"], _count: true, orderBy: { _count: { cadre: "desc" } }, take: 10 }),
    prisma.cadreOutreachRecord.groupBy({ by: ["status"], _count: true }),
    prisma.cadreOutreachRecord.groupBy({ by: ["tier"], _count: true }),
    prisma.cadreMandate.groupBy({ by: ["status"], _count: true }),
    prisma.cadreFacilityReview.count(),
    prisma.cadreSalaryReport.count(),
    prisma.cadreMentorship.groupBy({ by: ["status"], _count: true }),
    // Agent
    prisma.salesAgent.groupBy({ by: ["status"], _count: true }),
    prisma.agentDeal.groupBy({ by: ["stage"], _count: true }),
    prisma.agentCommission.groupBy({ by: ["status"], _count: true }),
    // Partners
    prisma.partnerFirm.groupBy({ by: ["status"], _count: true }),
    prisma.partnerStaffingRequest.groupBy({ by: ["status"], _count: true }),
    // Maarova
    prisma.maarovaAssessmentSession.groupBy({ by: ["status"], _count: true }),
    prisma.maarovaCoachingMatch.groupBy({ by: ["status"], _count: true }),
  ]);

  const rev = Number(totalRevenue._sum.total ?? 0);
  const rev30 = Number(last30Revenue._sum.amount ?? 0);
  const rev90 = Number(last90Revenue._sum.amount ?? 0);
  const outstanding = Number(outstandingAmount._sum.balanceDue ?? 0);
  const budget = Number(totalBudget._sum.budgetAmount ?? 0);
  const spent = Number(totalSpent._sum.actualSpent ?? 0);
  const budgetUtil = budget > 0 ? Math.round((spent / budget) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>Metrics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Deep analytics across all business lines</p>
      </div>

      {/* ── REVENUE ── */}
      <MetricSection title="Revenue & Financial" icon={<DollarSign className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card label="Total Revenue" value={fmtN(rev)} accent="#059669" />
          <Card label="Last 30 Days" value={fmtN(rev30)} accent="#0F2744" />
          <Card label="Last 90 Days" value={fmtN(rev90)} accent="#0F2744" />
          <Card label="Outstanding" value={fmtN(outstanding)} accent="#D4AF37" sub={`${overdueInvoices} overdue`} />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 mt-4">
          <Card label="Active Budget" value={fmtN(budget)} accent="#0F2744" />
          <Card label="Spent" value={fmtN(spent)} accent="#DC2626" sub={`${budgetUtil}% utilisation`} />
          <Breakdown title="Invoices by Status" data={invoicesByStatus.map(i => ({ label: i.status, count: i._count }))} />
        </div>
        {recentInvoices.length > 0 && (
          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">Recent Invoices</p>
            {recentInvoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between py-1.5 text-xs">
                <span className="text-gray-700">{inv.client.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-semibold" style={{ color: "#0F2744" }}>{fmtN(Number(inv.total))}</span>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold bg-gray-100 text-gray-600">{inv.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </MetricSection>

      {/* ── CLIENTS & ENGAGEMENTS ── */}
      <MetricSection title="Clients & Engagements" icon={<Building2 className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Breakdown title="Clients by Status" data={clientsByStatus.map(c => ({ label: c.status, count: c._count }))} />
          <Breakdown title="Clients by Type" data={clientsByType.map(c => ({ label: c.type, count: c._count }))} />
          <Breakdown title="Engagements by Status" data={engagementsByStatus.map(e => ({ label: e.status, count: e._count }))} />
          <Breakdown title="Engagements by Type" data={engagementsByType.map(e => ({ label: e.engagementType, count: e._count }))} />
        </div>
      </MetricSection>

      {/* ── WORKFORCE ── */}
      <MetricSection title="Workforce" icon={<Users className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Breakdown title="By Tier" data={consultantsByTier.map(t => ({ label: t.tier, count: t._count }))} />
          <Breakdown title="By Availability" data={consultantsByAvailability.map(a => ({ label: a.availabilityStatus, count: a._count }))} />
          <Card label="Total Assignments" value={totalAssignments} accent="#0F2744" sub={`${activeAssignments} active`} />
        </div>
      </MetricSection>

      {/* ── PIPELINE ── */}
      <MetricSection title="Pipeline & Sales" icon={<Target className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Breakdown title="Leads by Status" data={leadsByStatus.map(l => ({ label: l.status, count: l._count }))} />
          <Breakdown title="Leads by Source" data={leadsBySource.map(l => ({ label: l.source, count: l._count }))} />
          <Breakdown title="Proposals" data={proposalsByStatus.map(p => ({ label: p.status, count: p._count }))} />
          <Breakdown title="Referrals" data={referralsByStatus.map(r => ({ label: r.status, count: r._count }))} />
        </div>
      </MetricSection>

      {/* ── CADREHEALTH ── */}
      <MetricSection title="CadreHealth" icon={<Stethoscope className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <Breakdown title="Professionals by Cadre" data={professionalsByCadre.map(p => ({ label: p.cadre.replace(/_/g, " "), count: p._count }))} />
          <Breakdown title="Outreach by Status" data={outreachByStatus.map(o => ({ label: o.status.replace(/_/g, " "), count: o._count }))} />
          <Breakdown title="Outreach by Tier" data={outreachByTier.map(t => ({ label: `Tier ${t.tier}`, count: t._count }))} />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mt-4">
          <Breakdown title="Mandates" data={mandatesByStatus.map(m => ({ label: m.status.replace(/_/g, " "), count: m._count }))} />
          <Card label="Hospital Reviews" value={totalReviews} accent="#059669" />
          <Card label="Salary Reports" value={totalSalaryReports} accent="#D4AF37" />
          <Breakdown title="Mentorships" data={mentorshipsByStatus.map(m => ({ label: m.status.replace(/_/g, " "), count: m._count }))} />
        </div>
      </MetricSection>

      {/* ── AGENT CHANNEL ── */}
      <MetricSection title="Agent Channel" icon={<Send className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <Breakdown title="Agents by Status" data={agentsByStatus.map(a => ({ label: a.status, count: a._count }))} />
          <Breakdown title="Deals by Stage" data={dealsByStage.map(d => ({ label: d.stage.replace(/_/g, " "), count: d._count }))} />
          <Breakdown title="Commissions" data={commissionsByStatus.map(c => ({ label: c.status, count: c._count }))} />
        </div>
      </MetricSection>

      {/* ── PARTNERS ── */}
      <MetricSection title="Partners" icon={<Building2 className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <Breakdown title="Firms by Status" data={partnersByStatus.map(p => ({ label: p.status, count: p._count }))} />
          <Breakdown title="Staffing Requests" data={partnerRequestsByStatus.map(r => ({ label: r.status, count: r._count }))} />
        </div>
      </MetricSection>

      {/* ── MAAROVA ── */}
      <MetricSection title="Maarova & Learning" icon={<BarChart3 className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <Breakdown title="Assessments" data={assessmentsByStatus.map(a => ({ label: a.status.replace(/_/g, " "), count: a._count }))} />
          <Breakdown title="Coaching Matches" data={coachingByStatus.map(c => ({ label: c.status.replace(/_/g, " "), count: c._count }))} />
        </div>
      </MetricSection>
    </div>
  );
}

// ─── Components ──────────────────────────────────────────────────────────────

function MetricSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-gray-400">{icon}</div>
        <h2 className="text-sm font-bold tracking-tight" style={{ color: "#0F2744" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Card({ label, value, accent, sub }: { label: string; value: string | number; accent: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: accent }}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}

function Breakdown({ title, data }: { title: string; data: Array<{ label: string; count: number }> }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{title}</p>
        <p className="text-sm text-gray-300">No data</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
        <span className="text-xs font-bold" style={{ color: "#0F2744" }}>{total}</span>
      </div>
      <div className="space-y-1.5">
        {data.sort((a, b) => b.count - a.count).map(d => (
          <div key={d.label} className="flex items-center justify-between text-xs">
            <span className="text-gray-600 truncate">{d.label.replace(/_/g, " ")}</span>
            <span className="font-semibold shrink-0 ml-2" style={{ color: "#0F2744" }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function fmtN(amount: number): string {
  if (amount === 0) return "N0";
  if (amount >= 1_000_000) return `N${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `N${(amount / 1_000).toFixed(0)}K`;
  return `N${amount.toLocaleString()}`;
}
