"use client";

import { useState } from "react";
import { Plus, X, Download } from "lucide-react";

interface PayerLine { id: string; name: string; patients: number; revenue: number; avgClaim: number; daysToPayment: number; denialRate: number }

const COLORS = ["#0F2744", "#D4AF37", "#059669", "#DC2626", "#7C3AED", "#D97706", "#2563EB", "#EC4899", "#14B8A6", "#F97316"];
let c = 0;
function uid() { return `p-${++c}`; }

export default function PayerMixTool() {
  const [payers, setPayers] = useState<PayerLine[]>([
    { id: uid(), name: "NHIS", patients: 0, revenue: 0, avgClaim: 0, daysToPayment: 0, denialRate: 0 },
    { id: uid(), name: "Private Pay (Out of Pocket)", patients: 0, revenue: 0, avgClaim: 0, daysToPayment: 0, denialRate: 0 },
  ]);

  function update(id: string, field: string, value: string | number) {
    setPayers((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  }
  function add() { setPayers((prev) => [...prev, { id: uid(), name: "", patients: 0, revenue: 0, avgClaim: 0, daysToPayment: 0, denialRate: 0 }]); }
  function remove(id: string) { setPayers((prev) => prev.filter((p) => p.id !== id)); }

  const totalRevenue = payers.reduce((s, p) => s + p.revenue, 0);
  const totalPatients = payers.reduce((s, p) => s + p.patients, 0);
  const formatN = (n: number) => `N${n.toLocaleString()}`;

  function exportCSV() {
    const header = "Payer,Patients,Revenue (NGN),Revenue %,Avg Claim,Days to Payment,Denial Rate";
    const rows = payers.map((p) => [p.name, p.patients, p.revenue, totalRevenue ? ((p.revenue / totalRevenue) * 100).toFixed(1) + "%" : "0%", p.avgClaim, p.daysToPayment, p.denialRate + "%"].join(","));
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "payer-mix.csv"; a.click();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex justify-between">
        <p className="text-xs text-gray-400">Analyze revenue concentration and payer performance to identify risks and opportunities.</p>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5" style={{ borderColor: "#e5eaf0" }}><Download size={12} /> Export</button>
          <button onClick={add} className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5" style={{ background: "#0F2744" }}><Plus size={12} /> Add Payer</button>
        </div>
      </div>

      {/* Visual mix */}
      {totalRevenue > 0 && (
        <div className="rounded-xl border p-4" style={{ borderColor: "#e5eaf0", background: "#fff" }}>
          <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-3">Revenue Mix</h4>
          <div className="flex h-8 rounded-full overflow-hidden">
            {payers.filter((p) => p.revenue > 0).map((p, i) => (
              <div key={p.id} style={{ width: `${(p.revenue / totalRevenue) * 100}%`, background: COLORS[i % COLORS.length] }} title={`${p.name}: ${((p.revenue / totalRevenue) * 100).toFixed(1)}%`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {payers.filter((p) => p.revenue > 0).map((p, i) => (
              <span key={p.id} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {p.name}: {((p.revenue / totalRevenue) * 100).toFixed(0)}%
              </span>
            ))}
          </div>
          {payers.some((p) => p.revenue > 0 && (p.revenue / totalRevenue) > 0.4) && (
            <p className="text-[10px] text-amber-600 mt-2">Warning: Revenue concentration above 40% from a single payer increases risk.</p>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#e5eaf0" }}>
        <table className="w-full text-xs">
          <thead><tr style={{ background: "#0F2744" }}>
            <th className="text-left px-3 py-2 text-white font-medium min-w-0">Payer</th>
            <th className="text-right px-3 py-2 text-white font-medium">Patients</th>
            <th className="text-right px-3 py-2 text-white font-medium">Revenue (NGN)</th>
            <th className="text-right px-3 py-2 text-white font-medium">Rev %</th>
            <th className="text-right px-3 py-2 text-white font-medium">Avg Claim</th>
            <th className="text-right px-3 py-2 text-white font-medium">Days to Pay</th>
            <th className="text-right px-3 py-2 text-white font-medium">Denial %</th>
            <th className="w-8"></th>
          </tr></thead>
          <tbody>
            {payers.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                <td className="px-2 py-1"><input value={p.name} onChange={(e) => update(p.id, "name", e.target.value)} className="w-full border-0 bg-transparent py-1 outline-none font-medium" placeholder="Payer name" /></td>
                <td className="px-1 py-1"><input type="number" value={p.patients || ""} onChange={(e) => update(p.id, "patients", Number(e.target.value))} className="w-full text-right border-0 bg-transparent py-1 outline-none" placeholder="0" /></td>
                <td className="px-1 py-1"><input type="number" value={p.revenue || ""} onChange={(e) => update(p.id, "revenue", Number(e.target.value))} className="w-full text-right border-0 bg-transparent py-1 outline-none" placeholder="0" /></td>
                <td className="px-2 py-1 text-right text-gray-500">{totalRevenue ? ((p.revenue / totalRevenue) * 100).toFixed(1) + "%" : "-"}</td>
                <td className="px-1 py-1"><input type="number" value={p.avgClaim || ""} onChange={(e) => update(p.id, "avgClaim", Number(e.target.value))} className="w-full text-right border-0 bg-transparent py-1 outline-none" placeholder="0" /></td>
                <td className="px-1 py-1"><input type="number" value={p.daysToPayment || ""} onChange={(e) => update(p.id, "daysToPayment", Number(e.target.value))} className="w-full text-right border-0 bg-transparent py-1 outline-none" placeholder="0" /></td>
                <td className="px-1 py-1"><input type="number" value={p.denialRate || ""} onChange={(e) => update(p.id, "denialRate", Number(e.target.value))} className="w-full text-right border-0 bg-transparent py-1 outline-none" placeholder="0" min="0" max="100" /></td>
                <td className="px-1"><button onClick={() => remove(p.id)} className="text-gray-300 hover:text-red-400"><X size={12} /></button></td>
              </tr>
            ))}
            <tr className="font-semibold" style={{ background: "#F9FAFB" }}>
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right">{totalPatients.toLocaleString()}</td>
              <td className="px-3 py-2 text-right">{formatN(totalRevenue)}</td>
              <td className="px-3 py-2 text-right">100%</td>
              <td colSpan={4}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
