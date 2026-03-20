"use client";

import { useState } from "react";
import { Plus, X, Download } from "lucide-react";

interface AgingBucket { label: string; min: number; max: number | null }
const BUCKETS: AgingBucket[] = [
  { label: "Current (0-30)", min: 0, max: 30 },
  { label: "31-60 days", min: 31, max: 60 },
  { label: "61-90 days", min: 61, max: 90 },
  { label: "91-120 days", min: 91, max: 120 },
  { label: "121-180 days", min: 121, max: 180 },
  { label: "180+ days", min: 181, max: null },
];

interface Receivable { id: string; payer: string; invoiceRef: string; amount: number; daysOutstanding: number; lastAction: string; notes: string }

let c = 0;
function uid() { return `r-${++c}`; }

export default function CollectionsTrackerTool() {
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ payer: "", invoiceRef: "", amount: 0, daysOutstanding: 0, lastAction: "", notes: "" });

  function add() {
    setReceivables((prev) => [...prev, { id: uid(), ...form }]);
    setForm({ payer: "", invoiceRef: "", amount: 0, daysOutstanding: 0, lastAction: "", notes: "" });
    setShowAdd(false);
  }
  function remove(id: string) { setReceivables((prev) => prev.filter((r) => r.id !== id)); }

  const totalAR = receivables.reduce((s, r) => s + r.amount, 0);
  const bucketData = BUCKETS.map((b) => {
    const items = receivables.filter((r) => r.daysOutstanding >= b.min && (b.max === null || r.daysOutstanding <= b.max));
    return { ...b, count: items.length, amount: items.reduce((s, r) => s + r.amount, 0) };
  });

  const formatN = (n: number) => `N${n.toLocaleString()}`;
  const BUCKET_COLORS = ["#059669", "#2563EB", "#D97706", "#EA580C", "#DC2626", "#7F1D1D"];

  function exportCSV() {
    const header = "Payer,Invoice,Amount,Days Outstanding,Last Action,Notes";
    const rows = receivables.map((r) => [r.payer, r.invoiceRef, r.amount, r.daysOutstanding, `"${r.lastAction}"`, `"${r.notes}"`].join(","));
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "collections-aging.csv"; a.click();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      {/* Aging summary */}
      <div className="rounded-xl border p-5" style={{ borderColor: "#e5eaf0", background: "#fff" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ color: "#0F2744" }}>Accounts Receivable Aging</h3>
          <span className="text-lg font-bold" style={{ color: "#0F2744" }}>{formatN(totalAR)}</span>
        </div>
        {totalAR > 0 && (
          <div className="flex h-6 rounded-full overflow-hidden mb-3">
            {bucketData.filter((b) => b.amount > 0).map((b, i) => (
              <div key={b.label} style={{ width: `${(b.amount / totalAR) * 100}%`, background: BUCKET_COLORS[i] }} title={`${b.label}: ${formatN(b.amount)}`} />
            ))}
          </div>
        )}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {bucketData.map((b, i) => (
            <div key={b.label} className="text-center">
              <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ background: BUCKET_COLORS[i] }} />
              <p className="text-[10px] text-gray-500">{b.label}</p>
              <p className="text-xs font-bold" style={{ color: "#0F2744" }}>{formatN(b.amount)}</p>
              <p className="text-[10px] text-gray-400">{b.count} items</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5" style={{ background: "#0F2744" }}><Plus size={12} /> Add Receivable</button>
        {receivables.length > 0 && <button onClick={exportCSV} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5" style={{ borderColor: "#e5eaf0" }}><Download size={12} /> Export</button>}
      </div>

      {showAdd && (
        <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "#e5eaf0", background: "#fff" }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input value={form.payer} onChange={(e) => setForm((p) => ({ ...p, payer: e.target.value }))} className="text-xs border rounded-lg px-2.5 py-1.5" style={{ borderColor: "#e5eaf0" }} placeholder="Payer" />
            <input value={form.invoiceRef} onChange={(e) => setForm((p) => ({ ...p, invoiceRef: e.target.value }))} className="text-xs border rounded-lg px-2.5 py-1.5" style={{ borderColor: "#e5eaf0" }} placeholder="Invoice ref" />
            <input type="number" value={form.amount || ""} onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))} className="text-xs border rounded-lg px-2.5 py-1.5" style={{ borderColor: "#e5eaf0" }} placeholder="Amount (NGN)" />
            <input type="number" value={form.daysOutstanding || ""} onChange={(e) => setForm((p) => ({ ...p, daysOutstanding: Number(e.target.value) }))} className="text-xs border rounded-lg px-2.5 py-1.5" style={{ borderColor: "#e5eaf0" }} placeholder="Days outstanding" />
          </div>
          <input value={form.lastAction} onChange={(e) => setForm((p) => ({ ...p, lastAction: e.target.value }))} className="w-full text-xs border rounded-lg px-2.5 py-1.5" style={{ borderColor: "#e5eaf0" }} placeholder="Last follow-up action taken" />
          <button onClick={add} disabled={!form.payer || !form.amount} className="text-xs px-3 py-1.5 rounded-lg text-white disabled:opacity-50" style={{ background: "#D4AF37" }}>Add</button>
        </div>
      )}

      {/* Receivables table */}
      {receivables.length > 0 && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#e5eaf0" }}>
          <table className="w-full text-xs">
            <thead><tr style={{ background: "#0F2744" }}>
              <th className="text-left px-3 py-2 text-white font-medium">Payer</th>
              <th className="text-left px-3 py-2 text-white font-medium">Invoice</th>
              <th className="text-right px-3 py-2 text-white font-medium">Amount</th>
              <th className="text-right px-3 py-2 text-white font-medium">Days</th>
              <th className="text-left px-3 py-2 text-white font-medium">Bucket</th>
              <th className="text-left px-3 py-2 text-white font-medium">Last Action</th>
              <th className="w-8"></th>
            </tr></thead>
            <tbody>
              {receivables.sort((a, b) => b.daysOutstanding - a.daysOutstanding).map((r) => {
                const bucketIdx = BUCKETS.findIndex((b) => r.daysOutstanding >= b.min && (b.max === null || r.daysOutstanding <= b.max));
                return (
                  <tr key={r.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                    <td className="px-3 py-2 font-medium text-gray-700">{r.payer}</td>
                    <td className="px-3 py-2 text-gray-500">{r.invoiceRef || "-"}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatN(r.amount)}</td>
                    <td className="px-3 py-2 text-right" style={{ color: r.daysOutstanding > 90 ? "#DC2626" : "#374151" }}>{r.daysOutstanding}</td>
                    <td className="px-3 py-2"><span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ background: BUCKET_COLORS[bucketIdx] }}>{BUCKETS[bucketIdx]?.label}</span></td>
                    <td className="px-3 py-2 text-gray-500 max-w-[200px] truncate">{r.lastAction || "-"}</td>
                    <td className="px-1"><button onClick={() => remove(r.id)} className="text-gray-300 hover:text-red-400"><X size={12} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
