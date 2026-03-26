"use client";

import { useState, useMemo } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle2, CreditCard, ChevronDown, ChevronUp } from "lucide-react";

type Entry = {
  id: string;
  date: string;
  hours: number;
  description: string;
  billableAmount: number | null;
  currency: "NGN" | "USD";
  consultant: { id: string; name: string; email: string };
  assignment: {
    rateType: string;
    engagement: { id: string; name: string };
    consultant: {
      consultantProfile: {
        bankName: string | null;
        accountNumber: string | null;
        accountName: string | null;
        swiftCode: string | null;
      } | null;
    };
  };
};

type Group = {
  consultantId: string;
  consultantName: string;
  email: string;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  swiftCode: string | null;
  ngnTotal: number;
  usdTotal: number;
  entries: Entry[];
};

function groupByConsultant(entries: Entry[]): Group[] {
  const map = new Map<string, Group>();
  for (const e of entries) {
    const key = e.consultant.id;
    if (!map.has(key)) {
      const prof = e.assignment.consultant.consultantProfile;
      map.set(key, {
        consultantId: key,
        consultantName: e.consultant.name,
        email: e.consultant.email,
        bankName: prof?.bankName ?? null,
        accountNumber: prof?.accountNumber ?? null,
        accountName: prof?.accountName ?? null,
        swiftCode: prof?.swiftCode ?? null,
        ngnTotal: 0,
        usdTotal: 0,
        entries: [],
      });
    }
    const g = map.get(key)!;
    g.entries.push(e);
    if (e.currency === "NGN") g.ngnTotal += e.billableAmount ?? 0;
    else g.usdTotal += e.billableAmount ?? 0;
  }
  return Array.from(map.values()).sort((a, b) => a.consultantName.localeCompare(b.consultantName));
}

export default function PaymentQueue({ entries }: { entries: Entry[] }) {
  const groups = useMemo(() => groupByConsultant(entries), [entries]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<string | null>(null);
  const [paid, setPaid] = useState<Set<string>>(new Set());
  const [payRef, setPayRef] = useState("");
  const [payMethod, setPayMethod] = useState("Bank Transfer");
  const [showConfirm, setShowConfirm] = useState<Group | null>(null);
  const [payError, setPayError] = useState("");

  const visibleGroups = groups.filter((g) => !g.entries.every((e) => paid.has(e.id)));

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectGroup(g: Group) {
    const ids = g.entries.map((e) => e.id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  async function markPaid(group: Group) {
    const entryIds = group.entries.map((e) => e.id);
    setProcessing(group.consultantId);
    setPayError("");
    try {
      const res = await fetch("/api/payments/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryIds,
          paymentReference: payRef || "N/A",
          paymentMethod: payMethod || "Bank Transfer",
        }),
      });
      if (res.ok) {
        setPaid((prev) => {
          const next = new Set(prev);
          entryIds.forEach((id) => next.add(id));
          return next;
        });
        setShowConfirm(null);
        setPayRef("");
      } else {
        const text = await res.text().catch(() => "");
        setPayError(text || "Payment failed. Please try again.");
      }
    } catch {
      setPayError("Network error. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  if (visibleGroups.length === 0) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-3" />
          <p className="text-sm font-medium text-gray-700">All payments processed</p>
          <p className="text-xs text-gray-400 mt-1">No approved entries awaiting payment</p>
        </div>
      </main>
    );
  }

  const totalNGN = visibleGroups.reduce((s, g) => s + g.ngnTotal, 0);
  const totalUSD = visibleGroups.reduce((s, g) => s + g.usdTotal, 0);

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Consultants", value: visibleGroups.length, color: "#3B82F6" },
            { label: "NGN Outstanding", value: formatCurrency(totalNGN, "NGN"), color: "#10B981" },
            { label: "USD Outstanding", value: `$${totalUSD.toFixed(2)}`, color: "#8B5CF6" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 bg-white" style={{ border: "1px solid #e5eaf0" }}>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              <div className="h-1 rounded-full mt-2 w-8" style={{ background: s.color }} />
            </div>
          ))}
        </div>

        {/* Groups */}
        <div className="space-y-3">
          {visibleGroups.map((g) => {
            const isExpanded = expanded.has(g.consultantId);
            const isLoading = processing === g.consultantId;

            return (
              <div
                key={g.consultantId}
                className="rounded-xl bg-white overflow-hidden"
                style={{ border: "1px solid #e5eaf0" }}
              >
                {/* Group header */}
                <div className="flex items-center gap-3 p-4">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: "#0F2744" }}
                  >
                    {g.consultantName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{g.consultantName}</p>
                    <p className="text-xs text-gray-500">{g.email}</p>
                    {g.bankName && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {g.bankName} &middot; {g.accountNumber}
                      </p>
                    )}
                  </div>
                  <div className="text-right mr-3 shrink-0">
                    {g.ngnTotal > 0 && (
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(g.ngnTotal, "NGN")}</p>
                    )}
                    {g.usdTotal > 0 && (
                      <p className="text-sm font-bold text-gray-900">${g.usdTotal.toFixed(2)}</p>
                    )}
                    <p className="text-xs text-gray-500">{g.entries.length} entries</p>
                  </div>
                  <button
                    onClick={() => setShowConfirm(g)}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white shrink-0 mr-2 disabled:opacity-50"
                    style={{ background: "#10B981" }}
                  >
                    {isLoading ? "Processing..." : "Mark Paid"}
                  </button>
                  <button
                    onClick={() => toggleExpand(g.consultantId)}
                    className="text-gray-400 hover:text-gray-600 shrink-0"
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Expanded entries */}
                {isExpanded && (
                  <div className="border-t" style={{ borderColor: "#e5eaf0" }}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-400" style={{ background: "#F9FAFB" }}>
                          <th className="text-left px-4 py-2 font-medium">Date</th>
                          <th className="text-left px-4 py-2 font-medium">Project</th>
                          <th className="text-left px-4 py-2 font-medium">Hours</th>
                          <th className="text-right px-4 py-2 font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: "#e5eaf0" }}>
                        {g.entries.map((e) => (
                          <tr key={e.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-500">{formatDate(new Date(e.date))}</td>
                            <td className="px-4 py-2.5 text-gray-700">{e.assignment.engagement.name}</td>
                            <td className="px-4 py-2.5 text-gray-600">{e.hours}h</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-800">
                              {e.billableAmount != null
                                ? formatCurrency(e.billableAmount, e.currency)
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard size={20} style={{ color: "#0F2744" }} />
              <h3 className="text-base font-semibold text-gray-900">Confirm Payment</h3>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              Marking <span className="font-semibold">{showConfirm.entries.length} entries</span> as paid for{" "}
              <span className="font-semibold">{showConfirm.consultantName}</span>
            </p>
            {showConfirm.ngnTotal > 0 && (
              <p className="text-sm font-bold text-gray-800 mb-4">
                {formatCurrency(showConfirm.ngnTotal, "NGN")}
                {showConfirm.usdTotal > 0 && ` + $${showConfirm.usdTotal.toFixed(2)}`}
              </p>
            )}
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-gray-700 focus:outline-none"
                  style={{ borderColor: "#e5eaf0" }}
                >
                  {["Bank Transfer", "Wise", "Payoneer", "Cash", "Cheque"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">
                  Reference / Transaction ID <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. TXN-2024-001"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor: "#e5eaf0" }}
                />
              </div>
            </div>
            {payError && <p className="text-xs text-red-500">{payError}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => { setShowConfirm(null); setPayError(""); }}
                className="flex-1 rounded-lg border py-2 text-sm text-gray-600 hover:bg-gray-50"
                style={{ borderColor: "#e5eaf0" }}
              >
                Cancel
              </button>
              <button
                onClick={() => markPaid(showConfirm)}
                disabled={processing === showConfirm.consultantId}
                className="flex-1 rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#10B981" }}
              >
                {processing === showConfirm.consultantId ? "Processing..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
