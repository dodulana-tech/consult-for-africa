"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AssignmentActions({
  assignmentId,
  currentStatus,
  opportunityId,
}: {
  assignmentId: string;
  currentStatus: string;
  opportunityId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/agent-opportunities/${opportunityId}/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    APPLIED: "bg-blue-50 text-blue-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    ACTIVE: "bg-emerald-50 text-emerald-700",
    PAUSED: "bg-amber-50 text-amber-700",
    REMOVED: "bg-red-50 text-red-600",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[currentStatus] ?? "bg-gray-100 text-gray-600"}`}>
        {currentStatus}
      </span>
      {currentStatus === "APPLIED" && (
        <button onClick={() => updateStatus("ACTIVE")} disabled={loading} className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50">
          Approve
        </button>
      )}
      {currentStatus === "ACTIVE" && (
        <button onClick={() => updateStatus("PAUSED")} disabled={loading} className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50">
          Pause
        </button>
      )}
      {currentStatus === "PAUSED" && (
        <button onClick={() => updateStatus("ACTIVE")} disabled={loading} className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50">
          Reactivate
        </button>
      )}
    </div>
  );
}
