export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import DailyPulse from "@/components/founder/DailyPulse";
import NuruPrompt from "@/components/founder/NuruPrompt";
import {
  TrendingUp, Users, Briefcase, DollarSign, Target,
  AlertTriangle, Clock, ArrowRight, Building2,
  Stethoscope, UserCheck, Send, Sparkles,
} from "lucide-react";

export default async function FounderDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) redirect("/dashboard");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const firstName = session.user.name?.split(" ")[0] ?? "Founder";

  // ─── Parallel data fetches ─────────────────────────────────────────────────
  const [
    // Revenue
    paidInvoices,
    outstandingInvoices,
    overdueInvoices,
    recentPayments,
    // Clients & Engagements
    clientsByStatus,
    engagementsByStatus,
    totalBudget,
    atRiskEngagements,
    // Workforce
    consultantsByTier,
    consultantsByAvailability,
    activeAssignments,
    // Pipeline
    leadsByStatus,
    proposalsByStatus,
    openStaffingRequests,
    expansionRequests,
    referralsByStatus,
    // CadreHealth
    totalProfessionals,
    verifiedProfessionals,
    outreachByStatus,
    openMandates,
    placedMandates,
    totalReviews,
    totalSalaryReports,
    activeMentorships,
    // Agent Channel
    approvedAgents,
    pendingAgents,
    openOpportunities,
    dealsByStage,
    pendingCommissions,
    // Partners
    activePartners,
    partnerDeployments,
    // Maarova
    completedAssessments,
    activeCoaching,
    // Action items
    pendingDeliverables,
    overdueMS,
    pendingTimesheets,
    recentUpdates,
  ] = await Promise.all([
    // Revenue
    prisma.invoice.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
    prisma.invoice.aggregate({ where: { status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID"] } }, _sum: { balanceDue: true } }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
    prisma.payment.aggregate({ where: { status: "CONFIRMED", paymentDate: { gte: thirtyDaysAgo } }, _sum: { amount: true } }),
    // Clients
    prisma.client.groupBy({ by: ["status"], _count: true }),
    prisma.engagement.groupBy({ by: ["status"], _count: true }),
    prisma.engagement.aggregate({ where: { status: { in: ["ACTIVE", "PLANNING"] } }, _sum: { budgetAmount: true } }),
    prisma.engagement.findMany({ where: { status: "AT_RISK" }, select: { id: true, name: true, client: { select: { name: true } }, healthScore: true } }),
    // Workforce
    prisma.consultantProfile.groupBy({ by: ["tier"], _count: true }),
    prisma.consultantProfile.groupBy({ by: ["availabilityStatus"], _count: true }),
    prisma.assignment.count({ where: { status: "ACTIVE" } }),
    // Pipeline
    prisma.lead.groupBy({ by: ["status"], _count: true }),
    prisma.proposal.groupBy({ by: ["status"], _count: true }),
    prisma.staffingRequest.count({ where: { status: "OPEN" } }),
    prisma.clientExpansionRequest.count({ where: { status: { in: ["NEW", "IN_PROGRESS"] } } }),
    prisma.referral.groupBy({ by: ["status"], _count: true }),
    // CadreHealth
    prisma.cadreProfessional.count(),
    prisma.cadreProfessional.count({ where: { accountStatus: "VERIFIED" } }),
    prisma.cadreOutreachRecord.groupBy({ by: ["status"], _count: true }),
    prisma.cadreMandate.count({ where: { status: { in: ["OPEN", "SOURCING", "SHORTLISTED", "INTERVIEWING"] } } }),
    prisma.cadreMandate.count({ where: { status: "PLACED" } }),
    prisma.cadreFacilityReview.count(),
    prisma.cadreSalaryReport.count(),
    prisma.cadreMentorship.count({ where: { status: "ACTIVE" } }),
    // Agent Channel
    prisma.salesAgent.count({ where: { status: "APPROVED" } }),
    prisma.salesAgent.count({ where: { status: "APPLIED" } }),
    prisma.agentOpportunity.count({ where: { status: { in: ["OPEN", "ASSIGNED"] } } }),
    prisma.agentDeal.groupBy({ by: ["stage"], _count: true }),
    prisma.agentCommission.aggregate({ where: { status: { in: ["PENDING", "VERIFIED", "APPROVED"] } }, _sum: { amount: true } }),
    // Partners
    prisma.partnerFirm.count({ where: { status: "ACTIVE" } }),
    prisma.partnerDeployment.count({ where: { status: "ACTIVE" } }),
    // Maarova
    prisma.maarovaAssessmentSession.count({ where: { status: "COMPLETED" } }),
    prisma.maarovaCoachingMatch.count({ where: { status: "ACTIVE" } }),
    // Action items
    prisma.deliverable.count({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } } }),
    prisma.milestone.count({ where: { status: "DELAYED" } }),
    prisma.timeEntry.count({ where: { status: "PENDING" } }),
    prisma.engagementUpdate.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { createdBy: { select: { name: true } }, engagement: { select: { name: true } } } }),
  ]);

  // ─── Derived metrics ───────────────────────────────────────────────────────
  const totalRevenue = Number(paidInvoices._sum.total ?? 0);
  const outstanding = Number(outstandingInvoices._sum.balanceDue ?? 0);
  const last30Revenue = Number(recentPayments._sum.amount ?? 0);

  const activeClients = clientsByStatus.find(c => c.status === "ACTIVE")?._count ?? 0;
  const activeEngagements = engagementsByStatus.find(e => e.status === "ACTIVE")?._count ?? 0;
  const totalActiveBudget = Number(totalBudget._sum.budgetAmount ?? 0);

  const totalConsultants = consultantsByTier.reduce((s, t) => s + t._count, 0);
  const availableConsultants = consultantsByAvailability.find(a => a.availabilityStatus === "AVAILABLE")?._count ?? 0;

  const newLeads = leadsByStatus.find(l => l.status === "NEW")?._count ?? 0;
  const proposalsSent = proposalsByStatus.find(p => p.status === "SENT")?._count ?? 0;
  const convertedLeads = leadsByStatus.find(l => l.status === "CONVERTED")?._count ?? 0;
  const totalLeads = leadsByStatus.reduce((s, l) => s + l._count, 0);
  const pendingReferrals = referralsByStatus.find(r => r.status === "PENDING")?._count ?? 0;

  const outreachConverted = outreachByStatus.find(o => o.status === "CONVERTED")?._count ?? 0;
  const outreachTotal = outreachByStatus.reduce((s, o) => s + o._count, 0);

  const dealsWon = dealsByStage.find(d => d.stage === "CLOSED_WON")?._count ?? 0;
  const dealsActive = dealsByStage.filter(d => !["CLOSED_WON", "CLOSED_LOST", "DISQUALIFIED"].includes(d.stage)).reduce((s, d) => s + d._count, 0);
  const commissionLiability = Number(pendingCommissions._sum.amount ?? 0);

  const actionCount = pendingDeliverables + overdueMS + pendingTimesheets + overdueInvoices + atRiskEngagements.length + pendingAgents;

  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl">

      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{ background: "linear-gradient(135deg, #0F2744 0%, #0B3C5D 60%, #1a5a8a 100%)" }}
      >
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 80% 20%, rgba(212,175,55,0.08) 0%, transparent 50%)" }} />
        <div className="relative">
          <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
            {greeting}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            {firstName}&apos;s Command Center
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Real-time view of Consult For Africa
          </p>
          {actionCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2" style={{ background: "rgba(212,175,55,0.15)" }}>
              <AlertTriangle className="h-4 w-4" style={{ color: "#D4AF37" }} />
              <span className="text-sm font-medium" style={{ color: "#D4AF37" }}>
                {actionCount} item{actionCount !== 1 ? "s" : ""} need{actionCount === 1 ? "s" : ""} your attention
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Nuru check-in ── */}
      <Suspense fallback={<div className="h-20 animate-pulse rounded-2xl bg-gray-100" />}>
        <NuruPrompt />
      </Suspense>

      {/* ── 0. DAILY PULSE (Nuru AI) ── */}
      <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-gray-100" />}>
        <DailyPulse />
      </Suspense>

      {/* ── 1. BUSINESS PULSE ── */}
      <Section title="Business Pulse" icon={<DollarSign className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric label="Total Revenue" value={fmtNGN(totalRevenue)} accent="#059669" />
          <Metric label="Last 30 Days" value={fmtNGN(last30Revenue)} accent="#0F2744" />
          <Metric label="Outstanding" value={fmtNGN(outstanding)} accent="#D4AF37" sub={overdueInvoices > 0 ? `${overdueInvoices} overdue` : undefined} />
          <Metric label="Active Budget" value={fmtNGN(totalActiveBudget)} accent="#0F2744" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mt-4">
          <Metric label="Active Clients" value={activeClients} accent="#0F2744" />
          <Metric label="Active Engagements" value={activeEngagements} accent="#059669" />
          <Metric label="At Risk" value={atRiskEngagements.length} accent={atRiskEngagements.length > 0 ? "#DC2626" : "#9CA3AF"} />
          <Metric label="Partner Firms" value={activePartners} accent="#7C3AED" sub={`${partnerDeployments} deployments`} />
        </div>
      </Section>

      {/* ── 2. PIPELINE & GROWTH ── */}
      <Section title="Pipeline & Growth" icon={<Target className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Metric label="New Leads" value={newLeads} accent="#1D4ED8" />
          <Metric label="Total Leads" value={totalLeads} accent="#0F2744" sub={totalLeads > 0 ? `${Math.round((convertedLeads / totalLeads) * 100)}% converted` : undefined} />
          <Metric label="Proposals Sent" value={proposalsSent} accent="#D4AF37" />
          <Metric label="Open Staffing" value={openStaffingRequests} accent="#7C3AED" />
          <Metric label="Expansion Requests" value={expansionRequests} accent="#059669" sub={`${pendingReferrals} pending referrals`} />
        </div>
      </Section>

      {/* ── 3. WORKFORCE ── */}
      <Section title="Workforce" icon={<Users className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric label="Consultants" value={totalConsultants} accent="#0F2744" />
          <Metric label="Available" value={availableConsultants} accent="#059669" />
          <Metric label="Active Assignments" value={activeAssignments} accent="#D4AF37" />
          <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">By Tier</p>
            <div className="space-y-1.5">
              {consultantsByTier.sort((a, b) => {
                const order = ["ELITE", "EXPERIENCED", "STANDARD", "EMERGING", "INTERN"];
                return order.indexOf(a.tier) - order.indexOf(b.tier);
              }).map(t => (
                <div key={t.tier} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{t.tier}</span>
                  <span className="font-bold" style={{ color: "#0F2744" }}>{t._count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── 4. CADREHEALTH ── */}
      <Section title="CadreHealth" icon={<Stethoscope className="h-4 w-4" />} href="/admin/cadrehealth">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Metric label="Professionals" value={totalProfessionals.toLocaleString()} accent="#0F2744" sub={`${verifiedProfessionals} verified`} />
          <Metric label="Outreach Pipeline" value={outreachTotal} accent="#1D4ED8" sub={outreachTotal > 0 ? `${outreachConverted} converted` : "not started"} />
          <Metric label="Open Mandates" value={openMandates} accent="#D4AF37" sub={`${placedMandates} placed`} />
          <Metric label="Reviews / Salary" value={`${totalReviews} / ${totalSalaryReports}`} accent="#059669" />
          <Metric label="Mentorships" value={activeMentorships} accent="#7C3AED" />
        </div>
        {outreachTotal > 0 && (
          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">Outreach Funnel</p>
            <div className="flex gap-1">
              {outreachByStatus.sort((a, b) => {
                const order = ["READY", "WHATSAPP_SENT", "WHATSAPP_REPLIED", "SMS_SENT", "EMAIL_SENT", "CONVERTED", "NOT_INTERESTED", "UNREACHABLE", "EMIGRATED", "RETIRED"];
                return order.indexOf(a.status) - order.indexOf(b.status);
              }).map(o => (
                <div key={o.status} className="flex-1 text-center">
                  <p className="text-sm font-bold" style={{ color: "#0F2744" }}>{o._count}</p>
                  <p className="text-[9px] text-gray-400 leading-tight">{o.status.replace(/_/g, " ")}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ── 5. AGENT CHANNEL ── */}
      <Section title="Agent Channel" icon={<Send className="h-4 w-4" />} href="/admin/agents">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Metric label="Approved Agents" value={approvedAgents} accent="#059669" sub={pendingAgents > 0 ? `${pendingAgents} pending` : undefined} />
          <Metric label="Open Opportunities" value={openOpportunities} accent="#D4AF37" />
          <Metric label="Active Deals" value={dealsActive} accent="#1D4ED8" />
          <Metric label="Deals Won" value={dealsWon} accent="#059669" />
          <Metric label="Commission Liability" value={fmtNGN(commissionLiability)} accent="#DC2626" />
        </div>
      </Section>

      {/* ── 6. MAAROVA & ACADEMY ── */}
      <Section title="Maarova & Academy" icon={<Sparkles className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric label="Assessments Completed" value={completedAssessments} accent="#7C3AED" />
          <Metric label="Active Coaching" value={activeCoaching} accent="#D4AF37" />
          <Metric label="Partner Deployments" value={partnerDeployments} accent="#0F2744" />
          <Metric label="Active Partners" value={activePartners} accent="#059669" />
        </div>
      </Section>

      {/* ── 7. ACTION ITEMS ── */}
      {actionCount > 0 && (
        <Section title="Needs Attention" icon={<AlertTriangle className="h-4 w-4" />}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingDeliverables > 0 && (
              <ActionCard label="Deliverables to Review" count={pendingDeliverables} href="/projects" color="#1D4ED8" />
            )}
            {overdueMS > 0 && (
              <ActionCard label="Delayed Milestones" count={overdueMS} href="/projects" color="#DC2626" />
            )}
            {pendingTimesheets > 0 && (
              <ActionCard label="Pending Timesheets" count={pendingTimesheets} href="/timesheets" color="#D4AF37" />
            )}
            {overdueInvoices > 0 && (
              <ActionCard label="Overdue Invoices" count={overdueInvoices} href="/finance/invoices" color="#DC2626" />
            )}
            {atRiskEngagements.length > 0 && atRiskEngagements.map(e => (
              <ActionCard key={e.id} label={`At Risk: ${e.name}`} count={e.healthScore ?? 0} href={`/projects/${e.id}`} color="#DC2626" sub={e.client.name} />
            ))}
            {pendingAgents > 0 && (
              <ActionCard label="Agent Applications" count={pendingAgents} href="/admin/agents" color="#7C3AED" />
            )}
          </div>
        </Section>
      )}

      {/* ── 8. RECENT ACTIVITY ── */}
      {recentUpdates.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "#0F2744" }}>Recent Activity</h3>
          <div className="space-y-3">
            {recentUpdates.map(u => (
              <div key={u.id} className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: "#D4AF37" }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700">{u.content.slice(0, 120)}{u.content.length > 120 ? "..." : ""}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {u.createdBy?.name ?? "C4A"} on {u.engagement?.name ?? "General"} · {timeAgo(u.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick nav ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickLink href="/founder/ai-coach" label="Nuru" sub="AI strategy partner" icon={<Sparkles className="h-5 w-5" />} />
        <QuickLink href="/founder/ideation" label="Ideation Pad" sub="Capture and develop ideas" icon={<Target className="h-5 w-5" />} />
        <QuickLink href="/dashboard" label="Platform" sub="Switch to operator view" icon={<Briefcase className="h-5 w-5" />} />
      </div>
    </div>
  );
}

// ─── Components ──────────────────────────────────────────────────────────────

function Section({ title, icon, children, href }: { title: string; icon: React.ReactNode; children: React.ReactNode; href?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="text-gray-400">{icon}</div>
          <h2 className="text-sm font-bold tracking-tight" style={{ color: "#0F2744" }}>{title}</h2>
        </div>
        {href && (
          <Link href={href} className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 transition">
            View <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value, accent, sub }: { label: string; value: string | number; accent: string; sub?: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: accent }}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}

function ActionCard({ label, count, href, color, sub }: { label: string; count: number; href: string; color: string; sub?: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md" style={{ border: "1px solid #E8EBF0" }}>
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
      </div>
      <span className="shrink-0 rounded-full px-3 py-1 text-sm font-bold text-white" style={{ background: color }}>
        {count}
      </span>
    </Link>
  );
}

function QuickLink({ href, label, sub, icon }: { href: string; label: string; sub: string; icon: React.ReactNode }) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md" style={{ border: "1px solid #E8EBF0" }}>
      <div className="rounded-xl p-3" style={{ background: "#0F274408" }}>
        <div style={{ color: "#0F2744" }}>{icon}</div>
      </div>
      <div>
        <p className="text-sm font-bold" style={{ color: "#0F2744" }}>{label}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </Link>
  );
}

function fmtNGN(amount: number): string {
  if (amount === 0) return "N0";
  if (amount >= 1_000_000) return `N${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `N${(amount / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
