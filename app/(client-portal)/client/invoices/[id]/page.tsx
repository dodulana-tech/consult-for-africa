import { prisma } from "@/lib/prisma";
import { getClientPortalSession } from "@/lib/clientPortalAuth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ClientPortalLogoutButton from "@/components/client-portal/LogoutButton";
import InvoicePayButton from "@/components/client-portal/InvoicePayButton";
import InvoiceViewTracker from "@/components/client-portal/InvoiceViewTracker";
import { Decimal } from "@prisma/client/runtime/library";
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  Clock,
  FileText,
  Calendar,
  Hash,
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function isPayable(status: string): boolean {
  return ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"].includes(status);
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default async function ClientInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getClientPortalSession();
  if (!session) redirect("/client/login");

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      lineItemRecords: { orderBy: { sortOrder: "asc" } },
      payments: {
        where: { status: "CONFIRMED" },
        orderBy: { paymentDate: "desc" },
        select: {
          id: true,
          amount: true,
          currency: true,
          paymentDate: true,
          paymentMethod: true,
          reference: true,
          receiptUrl: true,
        },
      },
      engagement: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
    },
  });

  if (!invoice) notFound();
  if (invoice.clientId !== session.clientId) redirect("/client/dashboard");

  const ss = STATUS_STYLES[invoice.status] ?? STATUS_STYLES.SENT;
  const hasLineItems = invoice.lineItemRecords.length > 0;
  const payable = isPayable(invoice.status);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F8FAFB" }}>
      {/* View tracker (marks as VIEWED on mount) */}
      <InvoiceViewTracker invoiceId={invoice.id} />

      {/* Top Nav */}
      <header
        className="bg-white sticky top-0 z-10"
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
              href="/client/invoices"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Invoices
            </Link>
            <span className="text-gray-300 text-sm">/</span>
            <span
              className="text-sm font-medium truncate max-w-[200px]"
              style={{ color: "#0F2744" }}
            >
              {invoice.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.name}</span>
            <ClientPortalLogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Back link */}
        <Link
          href="/client/invoices"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80 mb-6"
          style={{ color: "#0F2744" }}
        >
          <ArrowLeft size={16} />
          Back to Invoices
        </Link>

        {/* Invoice Card */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: "1px solid #e5eaf0" }}
        >
          {/* Header */}
          <div
            className="p-6 md:p-8"
            style={{ borderBottom: "1px solid #e5eaf0" }}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              {/* CFA Branding */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-cfa.png" alt="CFA" style={{ height: 36, width: "auto" }} />
                  <div>
                    <p className="text-lg font-bold" style={{ color: "#0F2744" }}>
                      Consult For Africa
                    </p>
                    <p className="text-xs text-gray-500">
                      Healthcare Consulting
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>Lagos, Nigeria</p>
                  <p>hello@consultforafrica.com</p>
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="text-left md:text-right space-y-2">
                <div className="flex items-center gap-3 md:justify-end">
                  <h2 className="text-xl font-bold" style={{ color: "#0F2744" }}>
                    INVOICE
                  </h2>
                  <span
                    className="text-xs px-3 py-1 rounded-full font-semibold"
                    style={{ background: ss.bg, color: ss.color }}
                  >
                    {ss.label}
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p className="flex items-center gap-1.5 md:justify-end">
                    <Hash size={12} />
                    {invoice.invoiceNumber}
                  </p>
                  <p className="flex items-center gap-1.5 md:justify-end">
                    <Calendar size={12} />
                    Issued: {formatDate(invoice.issuedDate)}
                  </p>
                  <p className="flex items-center gap-1.5 md:justify-end">
                    <Clock size={12} />
                    Due: {formatDate(invoice.dueDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="mt-6 pt-5" style={{ borderTop: "1px solid #f0f2f5" }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-medium text-gray-400 mb-1">
                    Bill To
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                    {invoice.client.name}
                  </p>
                </div>
                {invoice.engagement && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide font-medium text-gray-400 mb-1">
                      Engagement
                    </p>
                    <p className="text-sm font-medium" style={{ color: "#0F2744" }}>
                      {invoice.engagement.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="p-6 md:p-8">
            {hasLineItems ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      style={{
                        borderBottom: "2px solid #e5eaf0",
                      }}
                    >
                      <th className="text-left pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Description
                      </th>
                      <th className="text-right pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-20">
                        Qty
                      </th>
                      <th className="text-right pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-32">
                        Unit Price
                      </th>
                      <th className="text-right pb-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-32">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lineItemRecords.map((li, idx) => (
                      <tr
                        key={li.id}
                        style={{
                          borderBottom:
                            idx < invoice.lineItemRecords.length - 1
                              ? "1px solid #f0f2f5"
                              : "none",
                        }}
                      >
                        <td className="py-3 pr-4">
                          <p className="font-medium" style={{ color: "#0F2744" }}>
                            {li.description}
                          </p>
                          {li.category && (
                            <p className="text-[11px] text-gray-400 mt-0.5 capitalize">
                              {li.category.replace(/_/g, " ")}
                            </p>
                          )}
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {Number(li.quantity)}
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {formatCurrency(li.unitPrice, invoice.currency)}
                        </td>
                        <td className="py-3 text-right font-medium" style={{ color: "#0F2744" }}>
                          {formatCurrency(li.amount, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText size={28} color="#CBD5E1" className="mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  No line item details available.
                </p>
              </div>
            )}

            {/* Totals */}
            <div
              className="mt-6 pt-4 space-y-2"
              style={{ borderTop: "2px solid #e5eaf0" }}
            >
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium" style={{ color: "#0F2744" }}>
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              {Number(invoice.tax) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">VAT / Tax</span>
                  <span className="text-gray-700">
                    +{formatCurrency(invoice.tax, invoice.currency)}
                  </span>
                </div>
              )}
              {Number(invoice.whtAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Withholding Tax (WHT)</span>
                  <span className="text-red-600">
                    -{formatCurrency(invoice.whtAmount, invoice.currency)}
                  </span>
                </div>
              )}
              {Number(invoice.discountAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-green-600">
                    -{formatCurrency(invoice.discountAmount, invoice.currency)}
                  </span>
                </div>
              )}
              <div
                className="flex justify-between text-base pt-2"
                style={{ borderTop: "1px solid #e5eaf0" }}
              >
                <span className="font-semibold" style={{ color: "#0F2744" }}>
                  Total
                </span>
                <span className="font-bold text-lg" style={{ color: "#0F2744" }}>
                  {formatCurrency(invoice.total, invoice.currency)}
                </span>
              </div>
              {Number(invoice.paidAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Amount Paid</span>
                  <span className="text-green-700 font-medium">
                    -{formatCurrency(invoice.paidAmount, invoice.currency)}
                  </span>
                </div>
              )}
              {Number(invoice.balanceDue) > 0 && (
                <div
                  className="flex justify-between text-base pt-2"
                  style={{ borderTop: "1px solid #e5eaf0" }}
                >
                  <span className="font-semibold" style={{ color: "#991B1B" }}>
                    Balance Due
                  </span>
                  <span className="font-bold text-lg" style={{ color: "#991B1B" }}>
                    {formatCurrency(invoice.balanceDue, invoice.currency)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Client Notes */}
          {invoice.clientNotes && (
            <div
              className="px-6 md:px-8 pb-6"
            >
              <div
                className="rounded-xl p-4"
                style={{ background: "#FAFBFC", border: "1px solid #e5eaf0" }}
              >
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Notes
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {invoice.clientNotes}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div
            className="px-6 md:px-8 py-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            style={{
              borderTop: "1px solid #e5eaf0",
              background: "#FAFBFC",
            }}
          >
            {payable && (
              <InvoicePayButton
                invoiceId={invoice.id}
                invoiceNumber={invoice.invoiceNumber}
                amount={Number(invoice.balanceDue)}
                currency={invoice.currency}
                email={session.email}
              />
            )}
            <Link
              href={`/api/invoices/${invoice.id}/pdf`}
              className="inline-flex items-center justify-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors hover:opacity-80"
              style={{
                color: "#0F2744",
                background: "#fff",
                border: "1px solid #e5eaf0",
              }}
              target="_blank"
            >
              <Download size={16} />
              Download PDF
            </Link>
          </div>
        </div>

        {/* Payment History */}
        {invoice.payments.length > 0 && (
          <div
            className="bg-white rounded-2xl overflow-hidden mt-6"
            style={{ border: "1px solid #e5eaf0" }}
          >
            <div className="px-6 md:px-8 py-5" style={{ borderBottom: "1px solid #e5eaf0" }}>
              <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>
                Payment History
              </h3>
            </div>
            <div className="divide-y" style={{ borderColor: "#f0f2f5" }}>
              {invoice.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="px-6 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "#D1FAE5" }}
                    >
                      <CheckCircle2 size={16} color="#065F46" />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#0F2744" }}>
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {formatDate(payment.paymentDate)}
                        {payment.paymentMethod && (
                          <> &middot; {payment.paymentMethod.replace(/_/g, " ")}</>
                        )}
                        {payment.reference && (
                          <> &middot; Ref: {payment.reference}</>
                        )}
                      </p>
                    </div>
                  </div>
                  {payment.receiptUrl && (
                    <Link
                      href={payment.receiptUrl}
                      target="_blank"
                      className="text-xs font-medium hover:underline"
                      style={{ color: "#D4AF37" }}
                    >
                      Download Receipt
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="mt-auto py-6"
        style={{ borderTop: "1px solid #e5eaf0", background: "#fff" }}
      >
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
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
