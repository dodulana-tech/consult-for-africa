"use client";

import { useState } from "react";
import { Plus, Trash2, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type LineItem = { description: string; quantity: number; unitPrice: number };
type Project = { id: string; name: string };

const EMPTY_ITEM: LineItem = { description: "", quantity: 1, unitPrice: 0 };

export default function CreateInvoiceForm({
  clientId,
  projects,
  defaultCurrency,
  paymentTerms,
}: {
  clientId: string;
  projects: Project[];
  defaultCurrency: "NGN" | "USD";
  paymentTerms: number;
}) {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [currency, setCurrency] = useState<"NGN" | "USD">(defaultCurrency);
  const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_ITEM }]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [dueInDays, setDueInDays] = useState(paymentTerms);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ invoiceNumber: string; total: number } | null>(null);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = Math.round(subtotal * (taxPercent / 100) * 100) / 100;
  const total = subtotal + tax;

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const validItems = items.filter((i) => i.description.trim() && i.quantity > 0 && i.unitPrice > 0);
    if (!validItems.length) { setError("Add at least one complete line item."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          projectId: projectId || null,
          lineItems: validItems,
          taxPercent,
          dueInDays,
          currency,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setError(text || "Failed to create invoice.");
        return;
      }
      const data = await res.json();
      setCreated({ invoiceNumber: data.invoiceNumber, total: data.total });
      setItems([{ ...EMPTY_ITEM }]);
      setTimeout(() => window.location.reload(), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "#D1FAE5", border: "1px solid #A7F3D0" }}>
        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Invoice {created.invoiceNumber} created</p>
          <p className="text-xs text-emerald-700">Total: {formatCurrency(created.total, currency)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white overflow-hidden" style={{ border: "1px solid #e5eaf0" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-900">Create Invoice</span>
        </div>
        <span className="text-xs text-gray-400">{open ? "Hide" : "Open"}</span>
      </button>

      {open && (
        <form onSubmit={submit} className="border-t px-5 pb-5 pt-4 space-y-4" style={{ borderColor: "#e5eaf0" }}>
          {/* Project + Currency */}
          <div className="grid grid-cols-2 gap-3">
            {projects.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Project (optional)</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-gray-700 focus:outline-none"
                  style={{ borderColor: "#e5eaf0" }}
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "NGN" | "USD")}
                className="w-full rounded-lg border px-3 py-2 text-sm text-gray-700 focus:outline-none"
                style={{ borderColor: "#e5eaf0" }}
              >
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">Line Items</label>
              <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700">
                <Plus size={11} />
                Add item
              </button>
            </div>

            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-[10px] font-medium text-gray-400 px-1">
                <span className="col-span-6">Description</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-3 text-right">Unit Price</span>
                <span className="col-span-1" />
              </div>

              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                    placeholder="Description"
                    className="col-span-6 rounded-lg border px-2 py-1.5 text-xs focus:outline-none"
                    style={{ borderColor: "#e5eaf0" }}
                  />
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)}
                    className="col-span-2 rounded-lg border px-2 py-1.5 text-xs text-right focus:outline-none"
                    style={{ borderColor: "#e5eaf0" }}
                  />
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="col-span-3 rounded-lg border px-2 py-1.5 text-xs text-right focus:outline-none"
                    style={{ borderColor: "#e5eaf0" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    className="col-span-1 flex justify-center text-gray-300 hover:text-red-400 disabled:opacity-20"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tax + Payment terms */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Tax %</label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={taxPercent}
                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: "#e5eaf0" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Due in (days)</label>
              <input
                type="number"
                min="1"
                max="180"
                value={dueInDays}
                onChange={(e) => setDueInDays(parseInt(e.target.value) || 30)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{ borderColor: "#e5eaf0" }}
              />
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-lg p-3 space-y-1 text-sm" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            {taxPercent > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Tax ({taxPercent}%)</span>
                <span>{formatCurrency(tax, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t" style={{ borderColor: "#e5eaf0" }}>
              <span>Total</span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600">
              <AlertCircle size={12} />
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border py-2 text-sm text-gray-500 hover:bg-gray-50"
              style={{ borderColor: "#e5eaf0" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || total === 0}
              className="flex-1 rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "#0F2744" }}
            >
              {loading ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
