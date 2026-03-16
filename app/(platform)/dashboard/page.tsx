import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getConsultantCapacity } from "@/lib/capacity";
import { redirect } from "next/navigation";
import { Briefcase, FileCheck, AlertTriangle, Clock, TrendingUp, XCircle, Gauge, Inbox, Sparkles } from "lucide-react";
import Link from "next/link";
import TopBar from "@/components/platform/TopBar";
import StatCard from "@/components/platform/StatCard";
import ProjectCard from "@/components/platform/ProjectCard";
import StatusBadge from "@/components/platform/StatusBadge";
import ConsultantCapacityWidget from "@/components/platform/ConsultantCapacityWidget";
import { formatDate, timeAgo, budgetUtilization, daysRemaining, timelineProgress } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;
  const role = session.user.role;

  const isEM = role === "ENGAGEMENT_MANAGER";
  const isDirector = role === "DIRECTOR" || role === "PARTNER" || role === "ADMIN";
  const isConsultant = role === "CONSULTANT";

  const projectWhere = isDirector
    ? {}
    : isEM
    ? { engagementManagerId: userId }
    : { assignments: { some: { consultantId: userId } } };

  // ─── Fetch projects ───────────────────────────────────────────────────────
  const projects = await prisma.project.findMany({
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
      project: projectWhere,
      status: { in: ["SUBMITTED", "IN_REVIEW"] },
    },
  });

  const pendingTimesheets = await prisma.timeEntry.count({
    where: {
      assignment: { project: projectWhere },
      status: "PENDING",
    },
  });

  // ─── Consultant-specific data ────────────────────────────────────────────
  const pendingAssignments = isConsultant
    ? await prisma.assignment.findMany({
        where: { consultantId: userId, status: "PENDING_ACCEPTANCE" },
        include: {
          project: { select: { id: true, name: true, serviceType: true, client: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const openOpportunities = isConsultant
    ? await prisma.staffingRequest.count({ where: { status: "OPEN" } })
    : 0;

  const capacity = isConsultant ? await getConsultantCapacity(userId) : null;

  // ─── Recent updates ───────────────────────────────────────────────────────
  const recentUpdates = await prisma.projectUpdate.findMany({
    where: { project: projectWhere },
    include: {
      project: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // ─── Alerts ───────────────────────────────────────────────────────────────
  const now = new Date();
  const overdueMilestones = await prisma.milestone.count({
    where: {
      project: projectWhere,
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

      <main className="flex-1 overflow-y-auto p-6 space-y-6">

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

        {/* Consultant: Pending assignment requests */}
        {isConsultant && pendingAssignments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <Inbox size={14} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-gray-900">Assignment Requests</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                {pendingAssignments.length} pending
              </span>
            </div>
            {pendingAssignments.map((a) => (
              <Link
                key={a.id}
                href={`/projects/${a.project.id}`}
                className="flex items-center justify-between gap-4 rounded-xl p-4 transition-shadow hover:shadow-sm"
                style={{ background: "#EFF6FF", border: "1px solid #BFDBFE" }}
              >
                <div>
                  <p className="text-sm font-semibold text-blue-900">{a.role}</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    {a.project.name} · {a.project.client.name}
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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <span className="text-xs text-gray-400">{update.project.name}</span>
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
