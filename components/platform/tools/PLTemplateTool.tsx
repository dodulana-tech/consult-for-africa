"use client";

import { useState } from "react";
import { Download } from "lucide-react";

const REVENUE_LINES = ["OPD Consultations", "Inpatient Admissions", "Surgical/Theatre Revenue", "Laboratory & Diagnostics", "Radiology & Imaging", "Pharmacy Sales", "HMO/Insurance Claims", "Retainership Fees", "Other Revenue"];
const EXPENSE_LINES = ["Medical Staff Salaries", "Nursing Staff Salaries", "Admin Staff Salaries", "Drugs & Consumables", "Lab Reagents & Supplies", "Medical Equipment Maintenance", "Rent & Facilities", "Utilities (Power, Water, Gas)", "Insurance & Statutory", "Marketing & Advertising", "IT & Software", "Professional Fees", "Depreciation", "Interest & Finance Costs", "Other Expenses"];

export default function PLTemplateTool() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<Record<string, number[]>>(() => {
    const init: Record<string, number[]> = {};
    [...REVENUE_LINES, ...EXPENSE_LINES].forEach((line) => { init[line] = Array(12).fill(0); });
    return init;
  });

  function setCell(line: string, monthIdx: number, value: number) {
    setData((prev) => {
      const next = { ...prev, [line]: [...(prev[line] ?? [])] };
      next[line][monthIdx] = value;
      return next;
    });
  }

  function lineTotal(lines: string[], monthIdx: number): number {
    return lines.reduce((sum, l) => sum + (data[l]?.[monthIdx] ?? 0), 0);
  }

  function yearTotal(line: string): number {
    return (data[line] ?? []).reduce((sum, v) => sum + v, 0);
  }

  function exportCSV() {
    const header = ["Line Item", ...months, "Total"].join(",");
    const rows = [...REVENUE_LINES, ...EXPENSE_LINES].map((l) => [l, ...(data[l] ?? []).map(String), yearTotal(l).toString()].join(","));
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `hospital-pl-${year}.csv`; a.click();
  }

  const formatN = (n: number) => n < 0 ? `(${Math.abs(n).toLocaleString()})` : n.toLocaleString();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-500">Year:</label>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="text-xs border rounded px-2 py-1 w-20" style={{ borderColor: "#e5eaf0" }} />
        </div>
        <button onClick={exportCSV} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5" style={{ borderColor: "#e5eaf0" }}><Download size={12} /> Export</button>
      </div>

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "#e5eaf0" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "#0F2744" }}>
              <th className="text-left px-3 py-2 text-white font-medium sticky left-0 min-w-[180px]" style={{ background: "#0F2744" }}>Line Item</th>
              {months.map((m) => <th key={m} className="text-right px-2 py-2 text-white font-medium min-w-[70px]">{m}</th>)}
              <th className="text-right px-3 py-2 text-white font-bold min-w-[80px]">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: "#F0FDF4" }}><td colSpan={14} className="px-3 py-1 font-semibold text-green-800 text-[10px] uppercase tracking-wider">Revenue</td></tr>
            {REVENUE_LINES.map((line) => (
              <tr key={line} className="border-b hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                <td className="px-3 py-1 text-gray-700 sticky left-0 bg-white">{line}</td>
                {months.map((_, i) => (
                  <td key={i} className="px-1 py-0.5"><input type="number" value={data[line]?.[i] || ""} onChange={(e) => setCell(line, i, Number(e.target.value) || 0)} className="w-full text-right px-1 py-0.5 rounded bg-transparent focus:ring-1 focus:ring-green-200 border-0" placeholder="0" /></td>
                ))}
                <td className="px-3 py-1 text-right font-medium text-green-800">{formatN(yearTotal(line))}</td>
              </tr>
            ))}
            <tr className="font-semibold" style={{ background: "#DCFCE7" }}>
              <td className="px-3 py-1.5 text-green-800 sticky left-0" style={{ background: "#DCFCE7" }}>Total Revenue</td>
              {months.map((_, i) => <td key={i} className="px-2 py-1.5 text-right text-green-800">{formatN(lineTotal(REVENUE_LINES, i))}</td>)}
              <td className="px-3 py-1.5 text-right text-green-800 font-bold">{formatN(REVENUE_LINES.reduce((s, l) => s + yearTotal(l), 0))}</td>
            </tr>

            <tr style={{ background: "#FEF2F2" }}><td colSpan={14} className="px-3 py-1 font-semibold text-red-800 text-[10px] uppercase tracking-wider">Expenses</td></tr>
            {EXPENSE_LINES.map((line) => (
              <tr key={line} className="border-b hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
                <td className="px-3 py-1 text-gray-700 sticky left-0 bg-white">{line}</td>
                {months.map((_, i) => (
                  <td key={i} className="px-1 py-0.5"><input type="number" value={data[line]?.[i] || ""} onChange={(e) => setCell(line, i, Number(e.target.value) || 0)} className="w-full text-right px-1 py-0.5 rounded bg-transparent focus:ring-1 focus:ring-red-200 border-0" placeholder="0" /></td>
                ))}
                <td className="px-3 py-1 text-right font-medium text-red-800">{formatN(yearTotal(line))}</td>
              </tr>
            ))}
            <tr className="font-semibold" style={{ background: "#FEE2E2" }}>
              <td className="px-3 py-1.5 text-red-800 sticky left-0" style={{ background: "#FEE2E2" }}>Total Expenses</td>
              {months.map((_, i) => <td key={i} className="px-2 py-1.5 text-right text-red-800">{formatN(lineTotal(EXPENSE_LINES, i))}</td>)}
              <td className="px-3 py-1.5 text-right text-red-800 font-bold">{formatN(EXPENSE_LINES.reduce((s, l) => s + yearTotal(l), 0))}</td>
            </tr>

            <tr className="font-bold" style={{ background: "#0F2744" }}>
              <td className="px-3 py-2 text-white sticky left-0" style={{ background: "#0F2744" }}>Net Profit / (Loss)</td>
              {months.map((_, i) => {
                const net = lineTotal(REVENUE_LINES, i) - lineTotal(EXPENSE_LINES, i);
                return <td key={i} className="px-2 py-2 text-right" style={{ color: net < 0 ? "#FCA5A5" : "#fff" }}>{formatN(net)}</td>;
              })}
              {(() => { const total = REVENUE_LINES.reduce((s, l) => s + yearTotal(l), 0) - EXPENSE_LINES.reduce((s, l) => s + yearTotal(l), 0); return <td className="px-3 py-2 text-right" style={{ color: total < 0 ? "#FCA5A5" : "#D4AF37" }}>{formatN(total)}</td>; })()}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
