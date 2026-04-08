"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AgentStatusActions({
  agentId,
  currentStatus,
}: {
  agentId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-600">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Optional vetting notes..."
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {(currentStatus === "APPLIED" || currentStatus === "VETTING") && (
          <>
            {currentStatus === "APPLIED" && (
              <button
                onClick={() => updateStatus("VETTING")}
                disabled={loading}
                className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
              >
                Start Vetting
              </button>
            )}
            <button
              onClick={() => updateStatus("APPROVED")}
              disabled={loading}
              className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              Approve Agent
            </button>
          </>
        )}
        {currentStatus === "APPROVED" && (
          <button
            onClick={() => updateStatus("SUSPENDED")}
            disabled={loading}
            className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          >
            Suspend
          </button>
        )}
        {currentStatus === "SUSPENDED" && (
          <button
            onClick={() => updateStatus("APPROVED")}
            disabled={loading}
            className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            Reactivate
          </button>
        )}
        {currentStatus !== "DEACTIVATED" && (
          <button
            onClick={() => updateStatus("DEACTIVATED")}
            disabled={loading}
            className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-200 disabled:opacity-50"
          >
            Deactivate
          </button>
        )}
      </div>
    </div>
  );
}
