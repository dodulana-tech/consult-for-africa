"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FeeActions({
  feeId,
  engagementId,
  currentStatus,
}: {
  feeId: string;
  engagementId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (currentStatus === "PAID") return <span className="text-xs text-slate-400">Settled</span>;

  const nextStatus = currentStatus === "PENDING" ? "INVOICED" : "PAID";
  const label = currentStatus === "PENDING" ? "Mark Invoiced" : "Mark Paid";

  async function update() {
    setLoading(true);
    await fetch(`/api/own-gig/${engagementId}/fees`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feeId, status: nextStatus }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={update}
      disabled={loading}
      className="text-xs font-medium text-[#0F2744] hover:underline disabled:opacity-50"
    >
      {loading ? "..." : label}
    </button>
  );
}
