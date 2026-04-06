"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function VerifyButton({ professionalId }: { professionalId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    if (!confirm("Mark this professional as verified?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cadre/admin/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId }),
      });
      if (!res.ok) throw new Error("Failed to verify");
      router.refresh();
    } catch {
      alert("Failed to verify professional. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleVerify}
      disabled={loading}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
    >
      {loading ? "Verifying..." : "Verify"}
    </button>
  );
}
