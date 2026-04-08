"use client";

import { Briefcase } from "lucide-react";
import { formatCompactCurrency } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  sub,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  icon: typeof Briefcase;
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "#fff", border: "1px solid #e5eaf0" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color }} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

export function BudgetBar({
  spent,
  total,
  currency,
  pct,
}: {
  spent: number;
  total: number;
  currency: "NGN" | "USD";
  pct: number;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">Budget</span>
        <span className={`font-medium ${pct > 90 ? "text-red-600" : pct > 75 ? "text-amber-600" : "text-gray-700"}`}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: pct > 90 ? "#EF4444" : pct > 75 ? "#F59E0B" : "#10B981",
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{formatCompactCurrency(spent, currency)}</span>
        <span>{formatCompactCurrency(total, currency)}</span>
      </div>
    </div>
  );
}
