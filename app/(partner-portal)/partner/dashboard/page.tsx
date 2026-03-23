import { prisma } from "@/lib/prisma";
import { getPartnerPortalSession } from "@/lib/partnerPortalAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import PartnerPortalLogoutButton from "@/components/partner-portal/LogoutButton";

const REQUEST_STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT:          { bg: "#F3F4F6", color: "#6B7280", label: "Draft" },
  SUBMITTED:      { bg: "#EFF6FF", color: "#1D4ED8", label: "Submitted" },
  MATCHING:       { bg: "#FEF9E7", color: "#92400E", label: "Matching" },
  SHORTLIST_SENT: { bg: "#FEF3C7", color: "#92400E", label: "Shortlist Sent" },
  CONFIRMED:      { bg: "#D1FAE5", color: "#065F46", label: "Confirmed" },
  ACTIVE:         { bg: "#D1FAE5", color: "#065F46", label: "Active" },
  COMPLETED:      { bg: "#F0FDF4", color: "#15803D", label: "Completed" },
  CANCELLED:      { bg: "#FEE2E2", color: "#991B1B", label: "Cancelled" },
};

const INVOICE_STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT:     { bg: "#F3F4F6", color: "#6B7280", label: "Draft" },
  SENT:      { bg: "#EFF6FF", color: "#1D4ED8", label: "Sent" },
  PAID:      { bg: "#D1FAE5", color: "#065F46", label: "Paid" },
  OVERDUE:   { bg: "#FEE2E2", color: "#991B1B", label: "Overdue" },
  CANCELLED: { bg: "#F3F4F6", color: "#9CA3AF", label: "Cancelled" },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatCurrency(amount: number | string, currency: string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function PartnerDashboardPage() {
  const session = await getPartnerPortalSession();
  if (!session) redirect("/partner/login");

  const partner = await prisma.partnerFirm.findUnique({
    where: { id: session.partnerId },
    select: { name: true },
  });

  const activeStatuses = ["SUBMITTED", "MATCHING", "SHORTLIST_SENT", "CONFIRMED", "ACTIVE"];

  const staffingRequests = await prisma.partnerStaffingRequest.findMany({
    where: {
      partnerId: session.partnerId,
      status: { in: activeStatuses as never[] },
    },
    include: {
      deployments: {
        select: {
          id: true,
          status: true,
          role: true,
          consultantId: true,
          startDate: true,
          endDate: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeDeployments = await prisma.partnerDeployment.findMany({
    where: {
      request: { partnerId: session.partnerId },
      status: "ACTIVE",
    },
    include: {
      request: {
        select: { projectName: true, requestCode: true },
      },
    },
    orderBy: { startDate: "desc" },
  });

  const recentInvoices = await prisma.partnerInvoice.findMany({
    where: { partnerId: session.partnerId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const pendingInvoices = recentInvoices.filter(
    (inv) => inv.status === "SENT" || inv.status === "OVERDUE"
  );

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
            <img src="/logo-cfa.png" alt="CFA" style={{ height: 28, width: "auto" }} />
            <span className="text-sm font-semibold" style={{ color: "#0F2744" }}>
              Partner Portal
            </span>
            {partner && (
              <>
                <span className="text-gray-300 text-sm">/</span>
                <span className="text-sm text-gray-600">{partner.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.name}</span>
            <PartnerPortalLogoutButton />
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
            Welcome to your {partner?.name || "partner"} dashboard. Here is an overview of your staffing with Consult For Africa.
          </p>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Active Requests */}
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Active Requests
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>
              {staffingRequests.length}
            </p>
          </div>

          {/* Deployed Consultants */}
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Deployed Consultants
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>
              {activeDeployments.length}
            </p>
          </div>

          {/* Pending Invoices */}
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Pending Invoices
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>
              {pendingInvoices.length}
            </p>
          </div>
        </div>

        {/* New Staffing Request CTA */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#0F2744" }}>
              Active Requests
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {staffingRequests.length} active staffing request{staffingRequests.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/partner/requests/new"
            className="text-xs font-semibold px-4 py-2.5 rounded-lg transition-opacity hover:opacity-90"
            style={{ background: "#D4AF37", color: "#0F2744" }}
          >
            New Staffing Request
          </Link>
        </div>

        {/* Active Requests List */}
        {staffingRequests.length === 0 ? (
          <div
            className="rounded-2xl bg-white p-12 text-center mb-8"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <p className="text-gray-400 text-sm">
              No active staffing requests. Submit one to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 mb-8">
            {staffingRequests.map((req) => {
              const statusStyle =
                REQUEST_STATUS_STYLES[req.status] ?? REQUEST_STATUS_STYLES.SUBMITTED;
              return (
                <Link
                  key={req.id}
                  href={`/partner/requests/${req.id}`}
                  className="bg-white rounded-2xl p-6 block transition-shadow hover:shadow-md"
                  style={{ border: "1px solid #e5eaf0" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3
                          className="text-base font-semibold"
                          style={{ color: "#0F2744" }}
                        >
                          {req.projectName}
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
                      <p className="text-xs text-gray-400 mt-1">
                        {req.requestCode}
                      </p>
                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        <span className="text-xs text-gray-500">
                          {req.rolesNeeded} consultant{req.rolesNeeded !== 1 ? "s" : ""} needed
                        </span>
                        {req.skillsRequired.length > 0 && (
                          <span className="text-xs text-gray-500">
                            Skills: {req.skillsRequired.slice(0, 3).join(", ")}
                            {req.skillsRequired.length > 3 ? ` +${req.skillsRequired.length - 3}` : ""}
                          </span>
                        )}
                        {req.startDate && (
                          <span className="text-xs text-gray-500">
                            Start: {formatDate(req.startDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-300 text-lg shrink-0">&rarr;</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Active Deployments */}
        <div className="mb-5">
          <h2 className="text-lg font-semibold" style={{ color: "#0F2744" }}>
            Active Deployments
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {activeDeployments.length} consultant{activeDeployments.length !== 1 ? "s" : ""} currently deployed
          </p>
        </div>

        {activeDeployments.length === 0 ? (
          <div
            className="rounded-2xl bg-white p-12 text-center mb-8"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <p className="text-gray-400 text-sm">No active deployments yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 mb-8">
            {activeDeployments.map((dep) => (
              <div
                key={dep.id}
                className="bg-white rounded-2xl p-6"
                style={{ border: "1px solid #e5eaf0" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: "#0F2744" }}
                    >
                      {dep.role}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {dep.request.projectName} ({dep.request.requestCode})
                    </p>
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      {dep.startDate && (
                        <span className="text-xs text-gray-500">
                          Started: {formatDate(dep.startDate)}
                        </span>
                      )}
                      {dep.endDate && (
                        <span className="text-xs text-gray-500">
                          Ends: {formatDate(dep.endDate)}
                        </span>
                      )}
                      {dep.hoursPerWeek && (
                        <span className="text-xs text-gray-500">
                          {dep.hoursPerWeek}h/week
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                    style={{ background: "#D1FAE5", color: "#065F46" }}
                  >
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Invoices */}
        {recentInvoices.length > 0 && (
          <>
            <div className="mb-5">
              <h2 className="text-lg font-semibold" style={{ color: "#0F2744" }}>
                Recent Invoices
              </h2>
            </div>
            <div
              className="rounded-2xl bg-white overflow-hidden mb-8"
              style={{ border: "1px solid #e5eaf0" }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e5eaf0", background: "#FAFBFC" }}>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Invoice</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Period</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Amount</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((inv) => {
                      const invStyle = INVOICE_STATUS_STYLES[inv.status] ?? INVOICE_STATUS_STYLES.DRAFT;
                      return (
                        <tr key={inv.id} style={{ borderBottom: "1px solid #e5eaf0" }}>
                          <td className="px-6 py-4 font-medium" style={{ color: "#0F2744" }}>{inv.invoiceNumber}</td>
                          <td className="px-6 py-4 text-gray-500">{inv.period || "-"}</td>
                          <td className="px-6 py-4 font-medium" style={{ color: "#0F2744" }}>
                            {formatCurrency(inv.total.toString(), inv.currency)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                              style={{ background: invStyle.bg, color: invStyle.color }}
                            >
                              {invStyle.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {inv.dueDate ? formatDate(inv.dueDate) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
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
