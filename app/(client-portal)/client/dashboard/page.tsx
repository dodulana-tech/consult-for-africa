import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientPortalLogoutButton from "@/components/client-portal/LogoutButton";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PLANNING:  { bg: "#EFF6FF", color: "#1D4ED8", label: "Planning" },
  ACTIVE:    { bg: "#D1FAE5", color: "#065F46", label: "Active" },
  ON_HOLD:   { bg: "#F3F4F6", color: "#6B7280", label: "On Hold" },
  AT_RISK:   { bg: "#FEF3C7", color: "#92400E", label: "At Risk" },
  COMPLETED: { bg: "#F0FDF4", color: "#15803D", label: "Completed" },
  CANCELLED: { bg: "#FEE2E2", color: "#991B1B", label: "Cancelled" },
};

const PHASE_STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  COMPLETED: { bg: "#D1FAE5", color: "#065F46", border: "#A7F3D0" },
  ACTIVE:    { bg: "#FEF9E7", color: "#92400E", border: "#D4AF37" },
  PENDING:   { bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB" },
  SKIPPED:   { bg: "#F3F4F6", color: "#9CA3AF", border: "#E5E7EB" },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || "";
  return text.slice(0, maxLength).trimEnd() + "...";
}

function getTimelineProgress(startDate: Date, endDate: Date): number {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function ClientDashboardPage() {
  const session = await getClientPortalSession();
  if (!session) redirect("/client/login");

  const projects = await prisma.engagement.findMany({
    where: { clientId: session.clientId },
    include: {
      engagementManager: { select: { name: true, email: true } },
      milestones: {
        select: { name: true, status: true, dueDate: true, order: true },
        orderBy: { order: "asc" },
      },
      phases: {
        select: { name: true, status: true, order: true },
        orderBy: { order: "asc" },
      },
      deliverables: {
        select: { status: true },
        where: { status: { in: ["APPROVED", "DELIVERED_TO_CLIENT"] } },
      },
      _count: {
        select: { deliverables: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch full project details for description and dates
  const projectDetails = await prisma.engagement.findMany({
    where: { clientId: session.clientId },
    select: {
      id: true,
      description: true,
      startDate: true,
      endDate: true,
    },
  });
  const detailsMap = new Map(projectDetails.map((p) => [p.id, p]));

  const client = await prisma.client.findUnique({
    where: { id: session.clientId },
    select: { name: true },
  });

  // Summary calculations
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (p) => p.status === "ACTIVE" || p.status === "AT_RISK"
  ).length;

  const totalDeliverables = projects.reduce((sum, p) => sum + p._count.deliverables, 0);
  const approvedDeliverables = projects.reduce((sum, p) => sum + p.deliverables.length, 0);

  // Next milestone due (upcoming, not completed)
  const upcomingMilestones = projects
    .flatMap((p) =>
      p.milestones
        .filter((m) => m.status !== "COMPLETED" && m.status !== "SKIPPED")
        .map((m) => ({ ...m, projectName: p.name }))
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const nextMilestone = upcomingMilestones[0] ?? null;

  const greeting = getGreeting();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F8FAFB" }}>
      {/* Top Nav */}
      <header
        className="bg-white sticky top-0 z-10"
        style={{ borderBottom: "1px solid #e5eaf0" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-cfa.png" alt="C4A" style={{ height: 28, width: "auto" }} />
            <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>
              Client Portal
            </span>
            {client && (
              <>
                <span className="text-gray-300 text-sm">/</span>
                <span className="text-sm text-gray-600">{client.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.name}</span>
            <ClientPortalLogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
            {greeting}, {session.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome to your {client?.name || "project"} dashboard. Here is an overview of your engagements with Consult For Africa.
          </p>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Projects */}
          <div
            className="bg-white rounded-2xl p-5"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "#EFF6FF" }}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#1D4ED8" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Projects
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>
              {totalProjects}
            </p>
          </div>

          {/* Active Projects */}
          <div
            className="bg-white rounded-2xl p-5"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "#D1FAE5" }}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#065F46" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Active
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>
              {activeProjects}
            </p>
          </div>

          {/* Deliverables Completed */}
          <div
            className="bg-white rounded-2xl p-5"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "#FEF9E7" }}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#D4AF37" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Deliverables
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>
              {approvedDeliverables}
              <span className="text-sm font-normal text-gray-400"> / {totalDeliverables}</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">approved</p>
          </div>

          {/* Next Milestone */}
          <div
            className="bg-white rounded-2xl p-5"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "#FEF3C7" }}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#92400E" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Next Milestone
              </span>
            </div>
            {nextMilestone ? (
              <>
                <p
                  className="text-sm font-semibold leading-tight"
                  style={{ color: "#0F2744" }}
                >
                  {truncate(nextMilestone.name, 36)}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {formatDate(nextMilestone.dueDate)}
                  {" "}
                  <span
                    className="font-medium"
                    style={{
                      color: daysUntil(nextMilestone.dueDate) < 0
                        ? "#991B1B"
                        : daysUntil(nextMilestone.dueDate) <= 7
                          ? "#92400E"
                          : "#6B7280",
                    }}
                  >
                    ({daysUntil(nextMilestone.dueDate) < 0
                      ? `${Math.abs(daysUntil(nextMilestone.dueDate))}d overdue`
                      : daysUntil(nextMilestone.dueDate) === 0
                        ? "today"
                        : `in ${daysUntil(nextMilestone.dueDate)}d`})
                  </span>
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">No upcoming milestones</p>
            )}
          </div>
        </div>

        {/* Section heading */}
        <div className="mb-5">
          <h2 className="text-lg font-semibold" style={{ color: "#0F2744" }}>
            Your Projects
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalProjects} engagement{totalProjects !== 1 ? "s" : ""} with Consult For Africa
          </p>
        </div>

        {/* Project Cards */}
        {projects.length === 0 ? (
          <div
            className="rounded-2xl bg-white p-12 text-center"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <p className="text-gray-400 text-sm">No projects found.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {projects.map((project) => {
              const details = detailsMap.get(project.id);
              const milestonesTotal = project.milestones.length;
              const milestonesCompleted = project.milestones.filter(
                (m) => m.status === "COMPLETED"
              ).length;
              const milestoneProgress =
                milestonesTotal > 0
                  ? Math.round((milestonesCompleted / milestonesTotal) * 100)
                  : 0;

              const totalDel = project._count.deliverables;
              const approvedDel = project.deliverables.length;
              const deliverableProgress =
                totalDel > 0 ? Math.round((approvedDel / totalDel) * 100) : 0;

              const statusStyle =
                STATUS_STYLES[project.status] ?? STATUS_STYLES.PLANNING;

              const timelineProgress =
                details?.startDate && details?.endDate
                  ? getTimelineProgress(details.startDate, details.endDate)
                  : 0;

              const currentPhase = project.phases.find((p) => p.status === "ACTIVE");

              return (
                <div
                  key={project.id}
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{ border: "1px solid #e5eaf0" }}
                >
                  {/* Card Header */}
                  <div className="p-6 pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3
                            className="text-base font-semibold"
                            style={{ color: "#0F2744" }}
                          >
                            {project.name}
                          </h3>
                          <span
                            className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                            style={{
                              background: statusStyle.bg,
                              color: statusStyle.color,
                            }}
                          >
                            {statusStyle.label}
                          </span>
                        </div>
                        {details?.description && (
                          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                            {truncate(details.description, 180)}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/client/projects/${project.id}`}
                        className="shrink-0 text-xs font-semibold px-4 py-2 rounded-lg transition-colors hover:opacity-90"
                        style={{
                          background: "#0F2744",
                          color: "#fff",
                        }}
                      >
                        View Project
                      </Link>
                    </div>
                  </div>

                  {/* Phase Progress */}
                  {project.phases.length > 0 && (
                    <div className="px-6 pt-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 font-medium">
                          Phase Progress
                        </span>
                        {currentPhase && (
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                            style={{
                              background: "#FEF9E7",
                              color: "#92400E",
                              border: "1px solid #D4AF37",
                            }}
                          >
                            Current: {currentPhase.name}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {project.phases.map((phase) => {
                          const phaseStyle =
                            PHASE_STATUS_STYLES[phase.status] ?? PHASE_STATUS_STYLES.PENDING;
                          return (
                            <div
                              key={`${project.id}-phase-${phase.order}`}
                              className="flex-1 group relative"
                            >
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  background: phaseStyle.bg,
                                  border: `1px solid ${phaseStyle.border}`,
                                }}
                              />
                              <p
                                className="text-[10px] mt-1 truncate"
                                style={{ color: phaseStyle.color }}
                              >
                                {phase.name}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Progress Bars and Timeline */}
                  <div className="p-6 space-y-4">
                    {/* Timeline Bar */}
                    {details?.startDate && details?.endDate && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-gray-500 font-medium">
                            Timeline
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {formatDate(details.startDate)} to {formatDate(details.endDate)}
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full w-full overflow-hidden"
                          style={{ background: "#e5eaf0" }}
                        >
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${timelineProgress}%`,
                              background:
                                timelineProgress >= 90
                                  ? "#DC2626"
                                  : timelineProgress >= 70
                                    ? "#F59E0B"
                                    : "#0F2744",
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {timelineProgress}% of timeline elapsed
                        </p>
                      </div>
                    )}

                    {/* Milestone Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500 font-medium">
                          Milestones
                        </span>
                        <span className="text-xs text-gray-700 font-semibold">
                          {milestonesCompleted} / {milestonesTotal}
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full w-full overflow-hidden"
                        style={{ background: "#e5eaf0" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${milestoneProgress}%`,
                            background: "#D4AF37",
                          }}
                        />
                      </div>
                    </div>

                    {/* Deliverables Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-gray-500 font-medium">
                          Deliverables Approved
                        </span>
                        <span className="text-xs text-gray-700 font-semibold">
                          {approvedDel} / {totalDel}
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full w-full overflow-hidden"
                        style={{ background: "#e5eaf0" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${deliverableProgress}%`,
                            background: "#065F46",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: EM Info */}
                  <div
                    className="px-6 py-3.5 flex items-center justify-between"
                    style={{
                      borderTop: "1px solid #e5eaf0",
                      background: "#FAFBFC",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                        style={{ background: "#0F2744" }}
                      >
                        {project.engagementManager?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase() ?? "C4"}
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: "#0F2744" }}>
                          {project.engagementManager?.name ?? "Consult For Africa"}
                        </p>
                        <p className="text-[11px] text-gray-400">Engagement Manager</p>
                      </div>
                    </div>
                    {project.engagementManager?.email && (
                      <a
                        href={`mailto:${project.engagementManager!.email}`}
                        className="text-[11px] font-medium hover:underline"
                        style={{ color: "#D4AF37" }}
                      >
                        {project.engagementManager!.email}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Link
            href="/client/invoices"
            className="group rounded-2xl bg-white p-6 transition-all hover:shadow-md"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>Invoices</p>
                <p className="text-xs text-gray-500 mt-1">View and pay your invoices online</p>
              </div>
              <span className="text-gray-300 group-hover:text-gray-500 transition-colors text-lg">&rarr;</span>
            </div>
          </Link>
          <Link
            href="/client/knowledge"
            className="group rounded-2xl bg-white p-6 transition-all hover:shadow-md"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>Knowledge Library</p>
                <p className="text-xs text-gray-500 mt-1">Insights, guides, and case studies curated for you</p>
              </div>
              <span className="text-gray-300 group-hover:text-gray-500 transition-colors text-lg">&rarr;</span>
            </div>
          </Link>
          <Link
            href="/#contact-expansion"
            onClick={(e) => e.preventDefault()}
            className="rounded-2xl bg-white p-6"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>Need additional support?</p>
            <p className="text-xs text-gray-500 mt-1">Contact your engagement manager to discuss expanding your engagement</p>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="mt-auto py-6"
        style={{ borderTop: "1px solid #e5eaf0", background: "#fff" }}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "#0F2744" }}
            >
              <span className="text-white text-[10px] font-bold">C</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: "#0F2744" }}>
              Consult For Africa
            </span>
          </div>
          <p className="text-[11px] text-gray-400">
            &copy; {new Date().getFullYear()} Consult For Africa. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
