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

function formatCurrency(amount: Decimal | number, currency?: string | null): string {
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

function computeDelta(baseline: string | null, current: string | null): { pct: number | null; improved: boolean } {
  if (!baseline || !current) return { pct: null, improved: false };
  const bNum = parseFloat(baseline.replace(/[^0-9.\-]/g, ""));
  const cNum = parseFloat(current.replace(/[^0-9.\-]/g, ""));
  if (isNaN(bNum) || isNaN(cNum) || bNum === 0) return { pct: null, improved: false };
  const pct = Math.round(((cNum - bNum) / Math.abs(bNum)) * 100);
  return { pct, improved: pct > 0 };
}

/* --- Page ------------------------------------------------------------------- */

export default async function ClientImpactDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getClientPortalSession();
  if (!session) redirect("/client/login");

  const { id } = await params;

  const project = await prisma.engagement.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      status: true,
      clientId: true,
      budgetCurrency: true,
      engagementManager: { select: { name: true, email: true } },
    },
  });

  if (!project) notFound();
  if (project.clientId !== session.clientId) redirect("/client/dashboard");

  const metrics = await prisma.engagementImpactMetric.findMany({
    where: { engagementId: id },
    orderBy: { updatedAt: "desc" },
  });

  /* Computed values */
  const totalValue = metrics.reduce(
    (sum, m) => (m.quantifiedValue ? sum + Number(m.quantifiedValue) : sum),
    0
  );

  const defaultCurrency = metrics.find((m) => m.currency)?.currency ?? project.budgetCurrency;

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
            <img src="/logo-cfa.png" alt="C4A" style={{ height: 28, width: "auto" }} />
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
              Impact
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
          href={`/client/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: "#0F2744" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to project
        </Link>

        <ClientProjectNav projectId={id} current="/impact" />

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
            Impact &amp; Results
          </h1>
          <p className="text-sm text-gray-500 mt-1">{project.name}</p>
        </div>

        {/* Total Value Card */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <div className="h-1" style={{ background: "#D4AF37" }} />
          <div className="p-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">
                Total Identified Value
              </p>
              <p className="text-3xl font-bold" style={{ color: "#D4AF37" }}>
                {totalValue > 0 ? formatCurrency(totalValue, defaultCurrency) : "Tracking in progress"}
              </p>
            </div>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: "#FEF9E7" }}
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#D4AF37" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        {metrics.length === 0 ? (
          <div
            className="bg-white rounded-2xl p-12 text-center"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <p className="text-sm text-gray-400">
              Impact metrics are being tracked. They will appear here as results come in.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.map((metric) => {
              const delta = computeDelta(metric.baselineValue, metric.currentValue);
              return (
                <div
                  key={metric.id}
                  className="bg-white rounded-2xl p-6 relative overflow-hidden"
                  style={{ border: "1px solid #e5eaf0" }}
                >
                  {/* Metric Name */}
                  <p
                    className="text-sm font-semibold mb-4"
                    style={{ color: "#0F2744" }}
                  >
                    {metric.metricName}
                  </p>

                  {/* Baseline -> Current */}
                  {(metric.baselineValue || metric.currentValue) && (
                    <div className="flex items-center gap-3 mb-3">
                      {metric.baselineValue && (
                        <div
                          className="rounded-lg px-3 py-2"
                          style={{ background: "#F3F4F6" }}
                        >
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">
                            Baseline
                          </p>
                          <p className="text-sm font-bold" style={{ color: "#6B7280" }}>
                            {metric.baselineValue}
                            {metric.unit && (
                              <span className="text-[10px] font-normal text-gray-400 ml-1">
                                {metric.unit}
                              </span>
                            )}
                          </p>
                        </div>
                      )}

                      {metric.baselineValue && metric.currentValue && (
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M4 10h12M12 6l4 4-4 4"
                            stroke="#0F2744"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}

                      {metric.currentValue && (
                        <div
                          className="rounded-lg px-3 py-2"
                          style={{
                            background: delta.pct !== null && delta.improved ? "#D1FAE5" : "#EFF6FF",
                            border: delta.pct !== null && delta.improved
                              ? "1px solid #A7F3D0"
                              : "1px solid #BFDBFE",
                          }}
                        >
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">
                            Current
                          </p>
                          <p
                            className="text-sm font-bold"
                            style={{
                              color: delta.pct !== null && delta.improved ? "#065F46" : "#0F2744",
                            }}
                          >
                            {metric.currentValue}
                            {metric.unit && (
                              <span className="text-[10px] font-normal text-gray-400 ml-1">
                                {metric.unit}
                              </span>
                            )}
                          </p>
                        </div>
                      )}

                      {/* Delta badge */}
                      {delta.pct !== null && (
                        <span
                          className="text-xs font-bold px-2 py-1 rounded-full"
                          style={{
                            background: delta.improved ? "#D1FAE5" : "#FEE2E2",
                            color: delta.improved ? "#065F46" : "#991B1B",
                          }}
                        >
                          {delta.improved ? "+" : ""}
                          {delta.pct}%
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quantified Value */}
                  {metric.quantifiedValue && (
                    <div className="mb-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">
                        Quantified Value
                      </p>
                      <p className="text-lg font-bold" style={{ color: "#D4AF37" }}>
                        {formatCurrency(metric.quantifiedValue, metric.currency ?? defaultCurrency)}
                      </p>
                    </div>
                  )}

                  {/* Client Quote */}
                  {metric.clientQuote && (
                    <div
                      className="rounded-xl px-4 py-3 mt-3"
                      style={{ background: "#F8FAFB", borderLeft: "3px solid #D4AF37" }}
                    >
                      <p className="text-xs text-gray-600 italic leading-relaxed">
                        &ldquo;{metric.clientQuote}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Value Timeline */}
        {metrics.length > 0 && (
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#0F2744" }}>
              Measurement Timeline
            </h2>
            <div className="space-y-0">
              {metrics.map((metric, idx) => {
                const isLast = idx === metrics.length - 1;
                return (
                  <div key={metric.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                        style={{ background: "#D4AF37" }}
                      />
                      {!isLast && (
                        <div
                          className="w-0.5 flex-1 my-1"
                          style={{ background: "#e5eaf0", minHeight: "20px" }}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium" style={{ color: "#0F2744" }}>
                        {metric.metricName}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Last updated {formatDateShort(new Date(metric.updatedAt))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        <div
          className="bg-white rounded-2xl p-6 text-center"
          style={{ border: "1px solid #e5eaf0" }}
        >
          <p className="text-sm text-gray-500 mb-3">
            Questions about these results? Contact your engagement manager.
          </p>
          <a
            href={`mailto:${project.engagementManager?.email ?? "partnerships@consultforafrica.com"}`}
            className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-2.5 rounded-lg transition-opacity hover:opacity-90"
            style={{ background: "#0F2744", color: "#fff" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
              <path d="M1.5 4.5L7 8L12.5 4.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Contact {project.engagementManager?.name ?? "your engagement manager"}
          </a>
        </div>
      </main>
    </div>
  );
}
