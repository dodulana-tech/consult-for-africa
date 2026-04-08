"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApplyButton({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function apply() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/agent-portal/opportunities/${opportunityId}/apply`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to apply");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={apply}
        disabled={loading}
        className="w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-50"
        style={{ background: "#D4AF37" }}
      >
        {loading ? "Applying..." : "Apply for this Opportunity"}
      </button>
      {error && <p className="mt-2 text-center text-xs text-red-500">{error}</p>}
    </div>
  );
}
