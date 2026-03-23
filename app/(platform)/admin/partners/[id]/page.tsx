import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import PartnerContactsSection from "@/components/platform/admin/PartnerContactsSection";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Globe,
  MapPin,
  FileText,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import MatchInsightsWidget from "@/components/platform/admin/MatchInsightsWidget";
import RequestStatusActions from "@/components/platform/admin/RequestStatusActions";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PROSPECT: { bg: "#EFF6FF", color: "#1D4ED8" },
  ONBOARDING: { bg: "#FEF3C7", color: "#92400E" },
  ACTIVE: { bg: "#D1FAE5", color: "#065F46" },
  INACTIVE: { bg: "#F3F4F6", color: "#6B7280" },
};

const REQUEST_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "#F3F4F6", color: "#6B7280" },
  SUBMITTED: { bg: "#EFF6FF", color: "#1D4ED8" },
  MATCHING: { bg: "#FEF3C7", color: "#92400E" },
  SHORTLIST_SENT: { bg: "#FEF3C7", color: "#92400E" },
  CONFIRMED: { bg: "#DBEAFE", color: "#1E40AF" },
  ACTIVE: { bg: "#D1FAE5", color: "#065F46" },
  COMPLETED: { bg: "#F0FDF4", color: "#15803D" },
  CANCELLED: { bg: "#FEE2E2", color: "#991B1B" },
};

const DEPLOYMENT_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PROPOSED: { bg: "#EFF6FF", color: "#1D4ED8" },
  ACCEPTED: { bg: "#DBEAFE", color: "#1E40AF" },
  ACTIVE: { bg: "#D1FAE5", color: "#065F46" },
  COMPLETED: { bg: "#F0FDF4", color: "#15803D" },
  RECALLED: { bg: "#FEF3C7", color: "#92400E" },
  DECLINED: { bg: "#FEE2E2", color: "#991B1B" },
};

const INVOICE_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "#F3F4F6", color: "#6B7280" },
  SENT: { bg: "#EFF6FF", color: "#1D4ED8" },
  PAID: { bg: "#D1FAE5", color: "#065F46" },
  OVERDUE: { bg: "#FEE2E2", color: "#991B1B" },
  CANCELLED: { bg: "#F3F4F6", color: "#9CA3AF" },
};

const TYPE_LABELS: Record<string, string> = {
  CONSULTANCY: "Consultancy",
  DEVELOPMENT_AGENCY: "Development Agency",
  NGO: "NGO",
  MULTILATERAL: "Multilateral",
  OTHER: "Other",
};

export default async function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");

  const isAllowed = ["PARTNER", "ADMIN", "DIRECTOR"].includes(session.user.role);
  if (!isAllowed) redirect("/dashboard");

  const { id } = await params;

  const partner = await prisma.partnerFirm.findUnique({
    where: { id },
    include: {
      contacts: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
      staffingRequests: {
        include: {
          deployments: true,
          _count: { select: { deployments: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      invoices: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!partner) notFound();

  const activeRequests = partner.staffingRequests.filter((r) =>
    ["SUBMITTED", "MATCHING", "SHORTLIST_SENT", "CONFIRMED", "ACTIVE"].includes(r.status)
  );
  const allDeployments = partner.staffingRequests.flatMap((r) => r.deployments);
  const activeDeployments = allDeployments.filter((d) =>
    ["PROPOSED", "ACCEPTED", "ACTIVE"].includes(d.status)
  );

  const totalInvoiced = partner.invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + Number(i.total), 0);
  const outstanding = partner.invoices
    .filter((i) => ["SENT", "OVERDUE"].includes(i.status))
    .reduce((s, i) => s + Number(i.total), 0);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title={partner.name}
        subtitle={TYPE_LABELS[partner.type] ?? partner.type}
        backHref="/admin/partners"
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              { label: "Active Requests", value: activeRequests.length, color: "#F59E0B" },
              { label: "Active Deployments", value: activeDeployments.length, color: "#8B5CF6" },
              { label: "Total Collected", value: formatCurrency(totalInvoiced, partner.currency as "NGN" | "USD"), color: "#10B981" },
              { label: "Outstanding", value: formatCurrency(outstanding, partner.currency as "NGN" | "USD"), color: outstanding > 0 ? "#F59E0B" : "#10B981" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-4 bg-white" style={{ border: "1px solid #e5eaf0" }}>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                <div className="h-1 rounded-full mt-2 w-8" style={{ background: s.color }} />
              </div>
            ))}
          </div>

          {/* Partner info card */}
          <div className="rounded-xl p-5 bg-white space-y-3" style={{ border: "1px solid #e5eaf0" }}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-semibold text-gray-900">Partner Information</h2>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={STATUS_COLORS[partner.status] ?? STATUS_COLORS.INACTIVE}
              >
                {partner.status}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {partner.website && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe size={13} className="shrink-0" style={{ color: "#94A3B8" }} />
                  <a
                    href={partner.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-[#0F2744] truncate"
                  >
                    {partner.website}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={13} className="shrink-0" style={{ color: "#94A3B8" }} />
                {partner.country}{partner.city ? `, ${partner.city}` : ""}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600 pt-1" style={{ borderTop: "1px solid #F3F4F6" }}>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Payment Terms</p>
                <p>{partner.paymentTerms} days</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Default Markup</p>
                <p>{partner.defaultMarkupPct ? `${Number(partner.defaultMarkupPct)}%` : "Not set"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Currency</p>
                <p>{partner.currency}</p>
              </div>
            </div>
            {partner.notes && (
              <div className="pt-1" style={{ borderTop: "1px solid #F3F4F6" }}>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Notes</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{partner.notes}</p>
              </div>
            )}
          </div>

          {/* Contacts */}
          <PartnerContactsSection
            partnerId={partner.id}
            contacts={partner.contacts.map((c) => ({
              id: c.id,
              name: c.name,
              email: c.email,
              title: c.title,
              phone: c.phone,
              isPrimary: c.isPrimary,
              isPortalEnabled: c.isPortalEnabled,
              lastLoginAt: c.lastLoginAt?.toISOString() ?? null,
            }))}
          />

          {/* Active Staffing Requests */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Briefcase size={15} />
              Staffing Requests ({partner.staffingRequests.length})
            </h2>
            {partner.staffingRequests.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No staffing requests</p>
            ) : (
              <div className="space-y-2">
                {partner.staffingRequests.map((r) => {
                  const reqStatusStyle = REQUEST_STATUS_COLORS[r.status] ?? REQUEST_STATUS_COLORS.DRAFT;
                  return (
                    <div
                      key={r.id}
                      className="rounded-xl px-4 py-3 bg-white"
                      style={{ border: "1px solid #e5eaf0" }}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900">{r.projectName}</p>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={reqStatusStyle}
                          >
                            {r.status.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-gray-400">{r.requestCode}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{r.rolesNeeded} role{r.rolesNeeded !== 1 ? "s" : ""} needed</span>
                          <span>{r._count.deployments} deployment{r._count.deployments !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.projectDescription}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-gray-400">
                        {r.seniority && <span>Seniority: {r.seniority}</span>}
                        {r.hoursPerWeek && <span>{r.hoursPerWeek}h/week</span>}
                        {r.durationWeeks && <span>{r.durationWeeks} weeks</span>}
                        {r.clientBudgetPerDay && (
                          <span>Budget: {formatCurrency(Number(r.clientBudgetPerDay), r.budgetCurrency as "NGN" | "USD")}/day</span>
                        )}
                        <span>Submitted {r.submittedAt ? formatDate(new Date(r.submittedAt)) : "N/A"}</span>
                      </div>

                      {/* Deployments under this request */}
                      {r.deployments.length > 0 && (
                        <div className="mt-2 pt-2 space-y-1" style={{ borderTop: "1px solid #F3F4F6" }}>
                          {r.deployments.map((d) => {
                            const depStatusStyle = DEPLOYMENT_STATUS_COLORS[d.status] ?? DEPLOYMENT_STATUS_COLORS.PROPOSED;
                            return (
                              <div key={d.id} className="flex items-center justify-between text-xs text-gray-600 py-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{d.role}</span>
                                  <span
                                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                                    style={depStatusStyle}
                                  >
                                    {d.status}
                                  </span>
                                </div>
                                <span className="text-gray-400">
                                  {formatCurrency(Number(d.billingRatePerDay), d.rateCurrency as "NGN" | "USD")}/day
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Status Actions */}
                      <RequestStatusActions
                        requestId={r.id}
                        status={r.status}
                        allDeploymentsResponded={
                          r.deployments.length > 0 &&
                          r.deployments.every((d) => ["ACCEPTED", "DECLINED"].includes(d.status))
                        }
                      />

                      {/* Match Insights Widget */}
                      <MatchInsightsWidget requestId={r.id} requestStatus={r.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Invoices */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText size={15} />
              Invoices ({partner.invoices.length})
            </h2>
            {partner.invoices.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No invoices yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5eaf0" }}>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Invoice #</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Period</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Status</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Total</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partner.invoices.map((inv) => {
                      const invStatusStyle = INVOICE_STATUS_COLORS[inv.status] ?? INVOICE_STATUS_COLORS.DRAFT;
                      return (
                        <tr key={inv.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                          <td className="py-2.5 px-3 font-medium text-gray-900">{inv.invoiceNumber}</td>
                          <td className="py-2.5 px-3 text-gray-500">{inv.period ?? "N/A"}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                              style={invStatusStyle}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-gray-900">
                            {formatCurrency(Number(inv.total), inv.currency as "NGN" | "USD")}
                          </td>
                          <td className="py-2.5 px-3 text-gray-500">
                            {inv.dueDate ? formatDate(new Date(inv.dueDate)) : "N/A"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
