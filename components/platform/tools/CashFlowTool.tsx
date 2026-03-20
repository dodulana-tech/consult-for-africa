"use client";

import { useState } from "react";
import { Download } from "lucide-react";

const CATEGORIES = {
  inflows: ["Patient Revenue (OPD)", "Patient Revenue (Inpatient)", "HMO/Insurance Collections", "Lab & Diagnostics", "Pharmacy Sales", "Government/Donor Funding", "Other Income"],
  outflows: ["Staff Salaries & Wages", "Drug & Consumables", "Utilities & Facilities", "Equipment Maintenance", "Rent/Lease Payments", "Insurance & Statutory", "Marketing & Admin", "Loan Repayments", "Other Expenses"],
};

export default function CashFlowTool() {
  const [weeks] = useState(13);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [data, setData] = useState<Record<string, number[]>>(() => {
    const init: Record<string, number[]> = {};
    [...CATEGORIES.inflows, ...CATEGORIES.outflows].forEach((cat) => {
      init[cat] = Array(13).fill(0);
    });
    return init;
  });

  function setCell(category: string, weekIdx: number, value: number) {
    setData((prev) => {
      const next = { ...prev };
      next[category] = [...(prev[category] ?? [])];
      next[category][weekIdx] = value;
      return next;
    });
  }

  function weeklyTotal(cats: string[], weekIdx: number): number {
    return cats.reduce((sum, cat) => sum + (data[cat]?.[weekIdx] ?? 0), 0);
  }

  function cumulativeBalance(weekIdx: number): number {
    let balance = openingBalance;
    for (let w = 0; w <= weekIdx; w++) {
      balance += weeklyTotal(CATEGORIES.inflows, w) - weeklyTotal(CATEGORIES.outflows, w);
    }
    return balance;
  }

  function exportCSV() {
    const header = ["Category", ...Array.from({ length: weeks }, (_, i) => `Week ${i + 1}`)].join(",");
    const rows = [...CATEGORIES.inflows, ...CATEGORIES.outflows].map((cat) =>
      [cat, ...(data[cat] ?? []).map(String)].join(",")
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "13-week-cashflow.csv"; a.click();
  }

  const formatN = (n: number) => n < 0 ? `(${Math.abs(n).toLocaleString()})` : n.toLocaleString();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs border rounded px-2 py-1" style={{ borderColor: "#e5eaf0" }} />
          </div>
          <div>
            <label className="block text-[10px] font-medium text-gray-500 mb-0.5">Opening Balance (NGN)</label>
            <input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(Number(e.target.value))} className="text-xs border rounded px-2 py-1 w-32" style={{ borderColor: "#e5eaf0" }} />
          </div>
        </div>
        <button onClick={exportCSV} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5" style={{ borderColor: "#e5eaf0" }}>
          <Download size={12} /> Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#e5eaf0" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "#0F2744" }}>
              <th className="text-left px-3 py-2 text-white font-medium sticky left-0 z-10 min-w-[200px]" style={{ background: "#0F2744" }}>Category</th>
              {Array.from({ length: weeks }, (_, i) => (
                <th key={i} className="text-right px-2 py-2 text-white font-medium min-w-[80px]">Wk {i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Inflows */}
            <tr style={{ background: "#F0FDF4" }}>
              <td colSpan={weeks + 1} className="px-3 py-1.5 font-semibold text-green-800 text-[10px] uppercase tracking-wider">Cash Inflows</td>
            </tr>
            {CATEGORIES.inflows.map((cat) => (
              <tr key={cat} className="border-b hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                <td className="px-3 py-1 text-gray-700 sticky left-0 bg-white">{cat}</td>
                {Array.from({ length: weeks }, (_, i) => (
                  <td key={i} className="px-1 py-1">
                    <input
                      type="number"
                      value={data[cat]?.[i] || ""}
                      onChange={(e) => setCell(cat, i, Number(e.target.value) || 0)}
                      className="w-full text-right px-1 py-0.5 rounded border-0 focus:ring-1 focus:ring-green-200 bg-transparent"
                      placeholder="0"
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="font-semibold" style={{ background: "#DCFCE7" }}>
              <td className="px-3 py-1.5 text-green-800 sticky left-0" style={{ background: "#DCFCE7" }}>Total Inflows</td>
              {Array.from({ length: weeks }, (_, i) => (
                <td key={i} className="px-2 py-1.5 text-right text-green-800">{formatN(weeklyTotal(CATEGORIES.inflows, i))}</td>
              ))}
            </tr>

            {/* Outflows */}
            <tr style={{ background: "#FEF2F2" }}>
              <td colSpan={weeks + 1} className="px-3 py-1.5 font-semibold text-red-800 text-[10px] uppercase tracking-wider">Cash Outflows</td>
            </tr>
            {CATEGORIES.outflows.map((cat) => (
              <tr key={cat} className="border-b hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                <td className="px-3 py-1 text-gray-700 sticky left-0 bg-white">{cat}</td>
                {Array.from({ length: weeks }, (_, i) => (
                  <td key={i} className="px-1 py-1">
                    <input
                      type="number"
                      value={data[cat]?.[i] || ""}
                      onChange={(e) => setCell(cat, i, Number(e.target.value) || 0)}
                      className="w-full text-right px-1 py-0.5 rounded border-0 focus:ring-1 focus:ring-red-200 bg-transparent"
                      placeholder="0"
                    />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="font-semibold" style={{ background: "#FEE2E2" }}>
              <td className="px-3 py-1.5 text-red-800 sticky left-0" style={{ background: "#FEE2E2" }}>Total Outflows</td>
              {Array.from({ length: weeks }, (_, i) => (
                <td key={i} className="px-2 py-1.5 text-right text-red-800">{formatN(weeklyTotal(CATEGORIES.outflows, i))}</td>
              ))}
            </tr>

            {/* Net + Cumulative */}
            <tr className="font-semibold" style={{ background: "#EFF6FF" }}>
              <td className="px-3 py-1.5 sticky left-0" style={{ background: "#EFF6FF", color: "#0F2744" }}>Net Cash Flow</td>
              {Array.from({ length: weeks }, (_, i) => {
                const net = weeklyTotal(CATEGORIES.inflows, i) - weeklyTotal(CATEGORIES.outflows, i);
                return <td key={i} className="px-2 py-1.5 text-right" style={{ color: net < 0 ? "#DC2626" : "#0F2744" }}>{formatN(net)}</td>;
              })}
            </tr>
            <tr className="font-bold" style={{ background: "#0F2744" }}>
              <td className="px-3 py-2 text-white sticky left-0" style={{ background: "#0F2744" }}>Closing Balance</td>
              {Array.from({ length: weeks }, (_, i) => {
                const bal = cumulativeBalance(i);
                return <td key={i} className="px-2 py-2 text-right" style={{ color: bal < 0 ? "#FCA5A5" : "#fff" }}>{formatN(bal)}</td>;
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
