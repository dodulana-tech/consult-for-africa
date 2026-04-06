"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ALL_STATUSES = [
  "OPEN",
  "SOURCING",
  "SHORTLISTED",
  "INTERVIEWING",
  "OFFER_EXTENDED",
  "PLACED",
  "CLOSED",
  "CANCELLED",
];

export function MandateStatusControls({
  mandateId,
  currentStatus,
}: {
  mandateId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(currentStatus);

  async function updateStatus() {
    if (selected === currentStatus) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cadre/mandates?id=${mandateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selected }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      router.refresh();
    } catch {
      alert("Failed to update status. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm focus:border-[#0B3C5D] focus:outline-none focus:ring-1 focus:ring-[#0B3C5D]"
      >
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <button
        onClick={updateStatus}
        disabled={loading || selected === currentStatus}
        className="rounded-lg bg-[#0B3C5D] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A3350] disabled:opacity-50"
      >
        {loading ? "Updating..." : "Update Status"}
      </button>
    </div>
  );
}
