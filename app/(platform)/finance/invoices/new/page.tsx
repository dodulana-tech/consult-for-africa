"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopBar from "@/components/platform/TopBar";
import {
  Plus,
  Trash2,
  Save,
  Send,
  Calculator,
} from "lucide-react";

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface ClientOption {
  id: string;
  name: string;
  currency: string;
}

interface EngagementOption {
  id: string;
  name: string;
  billingSchedule?: {
    taxRatePct: number;
    whtRatePct: number;
    paymentTermsDays: number;
    currency: string;
  } | null;
}

interface LineItem {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
  category: string;
}

const INVOICE_TYPES = [
  { value: "STANDARD", label: "Standard" },
  { value: "PROFORMA", label: "Proforma" },
  { value: "MOBILIZATION", label: "Mobilization" },
  { value: "MILESTONE", label: "Milestone" },
  { value: "RETAINER", label: "Retainer" },
  { value: "FINAL_SETTLEMENT", label: "Final Settlement" },
];

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

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("clientId") ?? "";

  // Data
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [engagements, setEngagements] = useState<EngagementOption[]>([]);

  // Form
  const [clientId, setClientId] = useState(preselectedClientId);
  const [engagementId, setEngagementId] = useState("");
  const [invoiceType, setInvoiceType] = useState("STANDARD");
  const [currency, setCurrency] = useState("NGN");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { key: genKey(), description: "", quantity: "1", unitPrice: "", category: "consulting_fee" },
  ]);
  const [taxRate, setTaxRate] = useState("0");
  const [whtRate, setWhtRate] = useState("0");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [paymentTermsDays, setPaymentTermsDays] = useState("30");
  const [clientNotes, setClientNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch clients
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/finance/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(data);
        }
      } catch {
        // silently handle
      }
    }
    load();
  }, []);

  // Fetch engagements when client changes
  useEffect(() => {
    if (!clientId) { setEngagements([]); return; }
    async function load() {
      try {
        const res = await fetch(`/api/finance/engagements?clientId=${clientId}`);
        if (res.ok) {
          const data = await res.json();
          setEngagements(data);
        }
      } catch {
        // silently handle
      }
    }
    load();
    // Set default currency from client
    const client = clients.find((c) => c.id === clientId);
    if (client) setCurrency(client.currency);
  }, [clientId, clients]);

  // Auto-populate from billing schedule
  useEffect(() => {
    if (!engagementId) return;
    const eng = engagements.find((e) => e.id === engagementId);
    if (eng?.billingSchedule) {
      setTaxRate(String(eng.billingSchedule.taxRatePct));
      setWhtRate(String(eng.billingSchedule.whtRatePct));
      setPaymentTermsDays(String(eng.billingSchedule.paymentTermsDays));
      setCurrency(eng.billingSchedule.currency);
    }
  }, [engagementId, engagements]);

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
  const balanceDue = total;

  // Due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (parseInt(paymentTermsDays) || 30));

  // Submit
  async function handleSubmit(sendImmediately: boolean) {
    if (!clientId) return;
    setSubmitting(true);
    try {
      const body = {
        clientId,
        engagementId: engagementId || null,
        invoiceType,
        currency,
        lineItems: lineItems.map((item) => ({
          description: item.description,
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
          amount: calcLineAmount(item.quantity, item.unitPrice),
          category: item.category,
        })),
        subtotal,
        taxRate: parseFloat(taxRate) || 0,
        taxAmount,
        whtRate: parseFloat(whtRate) || 0,
        whtAmount,
        discountAmount: discount,
        total,
        balanceDue,
        paymentTermsDays: parseInt(paymentTermsDays) || 30,
        clientNotes: clientNotes || null,
        notes: internalNotes || null,
        sendImmediately,
      };

      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/finance/invoices/${data.id}`);
      }
    } catch {
      // silently handle
    } finally {
      setSubmitting(false);
    }
  }

  const filteredClients = clientSearch
    ? clients.filter((c) => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
    : clients;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="New Invoice" backHref="/finance/invoices" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl space-y-6">

          {/* ─── Client & Engagement ──────────────────────────────────── */}
          <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #e5eaf0" }}>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Invoice Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 mb-1"
                />
                <select
                  value={clientId}
                  onChange={(e) => { setClientId(e.target.value); setEngagementId(""); }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  size={Math.min(filteredClients.length + 1, 6)}
                >
                  <option value="">Select a client</option>
                  {filteredClients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.currency})</option>
                  ))}
                </select>
              </div>

              {/* Engagement Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Engagement</label>
                <select
                  value={engagementId}
                  onChange={(e) => setEngagementId(e.target.value)}
                  disabled={!clientId}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
                >
                  <option value="">Select engagement (optional)</option>
                  {engagements.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              {/* Invoice Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Type</label>
                <select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {INVOICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="NGN">NGN</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
          </div>

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
                    {/* Description */}
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
                    {/* Category */}
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
                    {/* Quantity */}
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
                    {/* Unit Price */}
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
                    {/* Amount */}
                    <div className="sm:col-span-2 flex items-center justify-end">
                      <span className="text-sm font-medium text-gray-900">{fmtCurrency(amount, currency)}</span>
                    </div>
                    {/* Remove */}
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
            {/* Tax / WHT / Discount */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (days)</label>
                  <input
                    type="number"
                    value={paymentTermsDays}
                    onChange={(e) => setPaymentTermsDays(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Due: {dueDate.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>

            {/* Running Totals */}
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
                <div className="flex justify-between text-sm font-semibold pt-1" style={{ borderTop: "1px solid #e5eaf0" }}>
                  <span className="text-gray-900">Balance Due</span>
                  <span style={{ color: "#DC2626" }}>{fmtCurrency(balanceDue, currency)}</span>
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
              onClick={() => router.push("/finance/invoices")}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting || !clientId}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
              style={{ borderColor: "#0F2744", color: "#0F2744" }}
            >
              <Save size={15} />
              Save as Draft
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting || !clientId}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ background: "#0F2744" }}
            >
              <Send size={15} />
              {submitting ? "Saving..." : "Save & Send"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
