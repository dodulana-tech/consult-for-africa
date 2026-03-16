import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ClientPortalLogoutButton from "@/components/client-portal/LogoutButton";
import ClientProjectNav from "@/components/client-portal/ClientProjectNav";
import { Decimal } from "@prisma/client/runtime/library";

/* ─── Style Maps ─────────────────────────────────────────────────────────────── */

const PROJECT_STATUS_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  PLANNING:  { bg: "#EFF6FF", color: "#1D4ED8", label: "Planning" },
  ACTIVE:    { bg: "#D1FAE5", color: "#065F46", label: "Active" },
  ON_HOLD:   { bg: "#F3F4F6", color: "#6B7280", label: "On Hold" },
  AT_RISK:   { bg: "#FEF3C7", color: "#92400E", label: "At Risk" },
  COMPLETED: { bg: "#F0FDF4", color: "#15803D", label: "Completed" },
  CANCELLED: { bg: "#FEE2E2", color: "#991B1B", label: "Cancelled" },
};

const PHASE_STATUS_COLOR: Record<string, string> = {
  COMPLETED: "#D4AF37",
  ACTIVE:    "#0F2744",
  PENDING:   "#CBD5E1",
  SKIPPED:   "#E2E8F0",
};

const MILESTONE_STATUS_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  PENDING:   { bg: "#F3F4F6", color: "#6B7280", label: "Pending" },
  INVOICED:  { bg: "#EFF6FF", color: "#1D4ED8", label: "Invoiced" },
  PAID:      { bg: "#D1FAE5", color: "#065F46", label: "Paid" },
  OVERDUE:   { bg: "#FEE2E2", color: "#991B1B", label: "Overdue" },
};

const DELIVERABLE_STATUS_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  DRAFT:               { bg: "#F3F4F6", color: "#6B7280", label: "Draft" },
  SUBMITTED:           { bg: "#FEF3C7", color: "#92400E", label: "Submitted" },
  IN_REVIEW:           { bg: "#DBEAFE", color: "#1D4ED8", label: "In Review" },
  NEEDS_REVISION:      { bg: "#FEE2E2", color: "#991B1B", label: "Revision Requested" },
  APPROVED:            { bg: "#D1FAE5", color: "#065F46", label: "Approved" },
  DELIVERED_TO_CLIENT: { bg: "#DCFCE7", color: "#166534", label: "Delivered" },
};

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCurrency(amount: Decimal | number, currency: string): string {
  const num = typeof amount === "number" ? amount : Number(amount);
  if (currency === "NGN") {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */

export default async function ClientProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getClientPortalSession();
  if (!session) redirect("/client/login");

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      engagementManager: { select: { name: true, email: true } },
      milestones: { orderBy: { order: "asc" } },
      deliverables: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          dueDate: true,
          fileUrl: true,
          submittedAt: true,
        },
      },
      phases: { orderBy: { order: "asc" } },
      paymentMilestones: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!project) notFound();

  // Verify this project belongs to the authenticated client
  if (project.clientId !== session.clientId) {
    redirect("/client/dashboard");
  }

  /* ── Computed values ─── */

  const statusStyle =
    PROJECT_STATUS_STYLES[project.status] ?? PROJECT_STATUS_STYLES.PLANNING;

  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);
  const now = new Date();
  const totalMs = endDate.getTime() - startDate.getTime();
  const elapsedMs = now.getTime() - startDate.getTime();
  const timeProgress =
    totalMs > 0
      ? Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)))
      : 0;

  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const phasesCompleted = project.phases.filter(
    (p) => p.status === "COMPLETED"
  ).length;
  const activePhase = project.phases.find((p) => p.status === "ACTIVE");

  const deliverablesCompleted = project.deliverables.filter(
    (d) => d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT"
  ).length;

  const milestonesCompleted = project.milestones.filter(
    (m) => m.status === "COMPLETED"
  ).length;

  const totalPaid = project.paymentMilestones
    .filter((pm) => pm.status === "PAID")
    .reduce((sum, pm) => sum + Number(pm.amount), 0);
  const totalPending = project.paymentMilestones
    .filter((pm) => pm.status !== "PAID")
    .reduce((sum, pm) => sum + Number(pm.amount), 0);

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFB" }}>
      {/* Top Nav */}
      <header
        className="bg-white sticky top-0 z-10"
        style={{ borderBottom: "1px solid #e5eaf0" }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-cfa.png" alt="CFA" style={{ height: 28, width: "auto" }} />
            <span
              className="text-sm font-semibold"
              style={{ color: "#0F2744" }}
            >
              Client Portal
            </span>
            <span className="text-gray-300 text-sm">/</span>
            <Link
              href="/client/dashboard"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Projects
            </Link>
            <span className="text-gray-300 text-sm">/</span>
            <span
              className="text-sm font-medium truncate max-w-[200px]"
              style={{ color: "#0F2744" }}
            >
              {project.name}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.name}</span>
            <ClientPortalLogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Back link */}
        <Link
          href="/client/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: "#0F2744" }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to dashboard
        </Link>

        <ClientProjectNav projectId={id} current="" />

        {/* ── 1. Project Hero Card ── */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid #e5eaf0" }}
        >
          {/* Accent bar */}
          <div className="h-1" style={{ background: "#D4AF37" }} />

          <div className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1
                    className="text-2xl font-bold"
                    style={{ color: "#0F2744" }}
                  >
                    {project.name}
                  </h1>
                  <span
                    className="text-[11px] px-3 py-1 rounded-full font-semibold"
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.color,
                    }}
                  >
                    {statusStyle.label}
                  </span>
                </div>
                {project.description && (
                  <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
                    {project.description}
                  </p>
                )}
              </div>
              <div
                className="text-right shrink-0 rounded-xl px-5 py-3"
                style={{ background: "#F8FAFB", border: "1px solid #e5eaf0" }}
              >
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                  Project Budget
                </p>
                <p
                  className="text-xl font-bold"
                  style={{ color: "#0F2744" }}
                >
                  {formatCurrency(project.budgetAmount, project.budgetCurrency)}
                </p>
              </div>
            </div>

            {/* Timeline progress */}
            <div className="mt-6 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs text-gray-500">
                  <span className="font-medium">Timeline</span>
                  <span>
                    {formatDateShort(startDate)} to {formatDateShort(endDate)}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full w-full overflow-hidden"
                  style={{ background: "#e5eaf0" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${timeProgress}%`,
                      background: "#0F2744",
                    }}
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1 text-right">
                  {timeProgress}% of timeline elapsed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Phase Timeline ── */}
        {project.phases.length > 0 && (
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <h2
              className="text-sm font-semibold mb-5"
              style={{ color: "#0F2744" }}
            >
              Project Phases
            </h2>

            {/* Horizontal stepper */}
            <div className="overflow-x-auto">
              <div className="flex items-start gap-0 min-w-max">
                {project.phases.map((phase, idx) => {
                  const isLast = idx === project.phases.length - 1;
                  const dotColor =
                    PHASE_STATUS_COLOR[phase.status] ?? "#CBD5E1";
                  const isActive = phase.status === "ACTIVE";
                  const isCompleted = phase.status === "COMPLETED";

                  return (
                    <div key={phase.id} className="flex items-start">
                      <div className="flex flex-col items-center" style={{ width: "140px" }}>
                        {/* Dot */}
                        <div
                          className="rounded-full shrink-0 flex items-center justify-center"
                          style={{
                            width: isActive ? "32px" : "20px",
                            height: isActive ? "32px" : "20px",
                            background: dotColor,
                            boxShadow: isActive
                              ? "0 0 0 4px rgba(15,39,68,0.15)"
                              : "none",
                          }}
                        >
                          {isCompleted && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M2.5 6L5 8.5L9.5 3.5"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                          {isActive && (
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ background: "white" }}
                            />
                          )}
                        </div>
                        {/* Label */}
                        <p
                          className="text-xs text-center mt-2 leading-tight px-1"
                          style={{
                            color: isActive ? "#0F2744" : isCompleted ? "#64748B" : "#94A3B8",
                            fontWeight: isActive ? 700 : 500,
                          }}
                        >
                          {phase.name}
                        </p>
                        {isActive && (
                          <span
                            className="text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full"
                            style={{ background: "#EFF6FF", color: "#0F2744" }}
                          >
                            Current
                          </span>
                        )}
                        {isCompleted && phase.completedAt && (
                          <span className="text-[10px] text-gray-400 mt-1">
                            {formatDateShort(new Date(phase.completedAt))}
                          </span>
                        )}
                      </div>
                      {/* Connector line */}
                      {!isLast && (
                        <div className="flex items-center" style={{ paddingTop: isActive ? "14px" : "8px" }}>
                          <div
                            className="h-0.5 rounded-full"
                            style={{
                              width: "40px",
                              background:
                                isCompleted ? "#D4AF37" : "#E2E8F0",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active phase detail */}
            {activePhase && (
              <div
                className="mt-5 rounded-xl px-5 py-4"
                style={{ background: "#F8FAFB", border: "1px solid #e5eaf0" }}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">
                      Current Phase
                    </p>
                    <p
                      className="text-sm font-bold"
                      style={{ color: "#0F2744" }}
                    >
                      {activePhase.name}
                    </p>
                    {activePhase.description && (
                      <p className="text-xs text-gray-500 mt-1 max-w-lg">
                        {activePhase.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className="text-2xl font-bold"
                      style={{ color: "#0F2744" }}
                    >
                      {activePhase.percentComplete}%
                    </p>
                    <p className="text-[11px] text-gray-400">complete</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div
                  className="h-1.5 rounded-full w-full overflow-hidden mt-3"
                  style={{ background: "#e5eaf0" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${activePhase.percentComplete}%`,
                      background: "#0F2744",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 3. Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Phases Completed",
              value: `${phasesCompleted}/${project.phases.length}`,
              accent: "#D4AF37",
            },
            {
              label: "Deliverables Completed",
              value: `${deliverablesCompleted}/${project.deliverables.length}`,
              accent: "#0F2744",
            },
            {
              label: "Milestones Completed",
              value: `${milestonesCompleted}/${project.milestones.length}`,
              accent: "#D4AF37",
            },
            {
              label: "Days Remaining",
              value: project.status === "COMPLETED" ? "Done" : `${daysRemaining}`,
              accent: daysRemaining <= 14 ? "#DC2626" : "#0F2744",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl px-5 py-4 relative overflow-hidden"
              style={{ border: "1px solid #e5eaf0" }}
            >
              <div
                className="absolute top-0 left-0 w-full h-0.5"
                style={{ background: stat.accent }}
              />
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                {stat.label}
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: stat.accent }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── 4. Payment Milestones ── */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2
              className="text-sm font-semibold"
              style={{ color: "#0F2744" }}
            >
              Payment Milestones
            </h2>
            {project.paymentMilestones.length > 0 && (
              <div className="flex items-center gap-4 text-xs">
                <span className="text-gray-500">
                  Paid:{" "}
                  <span className="font-semibold" style={{ color: "#065F46" }}>
                    {formatCurrency(totalPaid, project.budgetCurrency)}
                  </span>
                </span>
                <span
                  className="w-px h-3"
                  style={{ background: "#e5eaf0" }}
                />
                <span className="text-gray-500">
                  Pending:{" "}
                  <span className="font-semibold" style={{ color: "#92400E" }}>
                    {formatCurrency(totalPending, project.budgetCurrency)}
                  </span>
                </span>
              </div>
            )}
          </div>

          {project.paymentMilestones.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No payment milestones defined yet.
            </p>
          ) : (
            <div className="space-y-0">
              {project.paymentMilestones.map((pm, idx) => {
                const pmStyle =
                  MILESTONE_STATUS_STYLES[pm.status] ??
                  MILESTONE_STATUS_STYLES.PENDING;
                const isLast =
                  idx === project.paymentMilestones.length - 1;
                const isPaid = pm.status === "PAID";

                return (
                  <div key={pm.id} className="flex gap-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-3 h-3 rounded-full mt-1 shrink-0"
                        style={{
                          background: isPaid
                            ? "#D4AF37"
                            : pm.status === "INVOICED"
                            ? "#0F2744"
                            : pm.status === "OVERDUE"
                            ? "#DC2626"
                            : "#e5eaf0",
                        }}
                      />
                      {!isLast && (
                        <div
                          className="w-0.5 flex-1 my-1"
                          style={{
                            background: isPaid ? "#D4AF37" : "#e5eaf0",
                            minHeight: "24px",
                          }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-medium"
                            style={{ color: "#0F2744" }}
                          >
                            {pm.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <p className="text-xs text-gray-400">
                              Due {formatDateShort(new Date(pm.dueDate))}
                            </p>
                            {pm.paidDate && (
                              <p className="text-xs" style={{ color: "#065F46" }}>
                                Paid {formatDateShort(new Date(pm.paidDate))}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className="text-sm font-bold"
                            style={{ color: isPaid ? "#065F46" : "#0F2744" }}
                          >
                            {formatCurrency(pm.amount, pm.currency)}
                          </span>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: pmStyle.bg,
                              color: pmStyle.color,
                            }}
                          >
                            {pmStyle.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 5. Project Milestones ── */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <h2
            className="text-sm font-semibold mb-5"
            style={{ color: "#0F2744" }}
          >
            Project Milestones
          </h2>
          {project.milestones.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No milestones defined yet.
            </p>
          ) : (
            <div className="space-y-0">
              {project.milestones.map((milestone, idx) => {
                const isCompleted = milestone.status === "COMPLETED";
                const isInProgress = milestone.status === "IN_PROGRESS";
                const isLast = idx === project.milestones.length - 1;

                const msStatusMap: Record<
                  string,
                  { bg: string; color: string; label: string }
                > = {
                  PENDING:     { bg: "#F3F4F6", color: "#6B7280", label: "Pending" },
                  IN_PROGRESS: { bg: "#EFF6FF", color: "#1D4ED8", label: "In Progress" },
                  COMPLETED:   { bg: "#D1FAE5", color: "#065F46", label: "Completed" },
                  DELAYED:     { bg: "#FEF3C7", color: "#92400E", label: "Delayed" },
                  SKIPPED:     { bg: "#F3F4F6", color: "#9CA3AF", label: "Skipped" },
                };
                const msStyle =
                  msStatusMap[milestone.status] ?? msStatusMap.PENDING;

                return (
                  <div key={milestone.id} className="flex gap-4">
                    {/* Timeline dot and line */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-3 h-3 rounded-full mt-1 shrink-0"
                        style={{
                          background: isCompleted
                            ? "#D4AF37"
                            : isInProgress
                            ? "#0F2744"
                            : "#e5eaf0",
                          boxShadow: isInProgress
                            ? "0 0 0 3px rgba(15,39,68,0.15)"
                            : "none",
                        }}
                      />
                      {!isLast && (
                        <div
                          className="w-0.5 flex-1 my-1"
                          style={{
                            background: isCompleted ? "#D4AF37" : "#e5eaf0",
                            minHeight: "24px",
                          }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-5">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: "#0F2744" }}
                          >
                            {milestone.name}
                          </p>
                          {milestone.description && (
                            <p className="text-xs text-gray-500 mt-0.5 max-w-lg">
                              {milestone.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            Due {formatDateShort(new Date(milestone.dueDate))}
                            {milestone.completionDate &&
                              ` | Completed ${formatDateShort(new Date(milestone.completionDate))}`}
                          </p>
                        </div>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                          style={{
                            background: msStyle.bg,
                            color: msStyle.color,
                          }}
                        >
                          {msStyle.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 6. Deliverables ── */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <h2
            className="text-sm font-semibold mb-5"
            style={{ color: "#0F2744" }}
          >
            Deliverables
          </h2>
          {project.deliverables.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              No deliverables yet.
            </p>
          ) : (
            <div className="space-y-3">
              {project.deliverables.map((d) => {
                const dStyle =
                  DELIVERABLE_STATUS_STYLES[d.status] ??
                  DELIVERABLE_STATUS_STYLES.DRAFT;
                const canDownload =
                  d.fileUrl &&
                  (d.status === "APPROVED" ||
                    d.status === "DELIVERED_TO_CLIENT");

                return (
                  <div
                    key={d.id}
                    className="rounded-xl px-5 py-4"
                    style={{
                      border: "1px solid #e5eaf0",
                      background: "#FAFBFC",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <p
                            className="text-sm font-medium"
                            style={{ color: "#0F2744" }}
                          >
                            {d.name}
                          </p>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: dStyle.bg,
                              color: dStyle.color,
                            }}
                          >
                            {dStyle.label}
                          </span>
                        </div>
                        {d.description && (
                          <p className="text-xs text-gray-500 mt-1 max-w-lg leading-relaxed">
                            {d.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          {d.dueDate && (
                            <p className="text-[11px] text-gray-400">
                              Due {formatDateShort(new Date(d.dueDate))}
                            </p>
                          )}
                          {d.submittedAt && (
                            <p className="text-[11px] text-gray-400">
                              Submitted{" "}
                              {formatDateShort(new Date(d.submittedAt))}
                            </p>
                          )}
                        </div>
                      </div>
                      {canDownload && (
                        <a
                          href={d.fileUrl!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90 shrink-0"
                          style={{
                            background: "#0F2744",
                            color: "#fff",
                          }}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                          >
                            <path
                              d="M7 2v7.5M7 9.5L4.5 7M7 9.5L9.5 7M3 11.5h8"
                              stroke="currentColor"
                              strokeWidth="1.25"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 7. Engagement Manager ── */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <h2
            className="text-sm font-semibold mb-4"
            style={{ color: "#0F2744" }}
          >
            Your Engagement Manager
          </h2>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: "#0F2744" }}
              >
                {project.engagementManager.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#0F2744" }}
                >
                  {project.engagementManager.name}
                </p>
                <p className="text-xs text-gray-500">
                  {project.engagementManager.email}
                </p>
              </div>
            </div>
            <a
              href={`mailto:${project.engagementManager.email}`}
              className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-lg transition-opacity hover:opacity-90"
              style={{
                background: "#0F2744",
                color: "#fff",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <rect
                  x="1.5"
                  y="3"
                  width="11"
                  height="8"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.25"
                />
                <path
                  d="M1.5 4.5L7 8L12.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Send Email
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
