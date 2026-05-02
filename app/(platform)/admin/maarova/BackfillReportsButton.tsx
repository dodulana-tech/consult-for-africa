"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Result {
  reportsGenerated: { total: number; successful: number; failed: number };
  pdfsRendered: { total: number; successful: number; failed: number };
}

export default function BackfillReportsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!confirm("Generate reports for any completed assessments missing one, and render PDFs for any reports without a PDF. This may take several minutes for large queues.")) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/maarova/backfill-reports", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Backfill failed");
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
        title="Generate missing reports + render missing PDFs for all completed assessments"
      >
        {busy ? "Backfilling..." : "Backfill Reports + PDFs"}
      </button>
      {result && (
        <span className="text-xs text-gray-500 self-center">
          Reports: {result.reportsGenerated.successful}/{result.reportsGenerated.total} ok ·
          PDFs: {result.pdfsRendered.successful}/{result.pdfsRendered.total} ok
        </span>
      )}
      {error && <span className="text-xs text-red-600 self-center">{error}</span>}
    </>
  );
}
