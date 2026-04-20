import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getConsultantCapacity } from "@/lib/capacity";
import { redirect } from "next/navigation";
import { Briefcase, FileCheck, AlertTriangle, Clock, TrendingUp, XCircle, Gauge, Inbox, Sparkles, Shield, DollarSign } from "lucide-react";
import Link from "next/link";
import TopBar from "@/components/platform/TopBar";
import StatCard from "@/components/platform/StatCard";
import ProjectCard from "@/components/platform/ProjectCard";
import StatusBadge from "@/components/platform/StatusBadge";
import ConsultantCapacityWidget from "@/components/platform/ConsultantCapacityWidget";
import { formatDate, timeAgo, budgetUtilization, daysRemaining, timelineProgress } from "@/lib/utils";
import { getDashboardInsights, getPersonalImpact } from "@/lib/dashboardInsights";
import { calculateTierScore, TIER_BADGES } from "@/lib/consultantTier";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;
  const role = session.user.role;

  // Academy Learners have no dashboard -- redirect to Academy
  if (role === "ACADEMY_LEARNER") redirect("/academy");

  const isEM = role === "ENGAGEMENT_MANAGER";
  const isDirector = role === "DIRECTOR" || role === "PARTNER" || role === "ADMIN";
  const isConsultant = role === "CONSULTANT";

  // Redirect new consultants to onboarding if not yet completed
  if (isConsultant) {
    const onboarding = await prisma.consultantOnboarding.findUnique({
      where: { userId },
      select: { status: true },
    });
    if (onboarding && !["ACTIVE", "ASSESSMENT_COMPLETE", "REVIEW"].includes(onboarding.status)) {
      redirect("/onboarding");
    }
  }

  const projectWhere = isDirector
    ? {}
    : isEM
    ? { engagementManagerId: userId }
    : { assignments: { some: { consultantId: userId } } };

  // ─── Fetch projects ───────────────────────────────────────────────────────
  const projects = await prisma.engagement.findMany({
    where: projectWhere,
    include: {
      client: { select: { name: true } },
      engagementManager: { select: { name: true } },
      _count: { select: { assignments: true } },
    },
    orderBy: [{ status: "asc" }, { endDate: "asc" }],
  });

  // ─── Stats ────────────────────────────────────────────────────────────────
  const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
  const atRiskProjects = projects.filter((p) => p.status === "AT_RISK").length;

  const pendingDeliverables = await prisma.deliverable.count({
    where: {
      engagement: projectWhere,
      status: { in: ["SUBMITTED", "IN_REVIEW"] },
    },
  });

  const pendingTimesheets = await prisma.timeEntry.count({
    where: {
      assignment: { engagement: projectWhere },
      status: "PENDING",
    },
  });

  // ─── Consultant-specific data ────────────────────────────────────────────
  const pendingAssignments = isConsultant
    ? await prisma.assignment.findMany({
        where: { consultantId: userId, status: "PENDING_ACCEPTANCE" },
        include: {
          engagement: { select: { id: true, name: true, serviceType: true, client: { select: { name: true } } } },
          track: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const openOpportunities = isConsultant
    ? await prisma.staffingRequest.count({ where: { status: "OPEN" } })
    : 0;

  const capacity = isConsultant ? await getConsultantCapacity(userId) : null;
  const tierScore = isConsultant ? await calculateTierScore(userId) : null;

  // ─── Agent opportunities for consultants ─────────────────────────────────
  const agentOpportunities = isConsultant
    ? await prisma.agentOpportunity.findMany({
        where: { status: "OPEN" },
        select: {
          id: true,
          title: true,
          clientName: true,
          commissionType: true,
          commissionValue: true,
          commissionCurrency: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      })
    : [];

  // ─── Recent updates ───────────────────────────────────────────────────────
  const recentUpdates = await prisma.engagementUpdate.findMany({
    where: { engagement: projectWhere },
    include: {
      engagement: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // ─── Alerts ───────────────────────────────────────────────────────────────
  const now = new Date();
  const overdueMilestones = await prisma.milestone.count({
    where: {
      engagement: projectWhere,
      dueDate: { lt: now },
      status: { notIn: ["COMPLETED", "SKIPPED"] },
    },
  });

  const serialized = projects.map((p) => ({
    ...p,
    budgetAmount: Number(p.budgetAmount),
    actualSpent: Number(p.actualSpent),
    startDate: p.startDate,
    endDate: p.endDate,
    budgetCurrency: p.budgetCurrency as "NGN" | "USD",
  }));

  // ─── Compute per-project alerts ──────────────────────────────────────────
  type AlertLevel = "critical" | "warning";
  interface DashAlert { level: AlertLevel; projectId: string; projectName: string; message: string }
  const alerts: DashAlert[] = [];

  for (const p of serialized) {
    const budgetPct = budgetUtilization(p.actualSpent, p.budgetAmount);
    const days = daysRemaining(p.endDate);
    const timelinePct = timelineProgress(p.startDate, p.endDate);

    if (budgetPct > 90 && p.status !== "COMPLETED" && p.status !== "CANCELLED") {
      alerts.push({ level: "critical", projectId: p.id, projectName: p.name, message: `Budget at ${budgetPct}% with ${days > 0 ? `${days}d remaining` : "project overdue"}` });
    } else if (budgetPct > 80 && p.status === "ACTIVE") {
      alerts.push({ level: "warning", projectId: p.id, projectName: p.name, message: `Budget at ${budgetPct}% . Monitor spend closely` });
    }

    if (budgetPct > timelinePct + 20 && p.status === "ACTIVE") {
      alerts.push({ level: "warning", projectId: p.id, projectName: p.name, message: `Burning budget faster than timeline: ${budgetPct}% spent vs ${timelinePct}% time elapsed` });
    }

    if (days < 0 && p.status === "ACTIVE") {
      alerts.push({ level: "critical", projectId: p.id, projectName: p.name, message: `Project overdue by ${Math.abs(days)} days` });
    } else if (days < 14 && days > 0 && p.status === "ACTIVE") {
      alerts.push({ level: "warning", projectId: p.id, projectName: p.name, message: `Ending in ${days} days` });
    }

    if (p.status === "AT_RISK") {
      alerts.push({ level: "critical", projectId: p.id, projectName: p.name, message: "Marked at risk . Action required" });
    }
  }

  if (overdueMilestones > 0) {
    alerts.push({ level: "critical", projectId: "", projectName: "Portfolio", message: `${overdueMilestones} overdue milestone${overdueMilestones > 1 ? "s" : ""} across projects` });
  }

  // dedupe by projectId + message prefix to avoid spam
  const seen = new Set<string>();
  const uniqueAlerts = alerts.filter((a) => {
    const key = `${a.projectId}:${a.level}:${a.message.slice(0, 30)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ─── Smart insights from Nuru ────────────────────────────────────────────
  const insights = await getDashboardInsights(userId, role);
  const impact = isConsultant ? await getPersonalImpact(userId) : null;

  // ─── Check onboarding status for consultants ─────────────────────────────
  const onboarding = isConsultant
    ? await prisma.consultantOnboarding.findUnique({
        where: { userId },
        select: { status: true },
      })
    : null;

  const showOnboardingBanner = onboarding && onboarding.status !== "ACTIVE" && onboarding.status !== "REJECTED";

  const nameParts = session.user.name?.split(" ") ?? [];
  const TITLES = ["dr.", "mr.", "mrs.", "ms.", "prof.", "sir"];
  const firstName = nameParts.find((p) => !TITLES.includes(p.toLowerCase().replace(",", ""))) ?? "there";

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title={`Good morning, ${firstName}`}
        subtitle={formatDate(new Date())}
      />

      <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-6">

        {/* Onboarding banner */}
        {showOnboardingBanner && (
          <Link
            href="/onboarding"
            className="flex items-center gap-4 px-5 py-4 rounded-xl transition-shadow hover:shadow-sm"
            style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#DBEAFE" }}>
              <Sparkles size={18} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-blue-900">Complete your onboarding</p>
              <p className="text-xs text-blue-700 mt-0.5">
                {onboarding.status === "REVIEW"
                  ? "Your profile is under review. We will notify you when it is approved."
                  : "Set up your profile, banking details, and skills assessment to get started."}
              </p>
            </div>
            {onboarding.status !== "REVIEW" && (
              <span className="text-xs font-semibold text-blue-600 shrink-0">Continue &rarr;</span>
            )}
          </Link>
        )}

        {/* Alerts */}
        {uniqueAlerts.length > 0 && (
          <div className="space-y-2">
            {uniqueAlerts.map((alert, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                style={
                  alert.level === "critical"
                    ? { background: "#FEF2F2", border: "1px solid #FECACA" }
                    : { background: "#FEF3C7", border: "1px solid #FDE68A" }
                }
              >
                {alert.level === "critical"
                  ? <XCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                  : <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  {alert.projectId ? (
                    <Link href={`/projects/${alert.projectId}`} className="font-semibold hover:underline" style={{ color: alert.level === "critical" ? "#991B1B" : "#92400E" }}>
                      {alert.projectName}
                    </Link>
                  ) : (
                    <span className="font-semibold" style={{ color: alert.level === "critical" ? "#991B1B" : "#92400E" }}>
                      {alert.projectName}
                    </span>
                  )}
                  <span style={{ color: alert.level === "critical" ? "#B91C1C" : "#B45309" }}> · {alert.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Nuru insights */}
        {insights.length > 0 && (
          <div className="space-y-2">
            {insights.map((insight, i) => {
              const accentStyles: Record<string, { bg: string; border: string }> = {
                gold: { bg: "#FFFBEB", border: "#FDE68A" },
                blue: { bg: "#EFF6FF", border: "#BFDBFE" },
                green: { bg: "#ECFDF5", border: "#A7F3D0" },
                amber: { bg: "#FEF3C7", border: "#FDE68A" },
                purple: { bg: "#F5F3FF", border: "#DDD6FE" },
              };
              const s = accentStyles[insight.accent] ?? accentStyles.blue;
              const cardStyle = { background: s.bg, border: `1px solid ${s.border}` };
              const cardClass = "flex items-start gap-3 px-4 py-3 rounded-xl transition-shadow hover:shadow-sm";

              const content = (
                <>
                  <span className="text-base shrink-0 mt-0.5">{insight.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{insight.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{insight.message}</p>
                  </div>
                </>
              );

              return insight.href ? (
                <Link key={i} href={insight.href} className={cardClass} style={cardStyle}>{content}</Link>
              ) : (
                <div key={i} className={cardClass} style={cardStyle}>{content}</div>
              );
            })}
          </div>
        )}

        {/* Personal impact counter (consultants) */}
        {impact && (
          <div className="rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-6" style={{ background: "#0F2744" }}>
            <div className="text-center">
              <p className="text-xl font-bold text-white">{impact.projectsContributed}</p>
              <p className="text-xs text-white/50 uppercase tracking-wide">Projects</p>
            </div>
            <div className="w-px h-8 bg-white/15 hidden sm:block" />
            <div className="text-center">
              <p className="text-xl font-bold text-white">{impact.deliverablesApproved}</p>
              <p className="text-xs text-white/50 uppercase tracking-wide">Deliverables</p>
            </div>
            <div className="w-px h-8 bg-white/15 hidden sm:block" />
            <div className="text-center">
              <p className="text-xl font-bold" style={{ color: "#D4AF37" }}>{impact.totalHours}h</p>
              <p className="text-xs text-white/50 uppercase tracking-wide">Hours</p>
            </div>
            {impact.avgClientSatisfaction && (
              <>
                <div className="w-px h-8 bg-white/15 hidden sm:block" />
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{impact.avgClientSatisfaction}/5</p>
                  <p className="text-xs text-white/50 uppercase tracking-wide">Rating</p>
                </div>
              </>
            )}
            <div className="flex-1" />
            <p className="text-xs text-white/40">Your C4A Impact</p>
          </div>
        )}

        {/* Consultant: Pending assignment requests */}
        {isConsultant && pendingAssignments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Inbox size={14} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-900">Assignment Requests</h2>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                {pendingAssignments.length} pending
              </span>
            </div>
            {pendingAssignments.map((a) => (
              <Link
                key={a.id}
                href={`/projects/${a.engagement.id}`}
                className="flex items-center justify-between gap-4 rounded-xl p-4 transition-shadow hover:shadow-sm"
                style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
              >
                <div>
                  {a.track && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium inline-block mb-1"
                      style={{ background: "#DBEAFE", color: "#1E40AF" }}
                    >
                      {a.track.name}
                    </span>
                  )}
                  <p className="text-sm font-semibold text-blue-900">
                    {a.role}
                    {a.trackRole && a.trackRole !== a.role && (
                      <span className="font-normal text-blue-600 ml-1">/ {a.trackRole}</span>
                    )}
                  </p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    {a.engagement.name} · {a.engagement.client.name}
                    {a.allocationPct != null && a.allocationPct < 100 && (
                      <span className="ml-1">· {a.allocationPct}% allocation</span>
                    )}
                  </p>
                </div>
                <span className="text-xs font-semibold text-blue-600 shrink-0">Review &rarr;</span>
              </Link>
            ))}
          </div>
        )}

        {/* Consultant: Capacity + opportunities row */}
        {isConsultant && capacity && (
          <ConsultantCapacityWidget
            capacity={capacity}
            openOpportunities={openOpportunities}
          />
        )}

        {/* Your C4A Standing */}
        {isConsultant && tierScore && (() => {
          const tb = TIER_BADGES[tierScore.currentTier];
          const next = tierScore.nextTierRequirements;
          const elig = tierScore.ownGigEligibility;

          // Threshold targets for next tier progress bars
          const THRESHOLDS: Record<string, { hours: number; projects: number; months: number; rating: number | null }> = {
            EMERGING: { hours: 50, projects: 1, months: 0, rating: null },
            STANDARD: { hours: 200, projects: 2, months: 3, rating: 3.5 },
            EXPERIENCED: { hours: 500, projects: 5, months: 6, rating: 4.0 },
            ELITE: { hours: 1000, projects: 10, months: 12, rating: 4.5 },
          };
          const target = next ? THRESHOLDS[next.tier] : null;

          return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Shield size={16} className="text-[#0F2744]" />
                  <h2 className="text-sm font-semibold text-[#0F2744]">Your C4A Standing</h2>
                </div>
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: tb.bg, color: tb.color }}
                >
                  {tb.label}
                </span>
              </div>

              {/* Progress to next tier */}
              {next && target && (
                <div className="space-y-2.5">
                  <p className="text-xs text-slate-500">Progress to {TIER_BADGES[next.tier]?.label ?? next.tier} tier</p>
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Hours</span>
                        <span className="text-slate-400">{Math.round(tierScore.totalPlatformHours)} / {target.hours}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "#e5eaf0" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (tierScore.totalPlatformHours / target.hours) * 100)}%`, background: "#D4A574" }} />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Projects</span>
                        <span className="text-slate-400">{tierScore.completedProjects} / {target.projects}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "#e5eaf0" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (tierScore.completedProjects / target.projects) * 100)}%`, background: "#D4A574" }} />
                      </div>
                    </div>
                    {target.months > 0 && (
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Months</span>
                          <span className="text-slate-400">{tierScore.monthsOnPlatform} / {target.months}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "#e5eaf0" }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (tierScore.monthsOnPlatform / target.months) * 100)}%`, background: "#D4A574" }} />
                        </div>
                      </div>
                    )}
                    {target.rating !== null && (
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">Rating</span>
                          <span className="text-slate-400">{tierScore.averageRating.toFixed(1)} / {target.rating}</span>
                        </div>
                        <div className="h-1.5 rounded-full" style={{ background: "#e5eaf0" }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, (tierScore.averageRating / target.rating) * 100)}%`, background: "#D4A574" }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Own gig eligibility */}
              <div className="pt-1">
                {elig.eligible ? (
                  <p className="text-xs text-green-700">
                    Own gigs available. {elig.maxConcurrent === -1 ? "Unlimited" : `Up to ${elig.maxConcurrent}`} concurrent gig{elig.maxConcurrent !== 1 ? "s" : ""}.
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    {next ? `${next.hoursNeeded > 0 ? `${next.hoursNeeded} more hours` : ""}${next.hoursNeeded > 0 && next.projectsNeeded > 0 ? " and " : ""}${next.projectsNeeded > 0 ? `${next.projectsNeeded} more project${next.projectsNeeded !== 1 ? "s" : ""}` : ""} to unlock own gigs` : "Keep building your track record to unlock own gigs."}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* Agent Opportunities */}
        {isConsultant && agentOpportunities.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <DollarSign size={16} style={{ color: "#B8860B" }} />
                <h2 className="text-sm font-semibold text-[#0F2744]">Earn extra income</h2>
              </div>
              <Link href="/opportunities/agent" className="text-xs font-semibold" style={{ color: "#B8860B" }}>
                View All &rarr;
              </Link>
            </div>
            <p className="text-xs text-slate-500">Refer clients and earn commissions on closed deals.</p>
            <div className="space-y-2">
              {agentOpportunities.map((opp) => {
                const commLabel =
                  opp.commissionType === "PERCENTAGE"
                    ? `Up to ${Number(opp.commissionValue)}%`
                    : opp.commissionType === "TIERED"
                    ? `Up to ${Number(opp.commissionValue)}%`
                    : opp.commissionType === "RECURRING"
                    ? `${Number(opp.commissionValue)}% recurring`
                    : opp.commissionType === "FIXED_PER_DEAL"
                    ? `${opp.commissionCurrency === "NGN" ? "\u20A6" : "$"}${Number(opp.commissionValue).toLocaleString()} per deal`
                    : `${Number(opp.commissionValue)}%`;
                return (
                  <Link
                    key={opp.id}
                    href={`/opportunities/agent?apply=${opp.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50"
                    style={{ border: "1px solid #F1F5F9" }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{opp.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opp.clientName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#FEF9E7", color: "#B8860B" }}
                      >
                        {commLabel}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Projects"
            value={activeProjects}
            sub={`${projects.length} total`}
            icon={Briefcase}
            accent="default"
            href="/projects"
          />
          <StatCard
            label="Pending Reviews"
            value={pendingDeliverables}
            sub={pendingDeliverables > 0 ? "Needs attention" : "All clear"}
            icon={FileCheck}
            accent={pendingDeliverables > 0 ? "warning" : "success"}
            href="/projects"
          />
          <StatCard
            label="At Risk"
            value={atRiskProjects}
            sub={atRiskProjects > 0 ? "Requires action" : "Portfolio healthy"}
            icon={AlertTriangle}
            accent={atRiskProjects > 0 ? "danger" : "success"}
            href="/projects"
          />
          <StatCard
            label="Timesheets"
            value={pendingTimesheets}
            sub="Pending approval"
            icon={Clock}
            accent={pendingTimesheets > 0 ? "warning" : "default"}
            href="/timesheets"
          />
        </div>

        {/* Projects grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              {isEM ? "Your Projects" : "All Projects"}
            </h2>
            <span className="text-xs text-gray-400">{projects.length} total</span>
          </div>

          {serialized.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <Briefcase size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No projects assigned yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {serialized.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        {recentUpdates.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
              {recentUpdates.map((update) => (
                <div key={update.id} className="px-5 py-3.5 flex items-start gap-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: "#D4AF37" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-700 leading-snug">{update.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{update.engagement.name}</span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-400">{timeAgo(update.createdAt)}</span>
                    </div>
                  </div>
                  <StatusBadge status={update.type} />
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
