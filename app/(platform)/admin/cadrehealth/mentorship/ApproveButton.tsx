"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApproveButton({
  mentorProfileId,
}: {
  mentorProfileId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: "approve" | "reject") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cadre/mentorship/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorProfileId, action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action}`);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-[10px] text-red-500">{error}</span>}
      <button
        onClick={() => handleAction("reject")}
        disabled={loading}
        className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
        style={{ borderColor: "#E8EBF0" }}
      >
        Reject
      </button>
      <button
        onClick={() => handleAction("approve")}
        disabled={loading}
        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #059669, #047857)",
        }}
      >
        {loading ? "..." : "Approve"}
      </button>
    </div>
  );
}
