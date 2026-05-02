"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BackfillCvButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const run = async () => {
    if (!confirm("Re-fetch and re-extract CVs for all applicants missing CV text, then re-run AI screening on each. This may take a few minutes.")) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/maarova-circle/backfill-cv", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Backfill failed");
      setResult(`${data.successful} ok, ${data.failed} failed`);
      router.refresh();
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Failed");
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
        title="Re-extract CV text and re-run AI screening for applicants missing CV text"
      >
        {busy ? "Re-extracting..." : "Backfill CV text"}
      </button>
      {result && <span className="text-xs text-gray-500">{result}</span>}
    </>
  );
}
