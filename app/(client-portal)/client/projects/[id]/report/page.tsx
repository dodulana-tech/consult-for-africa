import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ClientPortalLogoutButton from "@/components/client-portal/LogoutButton";
import ClientProjectNav from "@/components/client-portal/ClientProjectNav";
import { Decimal } from "@prisma/client/runtime/library";

/* --- Helpers ---------------------------------------------------------------- */

function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCurrency(amount: Decimal | number, currency: string): string {
  const num = typeof amount === "number" ? amount : Number(amount);
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  }
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  HOSPITAL_OPERATIONS: "Hospital Operations",
  TURNAROUND: "Turnaround",
  EMBEDDED_LEADERSHIP: "Embedded Leadership",
  CLINICAL_GOVERNANCE: "Clinical Governance",
  DIGITAL_HEALTH: "Digital Health",
  HEALTH_SYSTEMS: "Health Systems",
  DIASPORA_EXPERTISE: "Diaspora Expertise",
  EM_AS_SERVICE: "EM-as-a-Service",
};

const PROJECT_STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
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

/* --- Page ------------------------------------------------------------------- */

export default async function ClientExecutiveSummaryPage({
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
      phases: { orderBy: { order: "asc" } },
      paymentMilestones: { orderBy: { dueDate: "asc" } },
      deliverables: {
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, status: true, approvedAt: true },
      },
      impactMetrics: { orderBy: { updatedAt: "desc" } },
      frameworks: {
        where: { status: "COMPLETED" },
        include: { framework: { select: { name: true, category: true } } },
      },
    },
  });

  if (!project) notFound();
  if (project.clientId !== session.clientId) redirect("/client/dashboard");

  /* Computed values */
  const statusStyle = PROJECT_STATUS_STYLES[project.status] ?? PROJECT_STATUS_STYLES.PLANNING;
  const generatedDate = formatDateShort(new Date());

  // Phase counts
  const phasesCompleted = project.phases.filter((p) => p.status === "COMPLETED").length;
  const phasesActive = project.phases.filter((p) => p.status === "ACTIVE").length;
  const phasesPending = project.phases.filter((p) => p.status === "PENDING").length;

  // Payment milestones
  const totalPaid = project.paymentMilestones
    .filter((pm) => pm.status === "PAID")
    .reduce((sum, pm) => sum + Number(pm.amount), 0);
  const totalOutstanding = project.paymentMilestones
    .filter((pm) => pm.status !== "PAID")
    .reduce((sum, pm) => sum + Number(pm.amount), 0);

  // Deliverables
  const deliverablesByStatus: Record<string, number> = {};
  for (const d of project.deliverables) {
    deliverablesByStatus[d.status] = (deliverablesByStatus[d.status] || 0) + 1;
  }
  const completedDeliverables = project.deliverables.filter(
    (d) => d.status === "APPROVED" || d.status === "DELIVERED_TO_CLIENT"
  );

  const DELIVERABLE_STATUS_LABELS: Record<string, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    IN_REVIEW: "In Review",
    NEEDS_REVISION: "Revision Requested",
    APPROVED: "Approved",
    DELIVERED_TO_CLIENT: "Delivered",
  };

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFB" }}>
      {/* Top Nav (hidden in print) */}
      <header
        className="bg-white sticky top-0 z-10 print:hidden"
        style={{ borderBottom: "1px solid #e5eaf0" }}
      >
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-cfa.png" alt="CFA" style={{ height: 28, width: "auto" }} />
            <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>
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
            <Link
              href={`/client/projects/${project.id}`}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors truncate max-w-[160px]"
            >
              {project.name}
            </Link>
            <span className="text-gray-300 text-sm">/</span>
            <span className="text-sm font-medium" style={{ color: "#0F2744" }}>
              Report
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
        <div className="flex items-center justify-between print:hidden">
          <Link
            href={`/client/projects/${project.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: "#0F2744" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to project
          </Link>
          <ClientProjectNav projectId={id} current="/report" />
          {/* Print button with inline script */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                document.addEventListener('DOMContentLoaded', function() {
                  var btn = document.getElementById('print-report-btn');
                  if (btn) btn.addEventListener('click', function() { window.print(); });
                });
              `,
            }}
          />
          <button
            id="print-report-btn"
            className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-lg transition-opacity hover:opacity-90 print:hidden cursor-pointer"
            style={{ background: "#0F2744", color: "#fff" }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </button>
        </div>

        {/* Report Header */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <div className="h-1.5" style={{ background: "#D4AF37" }} />
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                  Executive Summary
                </p>
                <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
                  {project.name}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Report generated {generatedDate}
                </p>
              </div>
              <span
                className="text-[11px] px-3 py-1 rounded-full font-semibold shrink-0"
                style={{ background: statusStyle.bg, color: statusStyle.color }}
              >
                {statusStyle.label}
              </span>
            </div>
          </div>
        </div>

        {/* 1. Project Overview */}
        <div
          className="bg-white rounded-2xl p-6"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>
            Project Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Status</p>
              <span
                className="text-[11px] px-2.5 py-0.5 rounded-full font-medium inline-block"
                style={{ background: statusStyle.bg, color: statusStyle.color }}
              >
                {statusStyle.label}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Timeline</p>
              <p className="text-sm font-medium" style={{ color: "#0F2744" }}>
                {formatDateShort(new Date(project.startDate))} to {formatDateShort(new Date(project.endDate))}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Budget</p>
              <p className="text-sm font-bold" style={{ color: "#0F2744" }}>
                {formatCurrency(project.budgetAmount, project.budgetCurrency)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Service</p>
              <p className="text-sm font-medium" style={{ color: "#0F2744" }}>
                {SERVICE_TYPE_LABELS[project.serviceType] ?? project.serviceType}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4" style={{ borderTop: "1px solid #e5eaf0" }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ background: "#0F2744" }}
              >
                {project.engagementManager.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "#0F2744" }}>
                  {project.engagementManager.name}
                </p>
                <p className="text-[11px] text-gray-400">Engagement Manager</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Phase Progress */}
        {project.phases.length > 0 && (
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>
              Phase Progress
            </h2>

            {/* Summary counts */}
            <div className="flex items-center gap-6 mb-5 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#D4AF37" }} />
                <span className="text-gray-500">Completed: <span className="font-semibold" style={{ color: "#0F2744" }}>{phasesCompleted}</span></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#0F2744" }} />
                <span className="text-gray-500">Active: <span className="font-semibold" style={{ color: "#0F2744" }}>{phasesActive}</span></span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#CBD5E1" }} />
                <span className="text-gray-500">Pending: <span className="font-semibold" style={{ color: "#0F2744" }}>{phasesPending}</span></span>
              </span>
            </div>

            {/* Phase bars */}
            <div className="flex gap-1.5">
              {project.phases.map((phase) => {
                const color = PHASE_STATUS_COLOR[phase.status] ?? "#CBD5E1";
                const isActive = phase.status === "ACTIVE";
                return (
                  <div key={phase.id} className="flex-1">
                    <div
                      className="h-3 rounded-full"
                      style={{
                        background: color,
                        boxShadow: isActive ? "0 0 0 2px rgba(15,39,68,0.2)" : "none",
                      }}
                    />
                    <p
                      className="text-[10px] mt-1.5 truncate text-center"
                      style={{
                        color: isActive ? "#0F2744" : "#94A3B8",
                        fontWeight: isActive ? 700 : 400,
                      }}
                    >
                      {phase.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Milestone Summary */}
        {project.paymentMilestones.length > 0 && (
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>
              Milestone Summary
            </h2>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: "#D1FAE5", border: "1px solid #A7F3D0" }}
              >
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Paid</p>
                <p className="text-lg font-bold" style={{ color: "#065F46" }}>
                  {formatCurrency(totalPaid, project.budgetCurrency)}
                </p>
              </div>
              <div
                className="rounded-xl px-4 py-3"
                style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}
              >
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Outstanding</p>
                <p className="text-lg font-bold" style={{ color: "#92400E" }}>
                  {formatCurrency(totalOutstanding, project.budgetCurrency)}
                </p>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2">
              {project.paymentMilestones.map((pm) => {
                const isPaid = pm.status === "PAID";
                return (
                  <div
                    key={pm.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg"
                    style={{ background: "#F8FAFB", border: "1px solid #e5eaf0" }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: isPaid ? "#D4AF37" : "#CBD5E1" }}
                      />
                      <p className="text-xs font-medium truncate" style={{ color: "#0F2744" }}>
                        {pm.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold" style={{ color: isPaid ? "#065F46" : "#0F2744" }}>
                        {formatCurrency(pm.amount, pm.currency)}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: isPaid ? "#D1FAE5" : "#F3F4F6",
                          color: isPaid ? "#065F46" : "#6B7280",
                        }}
                      >
                        {isPaid ? "Paid" : pm.status === "INVOICED" ? "Invoiced" : pm.status === "OVERDUE" ? "Overdue" : "Pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. Deliverables Summary */}
        {project.deliverables.length > 0 && (
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>
              Deliverables Summary
            </h2>

            {/* Status counts */}
            <div className="flex items-center gap-4 flex-wrap mb-5">
              {Object.entries(deliverablesByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="rounded-lg px-3 py-2"
                  style={{ background: "#F8FAFB", border: "1px solid #e5eaf0" }}
                >
                  <p className="text-lg font-bold" style={{ color: "#0F2744" }}>{count}</p>
                  <p className="text-[10px] text-gray-400">{DELIVERABLE_STATUS_LABELS[status] ?? status}</p>
                </div>
              ))}
            </div>

            {/* Completed list */}
            {completedDeliverables.length > 0 && (
              <>
                <p className="text-xs font-medium text-gray-500 mb-2">Completed Deliverables</p>
                <div className="space-y-1.5">
                  {completedDeliverables.map((d) => (
                    <div key={d.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg" style={{ background: "#F0FDF4" }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3.5 7L5.75 9.25L10.5 4.75" stroke="#065F46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-xs font-medium" style={{ color: "#065F46" }}>{d.name}</p>
                      {d.approvedAt && (
                        <p className="text-[10px] text-gray-400 ml-auto">{formatDateShort(new Date(d.approvedAt))}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 5. Impact Metrics (abbreviated) */}
        {project.impactMetrics.length > 0 && (
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                Impact Metrics
              </h2>
              <Link
                href={`/client/projects/${project.id}/impact`}
                className="text-[11px] font-semibold hover:opacity-80 transition-opacity print:hidden"
                style={{ color: "#D4AF37" }}
              >
                View Full Dashboard
              </Link>
            </div>
            <div className="space-y-2">
              {project.impactMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg"
                  style={{ background: "#F8FAFB", border: "1px solid #e5eaf0" }}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "#0F2744" }}>
                      {metric.metricName}
                    </p>
                    {metric.currentValue && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Current: {metric.currentValue}{metric.unit ? ` ${metric.unit}` : ""}
                      </p>
                    )}
                  </div>
                  {metric.quantifiedValue && (
                    <span className="text-sm font-bold shrink-0" style={{ color: "#D4AF37" }}>
                      {formatCurrency(metric.quantifiedValue, metric.currency ?? project.budgetCurrency)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Frameworks Applied */}
        {project.frameworks.length > 0 && (
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>
              Frameworks Applied
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {project.frameworks.map((pf) => (
                <div
                  key={pf.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg"
                  style={{ background: "#F8FAFB", border: "1px solid #e5eaf0" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "#EFF6FF" }}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#1D4ED8" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: "#0F2744" }}>
                      {pf.framework.name}
                    </p>
                    <p className="text-[10px] text-gray-400">{pf.framework.category}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-auto shrink-0">
                    <path d="M3.5 7L5.75 9.25L10.5 4.75" stroke="#065F46" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-[11px] text-gray-400">
            Report generated by Consult for Africa Client Portal
          </p>
        </div>
      </main>
    </div>
  );
}
