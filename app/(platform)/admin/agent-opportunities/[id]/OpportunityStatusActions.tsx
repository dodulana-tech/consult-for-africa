"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["OPEN"],
  OPEN: ["ASSIGNED", "PAUSED", "CLOSED"],
  ASSIGNED: ["PAUSED", "CLOSED", "COMPLETED"],
  PAUSED: ["OPEN", "CLOSED"],
  CLOSED: ["OPEN"],
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "bg-gray-100", color: "text-gray-600" },
  OPEN: { bg: "bg-emerald-50", color: "text-emerald-700" },
  ASSIGNED: { bg: "bg-blue-50", color: "text-blue-700" },
  PAUSED: { bg: "bg-amber-50", color: "text-amber-700" },
  CLOSED: { bg: "bg-gray-100", color: "text-gray-500" },
  COMPLETED: { bg: "bg-emerald-50", color: "text-emerald-700" },
};

export default function OpportunityStatusActions({
  opportunityId,
  currentStatus,
}: {
  opportunityId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const transitions = STATUS_TRANSITIONS[currentStatus] ?? [];

  async function changeStatus(newStatus: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/agent-opportunities/${opportunityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const s = STATUS_STYLES[currentStatus] ?? STATUS_STYLES.DRAFT;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${s.bg} ${s.color}`}>
        {currentStatus}
      </span>
      {transitions.map((status) => (
        <button
          key={status}
          onClick={() => changeStatus(status)}
          disabled={loading}
          className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          {status === "OPEN" ? "Open" : status === "PAUSED" ? "Pause" : status === "CLOSED" ? "Close" : status === "COMPLETED" ? "Complete" : status === "ASSIGNED" ? "Mark Assigned" : status}
        </button>
      ))}
    </div>
  );
}
