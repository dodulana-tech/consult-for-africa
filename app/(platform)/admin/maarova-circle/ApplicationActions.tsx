"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ApplicationActions({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "decline" | null>(null);
  const [showDecline, setShowDecline] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const act = async (action: "approve" | "decline", payload?: { declineReason?: string }) => {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/maarova-circle/${applicationId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
      setBusy(null);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t flex items-center gap-2 flex-wrap" style={{ borderColor: "#E8EBF0" }}>
      <button
        onClick={() => act("approve")}
        disabled={busy !== null}
        className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #0F2744, #1a3a55)" }}
      >
        {busy === "approve" ? "Approving..." : "Approve and send invite"}
      </button>
      <button
        onClick={() => setShowDecline((v) => !v)}
        disabled={busy !== null}
        className="rounded-lg border px-4 py-2 text-xs font-medium transition hover:bg-gray-50 disabled:opacity-50"
        style={{ borderColor: "#E8EBF0", color: "#991B1B" }}
      >
        Decline
      </button>
      {showDecline && (
        <div className="w-full mt-2 flex items-center gap-2">
          <input
            type="text"
            placeholder="Optional reason (sent in email)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="flex-1 rounded-lg border px-3 py-2 text-xs"
            style={{ borderColor: "#E8EBF0" }}
          />
          <button
            onClick={() => act("decline", { declineReason: reason })}
            disabled={busy !== null}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
            style={{ background: "#991B1B" }}
          >
            {busy === "decline" ? "Sending..." : "Confirm decline"}
          </button>
        </div>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
