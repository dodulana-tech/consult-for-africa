"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface RatioResult { name: string; value: number | null; benchmark: string; status: "good" | "warning" | "danger" | "neutral"; formula: string }

export default function FinancialRatioTool() {
  const [inputs, setInputs] = useState({
    totalRevenue: 0, costOfServices: 0, operatingExpenses: 0, totalAssets: 0,
    currentAssets: 0, currentLiabilities: 0, cash: 0, totalDebt: 0, totalEquity: 0,
    netIncome: 0, accountsReceivable: 0, inventory: 0, bedCount: 0,
    occupiedBedDays: 0, availableBedDays: 0, totalPatients: 0, staffCount: 0,
  });

  function set(field: string, value: number) { setInputs((p) => ({ ...p, [field]: value })); }

  const safe = (n: number, d: number) => d === 0 ? null : n / d;
  const pct = (v: number | null) => v === null ? "N/A" : `${(v * 100).toFixed(1)}%`;
  const ratio = (v: number | null) => v === null ? "N/A" : v.toFixed(2);

  const ratios: RatioResult[] = [
    { name: "Gross Margin", value: safe(inputs.totalRevenue - inputs.costOfServices, inputs.totalRevenue), benchmark: "African private: 40-60%", status: (safe(inputs.totalRevenue - inputs.costOfServices, inputs.totalRevenue) ?? 0) > 0.4 ? "good" : "warning", formula: "(Revenue - Cost of Services) / Revenue" },
    { name: "Operating Margin", value: safe(inputs.totalRevenue - inputs.operatingExpenses, inputs.totalRevenue), benchmark: "Healthy: >15%", status: (safe(inputs.totalRevenue - inputs.operatingExpenses, inputs.totalRevenue) ?? 0) > 0.15 ? "good" : (safe(inputs.totalRevenue - inputs.operatingExpenses, inputs.totalRevenue) ?? 0) > 0 ? "warning" : "danger", formula: "(Revenue - OpEx) / Revenue" },
    { name: "Net Profit Margin", value: safe(inputs.netIncome, inputs.totalRevenue), benchmark: "Nigerian private: 8-15%", status: (safe(inputs.netIncome, inputs.totalRevenue) ?? 0) > 0.08 ? "good" : "warning", formula: "Net Income / Revenue" },
    { name: "Current Ratio", value: safe(inputs.currentAssets, inputs.currentLiabilities), benchmark: "Healthy: 1.5-2.5x", status: (safe(inputs.currentAssets, inputs.currentLiabilities) ?? 0) > 1.5 ? "good" : (safe(inputs.currentAssets, inputs.currentLiabilities) ?? 0) > 1 ? "warning" : "danger", formula: "Current Assets / Current Liabilities" },
    { name: "Quick Ratio", value: safe(inputs.currentAssets - inputs.inventory, inputs.currentLiabilities), benchmark: "Healthy: >1.0x", status: (safe(inputs.currentAssets - inputs.inventory, inputs.currentLiabilities) ?? 0) > 1 ? "good" : "warning", formula: "(Current Assets - Inventory) / Current Liabilities" },
    { name: "Debt-to-Equity", value: safe(inputs.totalDebt, inputs.totalEquity), benchmark: "Conservative: <0.5x", status: (safe(inputs.totalDebt, inputs.totalEquity) ?? 0) < 0.5 ? "good" : (safe(inputs.totalDebt, inputs.totalEquity) ?? 0) < 1 ? "warning" : "danger", formula: "Total Debt / Total Equity" },
    { name: "Return on Assets", value: safe(inputs.netIncome, inputs.totalAssets), benchmark: "Good: >5%", status: (safe(inputs.netIncome, inputs.totalAssets) ?? 0) > 0.05 ? "good" : "warning", formula: "Net Income / Total Assets" },
    { name: "Days in A/R", value: inputs.totalRevenue > 0 ? (inputs.accountsReceivable / (inputs.totalRevenue / 365)) : null, benchmark: "Target: <45 days", status: (inputs.totalRevenue > 0 ? (inputs.accountsReceivable / (inputs.totalRevenue / 365)) : 999) < 45 ? "good" : "danger", formula: "A/R / (Revenue / 365)" },
    { name: "Bed Occupancy Rate", value: safe(inputs.occupiedBedDays, inputs.availableBedDays), benchmark: "Optimal: 75-85%", status: (safe(inputs.occupiedBedDays, inputs.availableBedDays) ?? 0) > 0.75 ? "good" : "warning", formula: "Occupied Bed Days / Available Bed Days" },
    { name: "Revenue per Bed", value: inputs.bedCount > 0 ? inputs.totalRevenue / inputs.bedCount : null, benchmark: "Varies by market", status: "neutral", formula: "Total Revenue / Bed Count" },
    { name: "Revenue per Patient", value: safe(inputs.totalRevenue, inputs.totalPatients), benchmark: "Track trend over time", status: "neutral", formula: "Total Revenue / Total Patients" },
    { name: "Staff per Bed", value: safe(inputs.staffCount, inputs.bedCount), benchmark: "Nigerian avg: 3-5 staff/bed", status: "neutral", formula: "Total Staff / Bed Count" },
  ];

  const statusColors = { good: { bg: "#DCFCE7", color: "#166534" }, warning: { bg: "#FEF3C7", color: "#92400E" }, danger: { bg: "#FEE2E2", color: "#991B1B" }, neutral: { bg: "#F3F4F6", color: "#374151" } };

  const fields = [
    { section: "Income Statement", items: [
      { key: "totalRevenue", label: "Total Revenue (NGN)" },
      { key: "costOfServices", label: "Cost of Services" },
      { key: "operatingExpenses", label: "Total Operating Expenses" },
      { key: "netIncome", label: "Net Income" },
    ]},
    { section: "Balance Sheet", items: [
      { key: "currentAssets", label: "Current Assets" },
      { key: "currentLiabilities", label: "Current Liabilities" },
      { key: "cash", label: "Cash & Equivalents" },
      { key: "totalAssets", label: "Total Assets" },
      { key: "totalDebt", label: "Total Debt" },
      { key: "totalEquity", label: "Total Equity" },
      { key: "accountsReceivable", label: "Accounts Receivable" },
      { key: "inventory", label: "Inventory (Drugs/Supplies)" },
    ]},
    { section: "Operational", items: [
      { key: "bedCount", label: "Bed Count" },
      { key: "occupiedBedDays", label: "Occupied Bed Days (annual)" },
      { key: "availableBedDays", label: "Available Bed Days (annual)" },
      { key: "totalPatients", label: "Total Patients (annual)" },
      { key: "staffCount", label: "Total Staff" },
    ]},
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Inputs */}
        <div className="lg:col-span-2 space-y-4">
          {fields.map((section) => (
            <div key={section.section} className="rounded-xl border p-4" style={{ borderColor: "#e5eaf0", background: "#fff" }}>
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">{section.section}</h3>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 flex-1">{item.label}</label>
                    <input type="number" value={inputs[item.key as keyof typeof inputs] || ""} onChange={(e) => set(item.key, Number(e.target.value) || 0)} className="w-28 text-xs text-right border rounded px-2 py-1" style={{ borderColor: "#e5eaf0" }} placeholder="0" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex justify-end">
            <button onClick={() => {
              const text = ratios.map((r) => `${r.name}: ${r.value !== null ? (r.name.includes("Days") || r.name.includes("per") ? ratio(r.value) : pct(r.value)) : "N/A"} (${r.benchmark})`).join("\n");
              const blob = new Blob([`Financial Ratios\n${"=".repeat(40)}\n\n${text}`], { type: "text/plain" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "financial-ratios.txt"; a.click();
            }} className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5" style={{ borderColor: "#e5eaf0" }}><Download size={12} /> Export</button>
          </div>
          {ratios.map((r) => {
            const st = statusColors[r.status];
            const display = r.name.includes("Days") || r.name.includes("per") || r.name.includes("Staff") ? ratio(r.value) : pct(r.value);
            return (
              <div key={r.name} className="rounded-xl border p-4 flex items-center gap-4" style={{ borderColor: "#e5eaf0", background: "#fff" }}>
                <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold" style={{ background: st.bg, color: st.color }}>
                  {display}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: "#0F2744" }}>{r.name}</p>
                  <p className="text-[10px] text-gray-400">{r.formula}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.benchmark}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
