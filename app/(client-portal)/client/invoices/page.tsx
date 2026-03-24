import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientPortalLogoutButton from "@/components/client-portal/LogoutButton";
import { Decimal } from "@prisma/client/runtime/library";
import {
  FileText,
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Eye,
} from "lucide-react";

/* ── Style maps ───────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  PENDING_APPROVAL: { bg: "#FEF3C7", color: "#92400E", label: "Pending Approval" },
  SENT:             { bg: "#EFF6FF", color: "#1D4ED8", label: "Sent" },
  VIEWED:           { bg: "#E0E7FF", color: "#3730A3", label: "Viewed" },
  PARTIALLY_PAID:   { bg: "#FEF9E7", color: "#92400E", label: "Partially Paid" },
  PAID:             { bg: "#D1FAE5", color: "#065F46", label: "Paid" },
  OVERDUE:          { bg: "#FEE2E2", color: "#991B1B", label: "Overdue" },
  DISPUTED:         { bg: "#FEE2E2", color: "#991B1B", label: "Disputed" },
  WRITTEN_OFF:      { bg: "#F3F4F6", color: "#6B7280", label: "Written Off" },
  CANCELLED:        { bg: "#F3F4F6", color: "#9CA3AF", label: "Cancelled" },
};

const TYPE_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  STANDARD:         { bg: "#F3F4F6", color: "#374151", label: "Standard" },
  PROFORMA:         { bg: "#EDE9FE", color: "#6D28D9", label: "Proforma" },
  CREDIT_NOTE:      { bg: "#FCE7F3", color: "#BE185D", label: "Credit Note" },
  DEBIT_NOTE:       { bg: "#FEF3C7", color: "#92400E", label: "Debit Note" },
  MOBILIZATION:     { bg: "#DBEAFE", color: "#1D4ED8", label: "Mobilization" },
  MILESTONE:        { bg: "#D1FAE5", color: "#065F46", label: "Milestone" },
  RETAINER:         { bg: "#FEF9E7", color: "#92400E", label: "Retainer" },
  FINAL_SETTLEMENT: { bg: "#F0FDF4", color: "#15803D", label: "Final Settlement" },
};

/* ── Helpers ──────────────────────────────────────────────────────────── */

function formatDate(date: Date | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
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

function isPayable(status: string): boolean {
  return ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"].includes(status);
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default async function ClientInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getClientPortalSession();
  if (!session) redirect("/client/login");

  const { status: statusFilter } = await searchParams;

  const where: Record<string, unknown> = {
    clientId: session.clientId,
    status: { not: "DRAFT" },
  };

  if (statusFilter && statusFilter !== "ALL") {
    where.status = statusFilter;
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      engagement: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const client = await prisma.client.findUnique({
    where: { id: session.clientId },
    select: { name: true },
  });

  // Summary calculations (across all invoices, not filtered)
  const allInvoices = await prisma.invoice.findMany({
    where: { clientId: session.clientId, status: { not: "DRAFT" } },
    select: { status: true, balanceDue: true, dueDate: true, invoiceNumber: true, currency: true },
  });

  const outstandingInvoices = allInvoices.filter((inv) =>
    ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"].includes(inv.status)
  );
  const totalOutstanding = outstandingInvoices.reduce(
    (sum, inv) => sum + Number(inv.balanceDue),
    0
  );

  const nextDue = outstandingInvoices
    .filter((inv) => inv.dueDate)
    .sort(
      (a, b) =>
        new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    )[0];

  const defaultCurrency = allInvoices[0]?.currency ?? "NGN";

  const statusOptions = [
    { value: "ALL", label: "All Invoices" },
    { value: "SENT", label: "Sent" },
    { value: "VIEWED", label: "Viewed" },
    { value: "PARTIALLY_PAID", label: "Partially Paid" },
    { value: "PAID", label: "Paid" },
    { value: "OVERDUE", label: "Overdue" },
  ];

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
        {/* Back to Dashboard */}
        <Link
          href="/client/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80 mb-6"
          style={{ color: "#0F2744" }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#0F2744" }}>
            Invoices
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage invoices for your engagements with Consult For Africa.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Total Outstanding */}
          <div
            className="bg-white rounded-2xl p-5"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "#FEF3C7" }}
              >
                <AlertCircle size={18} color="#92400E" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Total Outstanding
              </span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "#0F2744" }}>
              {formatCurrency(totalOutstanding, defaultCurrency)}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {outstandingInvoices.length} unpaid invoice{outstandingInvoices.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Next Due */}
          <div
            className="bg-white rounded-2xl p-5"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "#EFF6FF" }}
              >
                <Clock size={18} color="#1D4ED8" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Next Due
              </span>
            </div>
            {nextDue ? (
              <>
                <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                  {formatCurrency(Number(nextDue.balanceDue), nextDue.currency)}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {nextDue.invoiceNumber} &middot; Due {formatDate(nextDue.dueDate)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">No outstanding invoices</p>
            )}
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {statusOptions.map((opt) => {
            const isActive =
              (!statusFilter && opt.value === "ALL") ||
              statusFilter === opt.value;
            return (
              <Link
                key={opt.value}
                href={
                  opt.value === "ALL"
                    ? "/client/invoices"
                    : `/client/invoices?status=${opt.value}`
                }
                className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
                style={{
                  background: isActive ? "#0F2744" : "#fff",
                  color: isActive ? "#fff" : "#6B7280",
                  border: isActive ? "none" : "1px solid #e5eaf0",
                }}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>

        {/* Invoice Table */}
        {invoices.length === 0 ? (
          <div
            className="rounded-2xl bg-white p-12 text-center"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <FileText size={40} color="#CBD5E1" className="mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No invoices found.</p>
          </div>
        ) : (
          <div
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid #e5eaf0" }}
          >
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#FAFBFC", borderBottom: "1px solid #e5eaf0" }}>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Invoice
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Type
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Engagement
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Issued
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Due
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, idx) => {
                    const ss = STATUS_STYLES[inv.status] ?? STATUS_STYLES.SENT;
                    const ts = TYPE_STYLES[inv.invoiceType] ?? TYPE_STYLES.STANDARD;
                    return (
                      <tr
                        key={inv.id}
                        style={{
                          borderBottom:
                            idx < invoices.length - 1
                              ? "1px solid #f0f2f5"
                              : "none",
                        }}
                      >
                        <td className="px-5 py-4">
                          <span className="font-semibold" style={{ color: "#0F2744" }}>
                            {inv.invoiceNumber}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: ts.bg, color: ts.color }}
                          >
                            {ts.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-600 max-w-[180px] truncate">
                          {inv.engagement?.name ?? "-"}
                        </td>
                        <td className="px-5 py-4 text-gray-500">
                          {formatDate(inv.issuedDate)}
                        </td>
                        <td className="px-5 py-4 text-gray-500">
                          {formatDate(inv.dueDate)}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold" style={{ color: "#0F2744" }}>
                          {formatCurrency(inv.total, inv.currency)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                            style={{ background: ss.bg, color: ss.color }}
                          >
                            {ss.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/client/invoices/${inv.id}`}
                              className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                              style={{ color: "#0F2744", background: "#F1F5F9" }}
                            >
                              <Eye size={13} />
                              View
                            </Link>
                            {isPayable(inv.status) && (
                              <Link
                                href={`/client/invoices/${inv.id}`}
                                className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-colors hover:opacity-90"
                                style={{ background: "#D4AF37" }}
                              >
                                <CreditCard size={13} />
                                Pay Now
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y" style={{ borderColor: "#f0f2f5" }}>
              {invoices.map((inv) => {
                const ss = STATUS_STYLES[inv.status] ?? STATUS_STYLES.SENT;
                const ts = TYPE_STYLES[inv.invoiceType] ?? TYPE_STYLES.STANDARD;
                return (
                  <div key={inv.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "#0F2744" }}>
                          {inv.invoiceNumber}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {inv.engagement?.name ?? "-"}
                        </p>
                      </div>
                      <span
                        className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                        style={{ background: ss.bg, color: ss.color }}
                      >
                        {ss.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span
                        className="px-2 py-0.5 rounded-full font-medium"
                        style={{ background: ts.bg, color: ts.color, fontSize: 10 }}
                      >
                        {ts.label}
                      </span>
                      <span>Issued {formatDate(inv.issuedDate)}</span>
                      <span>Due {formatDate(inv.dueDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-lg" style={{ color: "#0F2744" }}>
                        {formatCurrency(inv.total, inv.currency)}
                      </p>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/client/invoices/${inv.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg"
                          style={{ color: "#0F2744", background: "#F1F5F9" }}
                        >
                          <Eye size={13} />
                          View
                        </Link>
                        {isPayable(inv.status) && (
                          <Link
                            href={`/client/invoices/${inv.id}`}
                            className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                            style={{ background: "#D4AF37" }}
                          >
                            <CreditCard size={13} />
                            Pay
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
