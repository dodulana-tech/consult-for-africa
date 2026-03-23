"use client";

import { useState } from "react";

interface Props {
  requestId: string;
  status: string;
  allDeploymentsResponded: boolean;
}

const STATUS_ACTIONS: Record<string, { label: string; targetStatus: string; color: string; bg: string }[]> = {
  SUBMITTED: [{ label: "Start Matching", targetStatus: "MATCHING", color: "#92400E", bg: "#FEF3C7" }],
  SHORTLIST_SENT: [{ label: "Activate", targetStatus: "ACTIVE", color: "#065F46", bg: "#D1FAE5" }],
  CONFIRMED: [{ label: "Activate", targetStatus: "ACTIVE", color: "#065F46", bg: "#D1FAE5" }],
  ACTIVE: [{ label: "Complete", targetStatus: "COMPLETED", color: "#15803D", bg: "#F0FDF4" }],
};

export default function RequestStatusActions({ requestId, status, allDeploymentsResponded }: Props) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [error, setError] = useState("");

  const actions = STATUS_ACTIONS[currentStatus];

  // For SHORTLIST_SENT, only show Activate if all deployments have responded
  const filteredActions = actions?.filter((a) => {
    if (currentStatus === "SHORTLIST_SENT" && a.targetStatus === "ACTIVE") {
      return allDeploymentsResponded;
    }
    return true;
  });

  if (!filteredActions || filteredActions.length === 0) return null;

  async function handleAction(targetStatus: string) {
    if (!confirm(`Change request status to ${targetStatus}?`)) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/partner-requests/${requestId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (!res.ok) {
        const text = await res.text();
        setError(text || "Failed to update status.");
        return;
      }
      setCurrentStatus(targetStatus);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: "1px solid #F3F4F6" }}>
      {filteredActions.map((action) => (
        <button
          key={action.targetStatus}
          onClick={() => handleAction(action.targetStatus)}
          disabled={loading}
          className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity disabled:opacity-50"
          style={{ background: action.bg, color: action.color, border: `1px solid ${action.bg}` }}
        >
          {loading ? "Updating..." : action.label}
        </button>
      ))}
      <button
        onClick={() => handleAction("CANCELLED")}
        disabled={loading}
        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity disabled:opacity-50"
        style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FEE2E2" }}
      >
        Cancel
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
