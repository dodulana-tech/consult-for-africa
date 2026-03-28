"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export default function ApprovalActions({
  engagementId,
  hasConflict,
}: {
  engagementId: string;
  hasConflict: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showNoteFor, setShowNoteFor] = useState<"reject" | "request_changes" | null>(null);
  const [note, setNote] = useState("");

  async function handleAction(action: "approve" | "reject" | "request_changes") {
    if ((action === "reject" || action === "request_changes") && !showNoteFor) {
      setShowNoteFor(action);
      return;
    }

    if (action === "reject" && !note.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/own-gig/${engagementId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Something went wrong");
        return;
      }

      router.refresh();
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
      setShowNoteFor(null);
      setNote("");
    }
  }

  return (
    <div className="space-y-3">
      {hasConflict && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
          <AlertTriangle size={14} />
          This gig may overlap with an existing client. Review the conflict details above before approving.
        </div>
      )}

      {showNoteFor && (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              showNoteFor === "reject"
                ? "Reason for rejection (required)..."
                : "Describe the changes needed..."
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A574]/40 focus:border-[#D4A574] min-h-[80px]"
          />
          <div className="flex gap-2">
            <button
              disabled={loading || (showNoteFor === "reject" && !note.trim())}
              onClick={() => handleAction(showNoteFor)}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: showNoteFor === "reject" ? "#DC2626" : "#D97706" }}
            >
              {loading ? "Submitting..." : showNoteFor === "reject" ? "Confirm Rejection" : "Send Changes Request"}
            </button>
            <button
              onClick={() => { setShowNoteFor(null); setNote(""); }}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showNoteFor && (
        <div className="flex gap-2">
          <button
            disabled={loading}
            onClick={() => handleAction("approve")}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "#059669" }}
          >
            {loading ? "..." : "Approve"}
          </button>
          <button
            disabled={loading}
            onClick={() => handleAction("request_changes")}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "#D97706" }}
          >
            Request Changes
          </button>
          <button
            disabled={loading}
            onClick={() => handleAction("reject")}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "#DC2626" }}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
