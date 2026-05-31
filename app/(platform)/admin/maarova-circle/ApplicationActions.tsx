"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ActionStatus = "PENDING_REVIEW" | "APPROVED" | "DECLINED";

export default function ApplicationActions({
  applicationId,
  status,
}: {
  applicationId: string;
  status: ActionStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [showDecline, setShowDecline] = useState(false);
  const [confirmOverride, setConfirmOverride] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const call = async (
    path: string,
    payload?: Record<string, unknown>,
    opts?: { successMsg?: string; refresh?: boolean },
  ) => {
    setBusy(path);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/maarova-circle/${applicationId}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      if (opts?.successMsg) setNotice(opts.successMsg);
      if (opts?.refresh !== false) router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const primaryBtn = "rounded-lg px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50";
  const navyBg = { background: "linear-gradient(135deg, #0F2744, #1a3a55)" };

  return (
    <div className="mt-4 pt-4 border-t flex items-center gap-2 flex-wrap" style={{ borderColor: "#E8EBF0" }}>
      {status === "PENDING_REVIEW" && (
        <>
          <button onClick={() => call("approve")} disabled={busy !== null} className={primaryBtn} style={navyBg}>
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
                onClick={() => call("decline", { declineReason: reason })}
                disabled={busy !== null}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
                style={{ background: "#991B1B" }}
              >
                {busy === "decline" ? "Sending..." : "Confirm decline"}
              </button>
            </div>
          )}
        </>
      )}

      {status === "DECLINED" && (
        <>
          {!confirmOverride ? (
            <button
              onClick={() => setConfirmOverride(true)}
              disabled={busy !== null}
              className="rounded-lg border px-4 py-2 text-xs font-semibold transition hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: "#D4AF37", color: "#92400E" }}
            >
              Override decline and approve
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-600">
                This consumes a slot and sends the approval email. Confirm?
              </span>
              <button onClick={() => call("approve")} disabled={busy !== null} className={primaryBtn} style={navyBg}>
                {busy === "approve" ? "Approving..." : "Yes, approve"}
              </button>
              <button
                onClick={() => setConfirmOverride(false)}
                disabled={busy !== null}
                className="rounded-lg border px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                style={{ borderColor: "#E8EBF0", color: "#475569" }}
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}

      {status === "APPROVED" && (
        <button
          onClick={() => call("resend-approval", undefined, { successMsg: "Approval email sent.", refresh: false })}
          disabled={busy !== null}
          className="rounded-lg border px-4 py-2 text-xs font-semibold transition hover:bg-gray-50 disabled:opacity-50"
          style={{ borderColor: "#E8EBF0", color: "#0F2744" }}
        >
          {busy === "resend-approval" ? "Sending..." : "Resend approval email"}
        </button>
      )}

      {notice && <span className="text-xs" style={{ color: "#065F46" }}>{notice}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
