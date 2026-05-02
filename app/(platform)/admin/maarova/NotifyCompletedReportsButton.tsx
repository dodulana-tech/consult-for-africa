"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Result {
  total: number;
  successful: number;
  failed: number;
}

export default function NotifyCompletedReportsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!confirm("Email every leader whose report is ready but has not yet been delivered. Each leader will be emailed at most once. Continue?")) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/maarova/notify-completed-reports", { method: "POST" });
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
        className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border disabled:opacity-50"
        style={{ background: "#fff", color: "#0F2744", borderColor: "#e5eaf0" }}
        title="Email every leader with a READY report whose deliveredAt is null"
      >
        {busy ? "Sending..." : "Email Reports to Leaders"}
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
