"use client";

import { useState } from "react";
import { Plus, X, Download } from "lucide-react";

interface Denial { id: string; payer: string; claimId: string; amount: number; reason: string; category: string; dateSubmitted: string; dateDenied: string; status: string; appealNotes: string }

const CATEGORIES = ["Missing Documentation", "Pre-authorization", "Coding Error", "Eligibility", "Duplicate Claim", "Late Filing", "Medical Necessity", "Tariff Dispute", "Other"];
const PAYERS = ["NHIS", "Leadway Health", "AXA Mansard", "Hygeia", "Reliance HMO", "Mediplan", "Clearline HMO", "Total Health Trust", "Redcare HMO", "Private Pay", "Other"];

let c = 0;
function uid() { return `d-${++c}`; }

export default function DenialDashboardTool() {
  const [denials, setDenials] = useState<Denial[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Omit<Denial, "id">>({ payer: "", claimId: "", amount: 0, reason: "", category: "", dateSubmitted: "", dateDenied: "", status: "DENIED", appealNotes: "" });

  function add() {
    setDenials((prev) => [...prev, { id: uid(), ...form }]);
    setForm({ payer: "", claimId: "", amount: 0, reason: "", category: "", dateSubmitted: "", dateDenied: "", status: "DENIED", appealNotes: "" });
    setShowAdd(false);
  }
  function remove(id: string) { setDenials((prev) => prev.filter((d) => d.id !== id)); }
  function updateStatus(id: string, status: string) { setDenials((prev) => prev.map((d) => d.id === id ? { ...d, status } : d)); }

  const totalDenied = denials.reduce((s, d) => s + d.amount, 0);
  const recovered = denials.filter((d) => d.status === "RECOVERED").reduce((s, d) => s + d.amount, 0);
  const appealing = denials.filter((d) => d.status === "APPEALING").reduce((s, d) => s + d.amount, 0);
  const byCategory = CATEGORIES.map((cat) => ({ cat, count: denials.filter((d) => d.category === cat).length, amount: denials.filter((d) => d.category === cat).reduce((s, d) => s + d.amount, 0) })).filter((c) => c.count > 0).sort((a, b) => b.amount - a.amount);
  const byPayer = PAYERS.map((p) => ({ payer: p, count: denials.filter((d) => d.payer === p).length, amount: denials.filter((d) => d.payer === p).reduce((s, d) => s + d.amount, 0) })).filter((p) => p.count > 0).sort((a, b) => b.amount - a.amount);

  function exportCSV() {
    const header = "Payer,Claim ID,Amount,Category,Reason,Status,Date Submitted,Date Denied";
    const rows = denials.map((d) => [d.payer, d.claimId, d.amount, d.category, `"${d.reason}"`, d.status, d.dateSubmitted, d.dateDenied].join(","));
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "denial-dashboard.csv"; a.click();
  }

  const formatN = (n: number) => `N${n.toLocaleString()}`;
  const inputClass = "w-full text-xs border rounded-lg px-2.5 py-1.5";

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border p-4" style={{ borderColor: "#e5eaf0", background: "#fff" }}><p className="text-[10px] text-gray-500">Total Denied</p><p className="text-lg font-bold" style={{ color: "#DC2626" }}>{formatN(totalDenied)}</p><p className="text-[10px] text-gray-400">{denials.length} claims</p></div>
        <div className="rounded-xl border p-4" style={{ borderColor: "#e5eaf0", background: "#fff" }}><p className="text-[10px] text-gray-500">Recovered</p><p className="text-lg font-bold" style={{ color: "#059669" }}>{formatN(recovered)}</p></div>
        <div className="rounded-xl border p-4" style={{ borderColor: "#e5eaf0", background: "#fff" }}><p className="text-[10px] text-gray-500">Under Appeal</p><p className="text-lg font-bold" style={{ color: "#D97706" }}>{formatN(appealing)}</p></div>
        <div className="rounded-xl border p-4" style={{ borderColor: "#e5eaf0", background: "#fff" }}><p className="text-[10px] text-gray-500">Recovery Rate</p><p className="text-lg font-bold" style={{ color: "#0F2744" }}>{totalDenied > 0 ? Math.round((recovered / totalDenied) * 100) : 0}%</p></div>
      </div>

      {/* Top reasons + payers */}
      {(byCategory.length > 0 || byPayer.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {byCategory.length > 0 && (
            <div className="rounded-xl border p-4" style={{ borderColor: "#e5eaf0", background: "#fff" }}>
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Top Denial Reasons</h4>
              {byCategory.slice(0, 5).map((c) => (
                <div key={c.cat} className="flex items-center justify-between text-xs py-1 border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
                  <span className="text-gray-700">{c.cat} ({c.count})</span>
                  <span className="font-medium" style={{ color: "#DC2626" }}>{formatN(c.amount)}</span>
                </div>
              ))}
            </div>
          )}
          {byPayer.length > 0 && (
            <div className="rounded-xl border p-4" style={{ borderColor: "#e5eaf0", background: "#fff" }}>
              <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">By Payer</h4>
              {byPayer.slice(0, 5).map((p) => (
                <div key={p.payer} className="flex items-center justify-between text-xs py-1 border-b last:border-0" style={{ borderColor: "#F3F4F6" }}>
                  <span className="text-gray-700">{p.payer} ({p.count})</span>
                  <span className="font-medium" style={{ color: "#DC2626" }}>{formatN(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5" style={{ background: "#0F2744" }}><Plus size={12} /> Log Denial</button>
        {denials.length > 0 && <button onClick={exportCSV} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5" style={{ borderColor: "#e5eaf0" }}><Download size={12} /> Export</button>}
      </div>

      {showAdd && (
        <div className="rounded-xl border p-5 space-y-3" style={{ borderColor: "#e5eaf0", background: "#fff" }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><label className="block text-[10px] font-medium text-gray-500 mb-0.5">Payer</label><select value={form.payer} onChange={(e) => setForm((p) => ({ ...p, payer: e.target.value }))} className={inputClass} style={{ borderColor: "#e5eaf0" }}><option value="">Select...</option>{PAYERS.map((p) => <option key={p}>{p}</option>)}</select></div>
            <div><label className="block text-[10px] font-medium text-gray-500 mb-0.5">Claim ID</label><input value={form.claimId} onChange={(e) => setForm((p) => ({ ...p, claimId: e.target.value }))} className={inputClass} style={{ borderColor: "#e5eaf0" }} /></div>
            <div><label className="block text-[10px] font-medium text-gray-500 mb-0.5">Amount (NGN)</label><input type="number" value={form.amount || ""} onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))} className={inputClass} style={{ borderColor: "#e5eaf0" }} /></div>
            <div><label className="block text-[10px] font-medium text-gray-500 mb-0.5">Category</label><select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className={inputClass} style={{ borderColor: "#e5eaf0" }}><option value="">Select...</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div><label className="block text-[10px] font-medium text-gray-500 mb-0.5">Denial Reason</label><input value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} className={inputClass} style={{ borderColor: "#e5eaf0" }} placeholder="Specific reason from payer" /></div>
          <button onClick={add} disabled={!form.payer || !form.amount} className="text-xs px-3 py-1.5 rounded-lg text-white disabled:opacity-50" style={{ background: "#D4AF37" }}>Add Denial</button>
        </div>
      )}

      {/* Denials table */}
      {denials.length > 0 && (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#e5eaf0" }}>
          <table className="w-full text-xs">
            <thead><tr style={{ background: "#0F2744" }}>
              <th className="text-left px-3 py-2 text-white font-medium">Payer</th>
              <th className="text-left px-3 py-2 text-white font-medium">Claim</th>
              <th className="text-right px-3 py-2 text-white font-medium">Amount</th>
              <th className="text-left px-3 py-2 text-white font-medium">Category</th>
              <th className="text-left px-3 py-2 text-white font-medium">Status</th>
              <th className="w-8"></th>
            </tr></thead>
            <tbody>
              {denials.map((d) => (
                <tr key={d.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                  <td className="px-3 py-2 text-gray-700">{d.payer}</td>
                  <td className="px-3 py-2 text-gray-500">{d.claimId || "-"}</td>
                  <td className="px-3 py-2 text-right font-medium" style={{ color: "#DC2626" }}>{formatN(d.amount)}</td>
                  <td className="px-3 py-2 text-gray-500">{d.category}</td>
                  <td className="px-3 py-2">
                    <select value={d.status} onChange={(e) => updateStatus(d.id, e.target.value)} className="text-[10px] border rounded px-1.5 py-0.5" style={{ borderColor: "#e5eaf0" }}>
                      <option value="DENIED">Denied</option><option value="APPEALING">Appealing</option><option value="RECOVERED">Recovered</option><option value="WRITTEN_OFF">Written Off</option>
                    </select>
                  </td>
                  <td className="px-1"><button onClick={() => remove(d.id)} className="text-gray-300 hover:text-red-400"><X size={12} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
