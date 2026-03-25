"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import { Plus, Trash2, Save, Send, Calculator } from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface LineItem {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
  category: string;
}

const CATEGORIES = [
  { value: "consulting_fee", label: "Consulting Fee" },
  { value: "expense_reimbursement", label: "Expense Reimbursement" },
  { value: "success_fee", label: "Success Fee" },
  { value: "mobilization", label: "Mobilization" },
  { value: "holdback", label: "Holdback" },
  { value: "other", label: "Other" },
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function genKey() {
  return Math.random().toString(36).slice(2, 10);
}

function calcLineAmount(qty: string, price: string) {
  const q = parseFloat(qty) || 0;
  const p = parseFloat(price) || 0;
  return q * p;
}

function fmtCurrency(amount: number, currency: string) {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);
  }
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 2 }).format(amount);
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Invoice metadata (read-only context)
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [engagementName, setEngagementName] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [status, setStatus] = useState("");

  // Editable fields
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [taxRate, setTaxRate] = useState("0");
  const [whtRate, setWhtRate] = useState("0");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/invoices/${id}`);
      if (!res.ok) { setError("Failed to load invoice"); return; }
      const inv = await res.json();

      if (inv.status !== "DRAFT") {
        setError("Only DRAFT invoices can be edited. Revert to Draft first.");
        setStatus(inv.status);
        setLoading(false);
        return;
      }

      setInvoiceNumber(inv.invoiceNumber);
      setClientName(inv.client?.name ?? "");
      setEngagementName(inv.engagement?.name ?? "");
      setCurrency(inv.currency);
      setStatus(inv.status);
      setClientNotes(inv.clientNotes ?? "");
      setInternalNotes(inv.notes ?? "");
      setDiscountAmount(String(inv.discountAmount ?? 0));
      setDueDate(inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : "");

      // Derive tax/wht rates from existing amounts
      const sub = Number(inv.subtotal) || 0;
      if (sub > 0) {
        setTaxRate(String(Math.round((Number(inv.tax) / sub) * 10000) / 100));
        setWhtRate(String(Math.round((Number(inv.whtAmount) / sub) * 10000) / 100));
      }

      // Map line item records
      if (inv.lineItemRecords?.length > 0) {
        setLineItems(
          inv.lineItemRecords.map((item: { description: string; quantity: number; unitPrice: number; category: string | null }) => ({
            key: genKey(),
            description: item.description,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
            category: item.category ?? "consulting_fee",
          }))
        );
      } else {
        setLineItems([{ key: genKey(), description: "", quantity: "1", unitPrice: "", category: "consulting_fee" }]);
      }
    } catch {
      setError("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

  // Line items CRUD
  function addLineItem() {
    setLineItems([...lineItems, { key: genKey(), description: "", quantity: "1", unitPrice: "", category: "consulting_fee" }]);
  }
  function updateLineItem(key: string, field: keyof LineItem, value: string) {
    setLineItems(lineItems.map((item) => item.key === key ? { ...item, [field]: value } : item));
  }
  function removeLineItem(key: string) {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((item) => item.key !== key));
  }

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + calcLineAmount(item.quantity, item.unitPrice), 0);
  const taxAmount = subtotal * (parseFloat(taxRate) || 0) / 100;
  const whtAmount = subtotal * (parseFloat(whtRate) || 0) / 100;
  const discount = parseFloat(discountAmount) || 0;
  const total = subtotal + taxAmount - whtAmount - discount;

  async function handleSave(resend: boolean) {
    setSubmitting(true);
    setError("");
    try {
      const body = {
        lineItems: lineItems.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          category: item.category,
        })),
        clientNotes: clientNotes || null,
        notes: internalNotes || null,
        dueDate: dueDate || null,
      };

      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setError(await res.text());
        return;
      }

      if (resend) {
        // Send the invoice
        const sendRes = await fetch(`/api/invoices/${id}/send`, { method: "POST" });
        if (!sendRes.ok) {
          setError(await sendRes.text());
          return;
        }
      }

      router.push(`/finance/invoices/${id}`);
    } catch {
      setError("Failed to save invoice");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title="Edit Invoice" backHref={`/finance/invoices/${id}`} />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Loading invoice...</p>
        </main>
      </div>
    );
  }

  if (status && status !== "DRAFT") {
    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar title="Edit Invoice" backHref={`/finance/invoices/${id}`} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">This invoice is currently <strong>{status}</strong>. Revert it to Draft before editing.</p>
            <button
              onClick={() => router.push(`/finance/invoices/${id}`)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "#0F2744" }}
            >
              Back to Invoice
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title={`Edit ${invoiceNumber}`}
        subtitle={`${clientName}${engagementName ? ` / ${engagementName}` : ""}`}
        backHref={`/finance/invoices/${id}`}
      />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl space-y-6">

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg" style={{ border: "1px solid #fecaca" }}>
              {error}
            </div>
          )}

          {/* ─── Line Items ───────────────────────────────────────────── */}
          <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e5eaf0" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Line Items</h3>
              <button
                onClick={addLineItem}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors font-medium"
              >
                <Plus size={14} />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {/* Header (desktop) */}
              <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-medium text-gray-500 px-1">
                <div className="col-span-4">Description</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit Price</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1" />
              </div>

              {lineItems.map((item) => {
                const amount = calcLineAmount(item.quantity, item.unitPrice);
                return (
                  <div key={item.key} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="sm:col-span-4">
                      <label className="sm:hidden text-xs text-gray-500 mb-0.5 block">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.key, "description", e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                        placeholder="Service description"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="sm:hidden text-xs text-gray-500 mb-0.5 block">Category</label>
                      <select
                        value={item.category}
                        onChange={(e) => updateLineItem(item.key, "category", e.target.value)}
                        className="w-full px-2 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none"
                      >
                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div className="sm:col-span-1">
                      <label className="sm:hidden text-xs text-gray-500 mb-0.5 block">Qty</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.key, "quantity", e.target.value)}
                        className="w-full px-2 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none text-right"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="sm:hidden text-xs text-gray-500 mb-0.5 block">Unit Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(item.key, "unitPrice", e.target.value)}
                        className="w-full px-2 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none text-right"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center justify-end">
                      <span className="text-sm font-medium text-gray-900">{fmtCurrency(amount, currency)}</span>
                    </div>
                    <div className="sm:col-span-1 flex items-center justify-end">
                      <button
                        onClick={() => removeLineItem(item.key)}
                        disabled={lineItems.length <= 1}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Totals & Tax ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e5eaf0" }}>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Tax & Adjustments</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WHT Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={whtRate}
                      onChange={(e) => setWhtRate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e5eaf0" }}>
              <div className="flex items-center gap-2 mb-4">
                <Calculator size={15} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Totals</h3>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-700 font-medium">{fmtCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({taxRate}%)</span>
                  <span className="text-gray-700">+{fmtCurrency(taxAmount, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">WHT ({whtRate}%)</span>
                  <span className="text-red-500">-{fmtCurrency(whtAmount, currency)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-red-500">-{fmtCurrency(discount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold pt-3" style={{ borderTop: "2px solid #e5eaf0" }}>
                  <span style={{ color: "#0F2744" }}>Total</span>
                  <span style={{ color: "#0F2744" }}>{fmtCurrency(total, currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Notes ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e5eaf0" }}>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Client Notes</label>
              <p className="text-xs text-gray-400 mb-2">Shown on the invoice</p>
              <textarea
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                rows={3}
                placeholder="Payment instructions, thank you note, etc."
              />
            </div>
            <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e5eaf0" }}>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Internal Notes</label>
              <p className="text-xs text-gray-400 mb-2">Not shown on the invoice</p>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                rows={3}
                placeholder="Internal context, follow-up reminders..."
              />
            </div>
          </div>

          {/* ─── Actions ──────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pb-6">
            <button
              onClick={() => router.push(`/finance/invoices/${id}`)}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
              style={{ borderColor: "#0F2744", color: "#0F2744" }}
            >
              <Save size={15} />
              Save Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={submitting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ background: "#0F2744" }}
            >
              <Send size={15} />
              {submitting ? "Saving..." : "Save & Resend"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
