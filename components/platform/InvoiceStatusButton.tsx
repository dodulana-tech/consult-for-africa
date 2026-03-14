"use client";

import { useState } from "react";

const NEXT_STATUS: Record<string, { label: string; status: string; color: string }> = {
  DRAFT:   { label: "Mark Sent",  status: "SENT",   color: "#3B82F6" },
  SENT:    { label: "Mark Paid",  status: "PAID",   color: "#10B981" },
  OVERDUE: { label: "Mark Paid",  status: "PAID",   color: "#10B981" },
};

export default function InvoiceStatusButton({ invoiceId, currentStatus }: { invoiceId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const next = NEXT_STATUS[status];
  if (!next) return null;

  async function advance() {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next.status }),
      });
      if (res.ok) setStatus(next.status);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={advance}
      disabled={loading}
      className="text-[10px] px-2 py-0.5 rounded-full font-medium disabled:opacity-50 hover:opacity-80 transition-opacity"
      style={{ background: `${next.color}22`, color: next.color, border: `1px solid ${next.color}44` }}
    >
      {loading ? "..." : next.label}
    </button>
  );
}
