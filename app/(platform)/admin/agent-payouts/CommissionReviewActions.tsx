"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, ShieldCheck, XCircle } from "lucide-react";

export default function CommissionReviewActions({
  commissionId,
  dealId,
  currentStatus,
  dealVerified,
}: {
  commissionId: string;
  dealId: string;
  currentStatus: string;
  dealVerified: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(newStatus: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/agent-commissions/${commissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to update");
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {currentStatus === "PENDING" && (
          <>
            <button
              onClick={() => updateStatus("VERIFIED")}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ShieldCheck className="h-3 w-3" />
              )}
              Verify
            </button>
            {dealVerified && (
              <button
                onClick={() => updateStatus("APPROVED")}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle className="h-3 w-3" />
                )}
                Approve
              </button>
            )}
          </>
        )}

        {currentStatus === "VERIFIED" && (
          <button
            onClick={() => updateStatus("APPROVED")}
            disabled={loading || !dealVerified}
            title={!dealVerified ? "Deal must be verified first" : "Approve commission"}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCircle className="h-3 w-3" />
            )}
            Approve
          </button>
        )}

        {(currentStatus === "PENDING" || currentStatus === "VERIFIED") && (
          <button
            onClick={() => updateStatus("CANCELLED")}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            Reject
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!dealVerified && currentStatus !== "CANCELLED" && (
        <p className="text-xs text-amber-600">Deal not yet verified by admin</p>
      )}
    </div>
  );
}
