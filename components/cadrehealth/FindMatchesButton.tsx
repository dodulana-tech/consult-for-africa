"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FindMatchesButton({ mandateId }: { mandateId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function findMatches() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/cadre/mandates/${mandateId}/match`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to find matches");
      const data = await res.json();
      setResult(`Found ${data.matchCount} match${data.matchCount !== 1 ? "es" : ""}`);
      router.refresh();
    } catch {
      setResult("Failed to find matches. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && <span className="text-xs text-gray-500">{result}</span>}
      <button
        onClick={findMatches}
        disabled={loading}
        className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-medium text-white hover:bg-[#C4A030] disabled:opacity-50"
      >
        {loading ? "Searching..." : "Find Matches"}
      </button>
    </div>
  );
}
