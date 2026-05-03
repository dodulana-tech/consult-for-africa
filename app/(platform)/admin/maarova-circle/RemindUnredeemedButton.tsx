"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Result {
  total: number;
  successful: number;
  failed: number;
  cooldownHours: number;
}

export default function RemindUnredeemedButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!confirm("Re-email every approved Founding Circle leader who hasn't clicked their onboard link yet. 24-hour cooldown per leader. Continue?")) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/maarova-circle/remind-unredeemed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={run}
        disabled={busy}
        className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-white disabled:opacity-50"
        style={{ borderColor: "#E8EBF0", color: "#0F2744" }}
        title="Re-email approved leaders who haven't clicked their onboard link. 24h cooldown."
      >
        {busy ? "Sending..." : "Remind unredeemed"}
      </button>
      {result && (
        <span className="text-xs text-gray-500 self-center">
          Sent: {result.successful}/{result.total}{result.failed > 0 ? ` · ${result.failed} failed` : ""}
        </span>
      )}
      {error && <span className="text-xs text-red-600 self-center">{error}</span>}
    </>
  );
}
