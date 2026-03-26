"use client";

import { useState, useEffect } from "react";
import { formatCompactCurrency } from "@/lib/utils";
import { Plus, X } from "lucide-react";

interface PaymentMilestone {
  id: string;
  name: string;
  amount: number;
  currency: string;
  dueDate: string;
  paidDate: string | null;
  status: "PENDING" | "INVOICED" | "PAID" | "OVERDUE";
  createdAt: string;
}

const statusStyle: Record<string, { bg: string; color: string }> = {
  PENDING:  { bg: "#F9FAFB", color: "#9CA3AF" },
  INVOICED: { bg: "#EFF6FF", color: "#3B82F6" },
  PAID:     { bg: "#ECFDF5", color: "#10B981" },
  OVERDUE:  { bg: "#FEF2F2", color: "#EF4444" },
};

export default function FinancialPL({
  projectId,
  budgetAmount,
  actualSpent,
  budgetCurrency,
  canManage,
}: {
  projectId: string;
  budgetAmount: number;
  actualSpent: number;
  budgetCurrency: "NGN" | "USD";
  canManage: boolean;
}) {
  const [milestones, setMilestones] = useState<PaymentMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", dueDate: "", currency: budgetCurrency });

  useEffect(() => {
    fetch(`/api/projects/${projectId}/payment-milestones`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setMilestones(data); })
      .finally(() => setLoading(false));
  }, [projectId]);

  async function addMilestone() {
    if (!form.name.trim() || !form.amount || !form.dueDate) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/payment-milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      if (res.ok) {
        const { milestone } = await res.json();
        setMilestones((prev) => [...prev, milestone]);
        setForm({ name: "", amount: "", dueDate: "", currency: budgetCurrency });
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  const budgetPct = budgetAmount > 0 ? Math.round((actualSpent / budgetAmount) * 100) : 0;
  const remaining = budgetAmount - actualSpent;

  const totalReceivable = milestones.reduce((s, m) => s + m.amount, 0);
  const totalReceived = milestones.filter((m) => m.status === "PAID").reduce((s, m) => s + m.amount, 0);

  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: "#fff", border: "1px solid #e5eaf0" }}>
      <h3 className="text-sm font-semibold text-gray-900">Financial P&L</h3>

      {/* Budget summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div className="rounded-lg p-3 text-center" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
          <p className="text-[10px] text-gray-400 mb-1">Budget</p>
          <p className="text-sm font-bold text-gray-900">{formatCompactCurrency(budgetAmount, budgetCurrency)}</p>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
          <p className="text-[10px] text-gray-400 mb-1">Spent</p>
          <p
            className="text-sm font-bold"
            style={{ color: budgetPct > 90 ? "#EF4444" : budgetPct > 75 ? "#F59E0B" : "#10B981" }}
          >
            {formatCompactCurrency(actualSpent, budgetCurrency)}
          </p>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
          <p className="text-[10px] text-gray-400 mb-1">Remaining</p>
          <p className="text-sm font-bold text-gray-900">{formatCompactCurrency(remaining, budgetCurrency)}</p>
        </div>
      </div>

      {/* Budget bar */}
      <div>
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>Budget utilization</span>
          <span className="font-semibold">{budgetPct}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(budgetPct, 100)}%`,
              background: budgetPct > 90 ? "#EF4444" : budgetPct > 75 ? "#F59E0B" : "#10B981",
            }}
          />
        </div>
      </div>

      {/* Payment milestones */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">Payment Milestones</span>
          {canManage && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded"
              style={{ background: showForm ? "#F3F4F6" : "#EFF6FF", color: showForm ? "#374151" : "#3B82F6" }}
            >
              {showForm ? <X size={10} /> : <Plus size={10} />}
              {showForm ? "Cancel" : "Add"}
            </button>
          )}
        </div>

        {showForm && (
          <div className="rounded-lg p-3 space-y-2 mb-3" style={{ background: "#F9FAFB", border: "1px solid #e5eaf0" }}>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Milestone name (e.g. Initial deposit) *"
              className="w-full text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
              style={{ border: "1px solid #e5eaf0", background: "#fff" }}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <div className="col-span-2">
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="Amount *"
                  className="w-full text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                  style={{ border: "1px solid #e5eaf0", background: "#fff" }}
                />
              </div>
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value as "NGN" | "USD" }))}
                className="text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              >
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-1 block">Due date *</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                style={{ border: "1px solid #e5eaf0", background: "#fff" }}
              />
            </div>
            <button
              onClick={addMilestone}
              disabled={!form.name.trim() || !form.amount || !form.dueDate || saving}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
              style={{ background: "#0F2744", color: "#fff" }}
            >
              {saving ? "Saving..." : "Add Milestone"}
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-xs text-gray-400">Loading...</p>
        ) : milestones.length === 0 ? (
          <p className="text-xs text-gray-400">No payment milestones defined.</p>
        ) : (
          <div className="space-y-2">
            {milestones.map((m) => {
              const s = statusStyle[m.status] ?? statusStyle.PENDING;
              const due = new Date(m.dueDate);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2"
                  style={{ background: s.bg, border: "1px solid #e5eaf0" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-900 truncate">{m.name}</p>
                    <p className="text-[10px] text-gray-400">
                      Due {due.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-gray-900">
                      {formatCompactCurrency(m.amount, m.currency as "NGN" | "USD")}
                    </p>
                    <span className="text-[10px] font-medium" style={{ color: s.color }}>{m.status}</span>
                  </div>
                </div>
              );
            })}
            {totalReceivable > 0 && (
              <div className="flex justify-between text-xs pt-2" style={{ borderTop: "1px solid #F3F4F6" }}>
                <span className="text-gray-500">
                  Received: {formatCompactCurrency(totalReceived, budgetCurrency)} / {formatCompactCurrency(totalReceivable, budgetCurrency)}
                </span>
                <span className="font-semibold text-gray-900">
                  {totalReceivable > 0 ? Math.round((totalReceived / totalReceivable) * 100) : 0}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
