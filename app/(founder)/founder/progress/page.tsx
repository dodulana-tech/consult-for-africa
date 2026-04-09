import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  TrendingUp, Users, Stethoscope, Building2,
  CheckCircle2, Circle, Target, DollarSign,
} from "lucide-react";

// Revenue milestones in NGN
const REVENUE_GATES = [
  { label: "N0", amount: 0, sublabel: "Starting point" },
  { label: "N5M", amount: 5_000_000, sublabel: "First real project" },
  { label: "N20M", amount: 20_000_000, sublabel: "Sustainable operations" },
  { label: "N50M", amount: 50_000_000, sublabel: "Growth mode" },
  { label: "N100M", amount: 100_000_000, sublabel: "Market leader" },
  { label: "N500M", amount: 500_000_000, sublabel: "Scale" },
];

// Business milestones: auto-checked based on live data
function computeMilestones(data: {
  revenue: number;
  activeClients: number;
  activeEngagements: number;
  completedEngagements: number;
  totalConsultants: number;
  totalProfessionals: number;
  outreachStarted: boolean;
  outreachConverted: number;
  openMandates: number;
  placedMandates: number;
  approvedAgents: number;
  activePartners: number;
  totalReviews: number;
  totalSalaryReports: number;
  activeMentorships: number;
  completedAssessments: number;
}) {
  return [
    { category: "Revenue", milestones: [
      { name: "First invoice paid", done: data.revenue > 0, value: data.revenue > 0 ? `N${(data.revenue / 1_000_000).toFixed(1)}M` : null },
      { name: "N5M cumulative revenue", done: data.revenue >= 5_000_000 },
      { name: "N20M cumulative revenue", done: data.revenue >= 20_000_000 },
      { name: "N50M cumulative revenue", done: data.revenue >= 50_000_000 },
    ]},
    { category: "Clients & Engagements", milestones: [
      { name: "First active client", done: data.activeClients >= 1, value: `${data.activeClients} clients` },
      { name: "5 active clients", done: data.activeClients >= 5 },
      { name: "10 active clients", done: data.activeClients >= 10 },
      { name: "First engagement completed", done: data.completedEngagements >= 1, value: `${data.completedEngagements} completed` },
      { name: "5 engagements delivered", done: data.completedEngagements >= 5 },
      { name: "Active engagement running", done: data.activeEngagements >= 1, value: `${data.activeEngagements} active` },
    ]},
    { category: "Workforce", milestones: [
      { name: "10 consultants onboarded", done: data.totalConsultants >= 10, value: `${data.totalConsultants} consultants` },
      { name: "25 consultants", done: data.totalConsultants >= 25 },
      { name: "50 consultants", done: data.totalConsultants >= 50 },
    ]},
    { category: "CadreHealth", milestones: [
      { name: "1,000 professionals imported", done: data.totalProfessionals >= 1000, value: `${data.totalProfessionals.toLocaleString()} professionals` },
      { name: "Outreach campaign launched", done: data.outreachStarted },
      { name: "First outreach conversion", done: data.outreachConverted >= 1, value: data.outreachConverted > 0 ? `${data.outreachConverted} converted` : null },
      { name: "100 outreach conversions", done: data.outreachConverted >= 100 },
      { name: "First mandate placed", done: data.placedMandates >= 1, value: data.placedMandates > 0 ? `${data.placedMandates} placed` : null },
      { name: "10 hospital reviews", done: data.totalReviews >= 10, value: `${data.totalReviews} reviews` },
      { name: "100 salary reports", done: data.totalSalaryReports >= 100, value: `${data.totalSalaryReports} reports` },
      { name: "Active mentorship programme", done: data.activeMentorships >= 1, value: `${data.activeMentorships} active` },
    ]},
    { category: "Agent Channel", milestones: [
      { name: "First approved agent", done: data.approvedAgents >= 1, value: `${data.approvedAgents} agents` },
      { name: "10 approved agents", done: data.approvedAgents >= 10 },
      { name: "First agent deal closed", done: false }, // would need deal data
    ]},
    { category: "Partnerships", milestones: [
      { name: "First active partner firm", done: data.activePartners >= 1, value: `${data.activePartners} partners` },
      { name: "5 active partners", done: data.activePartners >= 5 },
    ]},
    { category: "Maarova", milestones: [
      { name: "First assessment completed", done: data.completedAssessments >= 1, value: `${data.completedAssessments} assessments` },
      { name: "10 assessments completed", done: data.completedAssessments >= 10 },
    ]},
  ];
}

export default async function ProgressPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!["DIRECTOR", "PARTNER", "ADMIN"].includes(session.user.role)) redirect("/dashboard");

  const [
    revenue, activeClients, engagementsByStatus, totalConsultants,
    totalProfessionals, outreachTotal, outreachConverted,
    openMandates, placedMandates, approvedAgents, activePartners,
    totalReviews, totalSalaryReports, activeMentorships, completedAssessments,
    dealsWon,
  ] = await Promise.all([
    prisma.invoice.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.engagement.groupBy({ by: ["status"], _count: true }),
    prisma.consultantProfile.count(),
    prisma.cadreProfessional.count(),
    prisma.cadreOutreachRecord.count(),
    prisma.cadreOutreachRecord.count({ where: { status: "CONVERTED" } }),
    prisma.cadreMandate.count({ where: { status: { in: ["OPEN", "SOURCING"] } } }),
    prisma.cadreMandate.count({ where: { status: "PLACED" } }),
    prisma.salesAgent.count({ where: { status: "APPROVED" } }),
    prisma.partnerFirm.count({ where: { status: "ACTIVE" } }),
    prisma.cadreFacilityReview.count(),
    prisma.cadreSalaryReport.count(),
    prisma.cadreMentorship.count({ where: { status: "ACTIVE" } }),
    prisma.maarovaAssessmentSession.count({ where: { status: "COMPLETED" } }),
    prisma.agentDeal.count({ where: { stage: "CLOSED_WON" } }),
  ]);

  const totalRevenue = Number(revenue._sum.total ?? 0);
  const activeEngagements = engagementsByStatus.find(e => e.status === "ACTIVE")?._count ?? 0;
  const completedEngagements = engagementsByStatus.find(e => e.status === "COMPLETED")?._count ?? 0;

  const milestoneData = computeMilestones({
    revenue: totalRevenue,
    activeClients,
    activeEngagements,
    completedEngagements,
    totalConsultants,
    totalProfessionals,
    outreachStarted: outreachTotal > 0,
    outreachConverted,
    openMandates,
    placedMandates,
    approvedAgents,
    activePartners,
    totalReviews,
    totalSalaryReports,
    activeMentorships,
    completedAssessments,
  });

  const totalMilestones = milestoneData.reduce((s, c) => s + c.milestones.length, 0);
  const achievedMilestones = milestoneData.reduce((s, c) => s + c.milestones.filter(m => m.done).length, 0);
  const overallPct = totalMilestones > 0 ? Math.round((achievedMilestones / totalMilestones) * 100) : 0;

  // Revenue position on the journey
  const currentGateIdx = REVENUE_GATES.findIndex(g => g.amount > totalRevenue);
  const revenuePct = totalRevenue === 0 ? 0 :
    currentGateIdx <= 0 ? 0 :
    Math.min(100, ((currentGateIdx - 1) / (REVENUE_GATES.length - 1)) * 100 +
      ((totalRevenue - REVENUE_GATES[currentGateIdx - 1].amount) /
        (REVENUE_GATES[currentGateIdx].amount - REVENUE_GATES[currentGateIdx - 1].amount)) *
        (100 / (REVENUE_GATES.length - 1)));

  const CATEGORY_ICONS: Record<string, typeof TrendingUp> = {
    "Revenue": DollarSign,
    "Clients & Engagements": Building2,
    "Workforce": Users,
    "CadreHealth": Stethoscope,
    "Agent Channel": Target,
    "Partnerships": Building2,
    "Maarova": Target,
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#0F2744" }}>Progress Tracker</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {achievedMilestones} of {totalMilestones} milestones achieved
        </p>
      </div>

      {/* Overall progress */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{ background: "linear-gradient(135deg, #0F2744 0%, #0B3C5D 60%, #1a5a8a 100%)" }}
      >
        <div className="relative">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>Overall Progress</p>
              <p className="text-3xl sm:text-4xl font-bold text-white mt-1">{overallPct}%</p>
            </div>
            <p className="text-sm font-semibold" style={{ color: "#D4AF37" }}>
              {achievedMilestones}/{totalMilestones}
            </p>
          </div>
          <div className="h-3 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
            <div className="h-3 rounded-full transition-all" style={{ width: `${overallPct}%`, background: "#D4AF37" }} />
          </div>
        </div>
      </div>

      {/* Revenue journey */}
      <div className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
        <h2 className="text-sm font-bold mb-1" style={{ color: "#0F2744" }}>Revenue Journey</h2>
        <p className="text-xs text-gray-400 mb-5">
          Current: {totalRevenue > 0 ? `N${(totalRevenue / 1_000_000).toFixed(1)}M` : "N0"}
        </p>

        <div className="h-4 rounded-full bg-gray-100 relative">
          <div className="h-4 rounded-full transition-all" style={{ width: `${Math.max(revenuePct, 1)}%`, background: "#D4AF37" }} />
        </div>

        <div className="flex justify-between mt-3 overflow-x-auto">
          {REVENUE_GATES.map((g, i) => (
            <div key={g.label} className="text-center min-w-[48px] shrink-0" style={{ width: `${100 / REVENUE_GATES.length}%` }}>
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full mx-auto mb-1"
                style={{ background: totalRevenue >= g.amount ? "#D4AF37" : "#E5E7EB" }}
              />
              <p className="text-[9px] sm:text-[10px] font-semibold" style={{ color: totalRevenue >= g.amount ? "#0F2744" : "#9CA3AF" }}>
                {g.label}
              </p>
              <p className="text-[7px] sm:text-[8px] text-gray-400 hidden sm:block">{g.sublabel}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Milestone categories */}
      <div className="space-y-4">
        {milestoneData.map(cat => {
          const done = cat.milestones.filter(m => m.done).length;
          const total = cat.milestones.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const Icon = CATEGORY_ICONS[cat.category] ?? Target;

          return (
            <div key={cat.category} className="rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E8EBF0" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl p-2.5" style={{ background: "#0F274408" }}>
                    <Icon className="h-4 w-4" style={{ color: "#0F2744" }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: "#0F2744" }}>{cat.category}</h3>
                    <p className="text-[10px] text-gray-400">{done}/{total} completed</p>
                  </div>
                </div>
                <span className="text-lg font-bold" style={{ color: pct === 100 ? "#059669" : "#0F2744" }}>
                  {pct}%
                </span>
              </div>

              <div className="h-1.5 rounded-full bg-gray-100 mb-4">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: pct === 100 ? "#059669" : "#D4AF37" }} />
              </div>

              <div className="space-y-2">
                {cat.milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    {m.done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-gray-300" />
                    )}
                    <span className={`text-sm flex-1 ${m.done ? "text-gray-700" : "text-gray-400"}`}>
                      {m.name}
                    </span>
                    {m.done && m.value && (
                      <span className="text-xs font-semibold text-emerald-600 shrink-0">
                        {m.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
