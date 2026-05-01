"use client";

import { useState } from "react";

export default function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cadre/subscribe", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start payment");
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="block w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #0B3C5D, #0d4a73)" }}
      >
        {loading ? "Redirecting to payment..." : "Pay N1,500 with Paystack"}
      </button>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    </>
  );
}
