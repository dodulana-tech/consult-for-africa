"use client";

import { useState } from "react";
import { Pencil, X, Check, Loader2 } from "lucide-react";
import { formatCompactCurrency } from "@/lib/utils";

const inputClass = "rounded-lg border px-2 py-1 text-sm font-semibold text-gray-700 w-28 focus:outline-none focus:ring-1 focus:ring-[#0F2744]";
const inputStyle = { borderColor: "#e5eaf0" };

export default function InlineProjectBudget({ projectId, amount, currency }: {
  projectId: string;
  amount: number;
  currency: string;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentAmount, setCurrentAmount] = useState(amount);
  const [currentCurrency, setCurrentCurrency] = useState(currency);
  const [formAmount, setFormAmount] = useState(String(amount));
  const [formCurrency, setFormCurrency] = useState(currency);

  async function save(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgetAmount: parseFloat(formAmount) || 0, budgetCurrency: formCurrency }),
      });
      if (res.ok) {
        setCurrentAmount(parseFloat(formAmount) || 0);
        setCurrentCurrency(formCurrency);
        setEditing(false);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  function cancel(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setFormAmount(String(currentAmount));
    setFormCurrency(currentCurrency);
    setEditing(false);
  }

  function startEdit(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setEditing(true);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.preventDefault()}>
        <select value={formCurrency} onChange={(e) => setFormCurrency(e.target.value)}
          className="rounded-lg border px-1 py-1 text-xs focus:outline-none" style={inputStyle}>
          <option value="NGN">&#8358;</option>
          <option value="USD">$</option>
        </select>
        <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)}
          className={inputClass} style={inputStyle} autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") save(e as unknown as React.MouseEvent); if (e.key === "Escape") cancel(e as unknown as React.MouseEvent); }}
        />
        <button onClick={save} disabled={saving} className="p-1 rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        </button>
        <button onClick={cancel} className="p-1 rounded text-gray-400 hover:bg-gray-100">
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <button onClick={startEdit} className="group flex items-center gap-1 text-sm font-semibold text-gray-700 shrink-0 hover:text-[#0F2744]">
      {formatCompactCurrency(currentAmount, currentCurrency as "NGN" | "USD")}
      <Pencil size={11} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
