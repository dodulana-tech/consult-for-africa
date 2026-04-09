"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function WithdrawButton({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function withdraw() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/agent-portal/opportunities/${opportunityId}/withdraw`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to withdraw");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <div className="mt-3">
        <button
          onClick={() => setConfirming(true)}
          className="w-full rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          Withdraw
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-gray-500 text-center">
        Are you sure you want to withdraw from this opportunity?
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => setConfirming(false)}
          className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={withdraw}
          disabled={loading}
          className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Withdrawing..." : "Confirm"}
        </button>
      </div>
      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
}
