"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import {
  Send,
  Download,
  CreditCard,
  Edit3,
  CheckCircle2,
  FileText,
  Bell,
  Clock,
  X,
  ArrowLeft,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  category: string | null;
}

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: string;
  reference: string | null;
  bankName: string | null;
  status: string;
  notes: string | null;
  confirmedBy: { name: string } | null;
  confirmedAt: string | null;
}

interface Reminder {
  id: string;
  sentAt: string;
  channel: string;
  reminderType: string;
  recipientEmail: string;
  notes: string | null;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  status: string;
  currency: string;
  subtotal: number;
  tax: number;
  whtAmount: number;
  discountAmount: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  issuedDate: string | null;
  dueDate: string | null;
  paidDate: string | null;
  viewedAt: string | null;
  notes: string | null;
  clientNotes: string | null;
  client: { id: string; name: string; email?: string; phone?: string; address?: string };
  engagement: { id: string; name: string } | null;
  lineItemRecords: LineItem[];
  payments: PaymentRecord[];
  reminders: Reminder[];
  approvedBy: { name: string } | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ─── Constants ───────────────────────────────────────────────────────────── */

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  DRAFT:            { bg: "#F3F4F6", color: "#6B7280" },
  PENDING_APPROVAL: { bg: "#FEF3C7", color: "#92400E" },
  SENT:             { bg: "#EFF6FF", color: "#1D4ED8" },
  VIEWED:           { bg: "#E0E7FF", color: "#3730A3" },
  PARTIALLY_PAID:   { bg: "#FEF9C3", color: "#854D0E" },
  PAID:             { bg: "#D1FAE5", color: "#065F46" },
  OVERDUE:          { bg: "#FEE2E2", color: "#991B1B" },
  DISPUTED:         { bg: "#FCE7F3", color: "#9D174D" },
  WRITTEN_OFF:      { bg: "#F3F4F6", color: "#9CA3AF" },
  CANCELLED:        { bg: "#F3F4F6", color: "#9CA3AF" },
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  SENT: "Sent",
  VIEWED: "Viewed",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
  DISPUTED: "Disputed",
  WRITTEN_OFF: "Written Off",
  CANCELLED: "Cancelled",
};

const TYPE_LABELS: Record<string, string> = {
  STANDARD: "Standard",
  PROFORMA: "Proforma",
  CREDIT_NOTE: "Credit Note",
  DEBIT_NOTE: "Debit Note",
  MOBILIZATION: "Mobilization",
  MILESTONE: "Milestone",
  RETAINER: "Retainer",
  FINAL_SETTLEMENT: "Final Settlement",
};

const PAYMENT_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: "#FEF3C7", color: "#92400E" },
  CONFIRMED: { bg: "#D1FAE5", color: "#065F46" },
  FAILED:    { bg: "#FEE2E2", color: "#991B1B" },
  REVERSED:  { bg: "#FCE7F3", color: "#9D174D" },
};

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "paystack", label: "Paystack" },
  { value: "wise", label: "Wise" },
  { value: "cheque", label: "Cheque" },
  { value: "cash", label: "Cash" },
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function fmtCurrency(amount: number, currency: string) {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);
  }
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(amount);
}

function fmtDate(d: string | null) {
  if (!d) return "--";
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

function fmtDateTime(d: string | null) {
  if (!d) return "--";
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

function nextActionForStatus(status: string) {
  switch (status) {
    case "DRAFT": return { label: "Send Invoice", icon: Send, action: "send" };
    case "PENDING_APPROVAL": return { label: "Approve", icon: CheckCircle2, action: "approve" };
    case "SENT": return { label: "Record Payment", icon: CreditCard, action: "record_payment" };
    case "VIEWED": return { label: "Record Payment", icon: CreditCard, action: "record_payment" };
    case "PARTIALLY_PAID": return { label: "Record Payment", icon: CreditCard, action: "record_payment" };
    case "OVERDUE": return { label: "Send Reminder", icon: Bell, action: "remind" };
    default: return null;
  }
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "bank_transfer",
    reference: "",
    bankName: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/invoices/${id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
        setPaymentForm((prev) => ({ ...prev, amount: String(data.balanceDue ?? "") }));
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

  async function handleAction(action: string) {
    if (action === "record_payment") {
      setShowPaymentModal(true);
      return;
    }
    try {
      await fetch(`/api/finance/invoices/${id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      fetchInvoice();
    } catch {
      // silently handle
    }
  }

  async function submitPayment() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/finance/invoices/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          paymentDate: paymentForm.paymentDate,
          paymentMethod: paymentForm.paymentMethod,
          reference: paymentForm.reference || null,
          bankName: paymentForm.bankName || null,
          notes: paymentForm.notes || null,
        }),
      });
      if (res.ok) {
        setShowPaymentModal(false);
        setPaymentForm({ amount: "", paymentDate: new Date().toISOString().split("T")[0], paymentMethod: "bank_transfer", reference: "", bankName: "", notes: "" });
        fetchInvoice();
      }
    } catch {
      // silently handle
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title="Invoice" backHref="/finance/invoices" />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Loading invoice...</p>
        </main>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title="Invoice" backHref="/finance/invoices" />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Invoice not found.</p>
        </main>
      </div>
    );
  }

  const sc = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.DRAFT;
  const nextAction = nextActionForStatus(invoice.status);

  // Build activity timeline from available data
  const timeline: { date: string; label: string; detail?: string }[] = [];
  timeline.push({ date: invoice.createdAt, label: "Invoice created" });
  if (invoice.approvedAt) timeline.push({ date: invoice.approvedAt, label: "Approved", detail: invoice.approvedBy?.name ?? "" });
  if (invoice.issuedDate) timeline.push({ date: invoice.issuedDate, label: "Issued" });
  if (invoice.viewedAt) timeline.push({ date: invoice.viewedAt, label: "Viewed by client" });
  if (invoice.paidDate) timeline.push({ date: invoice.paidDate, label: "Marked as paid" });
  invoice.reminders.forEach((r) => {
    timeline.push({ date: r.sentAt, label: `${r.reminderType.replace(/_/g, " ")} sent`, detail: `via ${r.channel} to ${r.recipientEmail}` });
  });
  timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title={invoice.invoiceNumber}
        subtitle={`${invoice.client.name}${invoice.engagement ? ` / ${invoice.engagement.name}` : ""}`}
        backHref="/finance/invoices"
      />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ─── Left: Invoice Preview ─────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Status + Next Action */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm px-3 py-1 rounded-full font-medium" style={{ background: sc.bg, color: sc.color }}>
                  {STATUS_LABELS[invoice.status] ?? invoice.status}
                </span>
                <span className="text-sm px-2.5 py-1 rounded-full font-medium" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                  {TYPE_LABELS[invoice.invoiceType] ?? invoice.invoiceType}
                </span>
                {nextAction && (
                  <button
                    onClick={() => handleAction(nextAction.action)}
                    className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                    style={{ background: "#0F2744" }}
                  >
                    <nextAction.icon size={15} />
                    {nextAction.label}
                  </button>
                )}
              </div>

              {/* Invoice Card */}
              <div className="bg-white rounded-xl p-6 sm:p-8" style={{ border: "1px solid #e5eaf0" }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: "#0F2744" }}>INVOICE</h2>
                    <p className="text-sm text-gray-500 mt-1">{invoice.invoiceNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>Consult For Africa</p>
                    <p className="text-xs text-gray-400 mt-0.5">Healthcare Consulting</p>
                  </div>
                </div>

                {/* Client + Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
                    <p className="text-sm font-semibold text-gray-900">{invoice.client.name}</p>
                    {invoice.engagement && <p className="text-xs text-gray-500 mt-0.5">Project: {invoice.engagement.name}</p>}
                  </div>
                  <div className="text-right sm:text-right">
                    <div className="grid grid-cols-2 gap-y-1 text-sm">
                      <span className="text-gray-400">Issued:</span>
                      <span className="text-gray-700 text-right">{fmtDate(invoice.issuedDate)}</span>
                      <span className="text-gray-400">Due:</span>
                      <span className="text-gray-700 text-right">{fmtDate(invoice.dueDate)}</span>
                      <span className="text-gray-400">Currency:</span>
                      <span className="text-gray-700 text-right">{invoice.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "2px solid #e5eaf0" }}>
                        <th className="text-left py-2 pr-4 font-medium text-gray-500">Description</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-500">Qty</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-500">Unit Price</th>
                        <th className="text-right py-2 pl-4 font-medium text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lineItemRecords.length > 0 ? (
                        invoice.lineItemRecords.map((item) => (
                          <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td className="py-3 pr-4 text-gray-800">
                              {item.description}
                              {item.category && (
                                <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">
                                  {item.category.replace(/_/g, " ")}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-600">{item.quantity}</td>
                            <td className="py-3 px-4 text-right text-gray-600">{fmtCurrency(item.unitPrice, invoice.currency)}</td>
                            <td className="py-3 pl-4 text-right font-medium text-gray-900">{fmtCurrency(item.amount, invoice.currency)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-gray-400">No line items</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-full sm:w-72 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-700">{fmtCurrency(invoice.subtotal, invoice.currency)}</span>
                    </div>
                    {invoice.tax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Tax (VAT)</span>
                        <span className="text-gray-700">+{fmtCurrency(invoice.tax, invoice.currency)}</span>
                      </div>
                    )}
                    {invoice.whtAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">WHT Deduction</span>
                        <span className="text-red-500">-{fmtCurrency(invoice.whtAmount, invoice.currency)}</span>
                      </div>
                    )}
                    {invoice.discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Discount</span>
                        <span className="text-red-500">-{fmtCurrency(invoice.discountAmount, invoice.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: "2px solid #e5eaf0" }}>
                      <span style={{ color: "#0F2744" }}>Total</span>
                      <span style={{ color: "#0F2744" }}>{fmtCurrency(invoice.total, invoice.currency)}</span>
                    </div>
                    {invoice.paidAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Paid</span>
                        <span className="text-green-600">-{fmtCurrency(invoice.paidAmount, invoice.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold pt-1" style={{ borderTop: "1px solid #e5eaf0" }}>
                      <span className="text-gray-900">Balance Due</span>
                      <span style={{ color: invoice.balanceDue > 0 ? "#DC2626" : "#065F46" }}>
                        {fmtCurrency(invoice.balanceDue, invoice.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Client Notes */}
                {invoice.clientNotes && (
                  <div className="mt-6 pt-4" style={{ borderTop: "1px solid #f1f5f9" }}>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.clientNotes}</p>
                  </div>
                )}
              </div>

              {/* ─── Payment History ──────────────────────────────────── */}
              <div className="bg-white rounded-xl" style={{ border: "1px solid #e5eaf0" }}>
                <div className="px-6 py-4" style={{ borderBottom: "1px solid #e5eaf0" }}>
                  <h3 className="text-sm font-semibold text-gray-900">Payment History</h3>
                </div>
                {invoice.payments.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-400 text-sm">No payments recorded yet</div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {invoice.payments.map((p) => {
                      const pc = PAYMENT_STATUS_COLORS[p.status] ?? PAYMENT_STATUS_COLORS.PENDING;
                      return (
                        <div key={p.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{fmtCurrency(p.amount, p.currency)}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {p.paymentMethod.replace(/_/g, " ")} {p.reference ? `/ ${p.reference}` : ""}
                              {p.bankName ? ` / ${p.bankName}` : ""}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: pc.bg, color: pc.color }}>
                            {p.status}
                          </span>
                          <span className="text-xs text-gray-400">{fmtDate(p.paymentDate)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ─── Right: Actions + Timeline ─────────────────────────── */}
            <div className="space-y-6">

              {/* Actions */}
              <div className="bg-white rounded-xl" style={{ border: "1px solid #e5eaf0" }}>
                <div className="px-5 py-4" style={{ borderBottom: "1px solid #e5eaf0" }}>
                  <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
                </div>
                <div className="p-4 space-y-1.5">
                  {invoice.status === "DRAFT" && (
                    <button
                      onClick={() => router.push(`/finance/invoices/${id}/edit`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors text-gray-700"
                    >
                      <Edit3 size={15} className="text-gray-400" />
                      Edit Invoice
                    </button>
                  )}
                  {(invoice.status === "DRAFT" || invoice.status === "PENDING_APPROVAL") && (
                    <button
                      onClick={() => handleAction("approve")}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors text-gray-700"
                    >
                      <CheckCircle2 size={15} className="text-gray-400" />
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleAction("send")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <Send size={15} className="text-gray-400" />
                    Send Invoice
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <CreditCard size={15} className="text-gray-400" />
                    Record Payment
                  </button>
                  <button
                    onClick={() => handleAction("credit_note")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <FileText size={15} className="text-gray-400" />
                    Generate Credit Note
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <Download size={15} className="text-gray-400" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => handleAction("remind")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    <Bell size={15} className="text-gray-400" />
                    Send Reminder
                  </button>
                </div>
              </div>

              {/* Internal Notes */}
              {invoice.notes && (
                <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #e5eaf0" }}>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Internal Notes</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}

              {/* Activity Timeline */}
              <div className="bg-white rounded-xl" style={{ border: "1px solid #e5eaf0" }}>
                <div className="px-5 py-4" style={{ borderBottom: "1px solid #e5eaf0" }}>
                  <h3 className="text-sm font-semibold text-gray-900">Activity</h3>
                </div>
                <div className="p-5">
                  <div className="space-y-4">
                    {timeline.map((entry, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: "#D4AF37" }} />
                          {i < timeline.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm text-gray-800">{entry.label}</p>
                          {entry.detail && <p className="text-xs text-gray-400 mt-0.5">{entry.detail}</p>}
                          <p className="text-xs text-gray-400 mt-0.5">{fmtDateTime(entry.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Record Payment Modal ─────────────────────────────────────── */}
      {showPaymentModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowPaymentModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl" style={{ border: "1px solid #e5eaf0" }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #e5eaf0" }}>
                <h3 className="text-base font-semibold text-gray-900">Record Payment</h3>
                <button onClick={() => setShowPaymentModal(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount ({invoice.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Bank reference or cheque number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={paymentForm.bankName}
                    onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. GTBank, Zenith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    rows={2}
                    placeholder="Optional notes"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid #e5eaf0" }}>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitPayment}
                  disabled={submitting || !paymentForm.amount}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ background: "#0F2744" }}
                >
                  {submitting ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
