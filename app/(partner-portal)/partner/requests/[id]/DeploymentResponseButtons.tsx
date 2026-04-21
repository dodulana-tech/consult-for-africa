"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseApiError } from "@/lib/parse-api-error";

export default function DeploymentResponseButtons({
  requestId,
  deploymentId,
}: {
  requestId: string;
  deploymentId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeclineReason, setShowDeclineReason] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [error, setError] = useState("");

  async function handleAction(action: "ACCEPT" | "DECLINE") {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/partner-portal/requests/${requestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deploymentId,
          action,
          declineReason: action === "DECLINE" ? declineReason : undefined,
        }),
      });

      if (!res.ok) {
        const msg = await parseApiError(res);
        setError(msg || "Failed to submit response.");
        return;
      }

      router.refresh();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (showDeclineReason) {
    return (
      <div className="space-y-3">
        {error && (
          <p className="text-xs" style={{ color: "#991B1B" }}>{error}</p>
        )}
        <textarea
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          placeholder="Please tell us why this candidate is not a good fit (optional)"
          rows={2}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none"
          style={{ border: "1px solid #e5eaf0", color: "#111827" }}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAction("DECLINE")}
            disabled={loading}
            className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition-opacity"
            style={{
              background: "#991B1B",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "..." : "Confirm Decline"}
          </button>
          <button
            onClick={() => setShowDeclineReason(false)}
            className="text-xs font-medium text-gray-500 hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p className="text-xs mb-2" style={{ color: "#991B1B" }}>{error}</p>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleAction("ACCEPT")}
          disabled={loading}
          className="text-xs font-semibold px-4 py-2 rounded-lg text-white transition-opacity"
          style={{
            background: "#065F46",
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "..." : "Accept"}
        </button>
        <button
          onClick={() => setShowDeclineReason(true)}
          disabled={loading}
          className="text-xs font-semibold px-4 py-2 rounded-lg transition-opacity"
          style={{
            background: "#FEE2E2",
            color: "#991B1B",
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
