"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STAGE_OPTIONS = [
  { value: "PROSPECT", label: "Prospect" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "PITCHED", label: "Pitched" },
  { value: "NEGOTIATING", label: "Negotiating" },
  { value: "VERBAL_COMMIT", label: "Verbal Commit" },
  { value: "CLOSED_WON", label: "Closed Won" },
  { value: "CLOSED_LOST", label: "Closed Lost" },
  { value: "DISQUALIFIED", label: "Disqualified" },
];

/** Returns the set of stages this deal can transition to from the current stage */
function getNextStages(current: string): string[] {
  const pipeline = ["PROSPECT", "CONTACTED", "PITCHED", "NEGOTIATING", "VERBAL_COMMIT"];
  const idx = pipeline.indexOf(current);

  // Terminal stages have no further transitions
  if (["CLOSED_WON", "CLOSED_LOST", "DISQUALIFIED"].includes(current)) return [];

  const next: string[] = [];

  // Next sequential stage
  if (idx >= 0 && idx < pipeline.length - 1) {
    next.push(pipeline[idx + 1]);
  }

  // From VERBAL_COMMIT, can close won or lost
  if (current === "VERBAL_COMMIT") {
    next.push("CLOSED_WON", "CLOSED_LOST");
  }

  // Any active stage can be disqualified
  next.push("DISQUALIFIED");

  return next;
}

export default function DealStageUpdater({
  dealId,
  currentStage,
}: {
  dealId: string;
  currentStage: string;
}) {
  const router = useRouter();
  const allowedNext = getNextStages(currentStage);
  const [stage, setStage] = useState(currentStage);
  const [closedValue, setClosedValue] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showClosedValue = stage === "CLOSED_WON";
  const isTerminal = ["CLOSED_WON", "CLOSED_LOST", "DISQUALIFIED"].includes(currentStage);

  async function handleUpdate() {
    setLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = { stage, notes: notes || undefined };
      if (showClosedValue && closedValue) {
        body.closedValue = closedValue;
      }

      const res = await fetch(`/api/agent-portal/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Failed to update deal");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (isTerminal) {
    return (
      <div className="rounded-xl bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">
        This deal is <span className="font-semibold">{currentStage.replace(/_/g, " ")}</span> and cannot be updated.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-600">Next Stage</label>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
        >
          <option value={currentStage}>
            {STAGE_OPTIONS.find((o) => o.value === currentStage)?.label ?? currentStage} (current)
          </option>
          {allowedNext.map((val) => {
            const opt = STAGE_OPTIONS.find((o) => o.value === val);
            return (
              <option key={val} value={val}>
                {opt?.label ?? val}
              </option>
            );
          })}
        </select>
      </div>

      {showClosedValue && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-600">Closed Value (NGN)</label>
          <input
            type="number"
            value={closedValue}
            onChange={(e) => setClosedValue(e.target.value)}
            placeholder="e.g. 5000000"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
          />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-gray-600">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="What happened?"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm resize-none focus:border-[#0F2744] focus:outline-none focus:ring-2 focus:ring-[#0F2744]/20"
        />
      </div>

      <button
        onClick={handleUpdate}
        disabled={loading || stage === currentStage}
        className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
        style={{ background: stage === "CLOSED_WON" ? "#059669" : stage === "CLOSED_LOST" ? "#DC2626" : "#0F2744" }}
      >
        {loading ? "Updating..." : stage === "CLOSED_WON" ? "Close Deal (Won)" : stage === "CLOSED_LOST" ? "Close Deal (Lost)" : "Update Stage"}
      </button>
      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
}
